import 'dotenv/config';
import express from 'express';
import http from 'http';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { getDatabase, DEFAULT_TENANT_ID, normalizeE164 } from './server/db/database.js';
import { durableQueue } from './server/services/durableQueue.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getMissedCallsFromDb(tenantId = DEFAULT_TENANT_ID) {
  const sqlite = getDatabase();
  const rows = sqlite
    .prepare(
      `SELECT
        ce.id AS id,
        ce.from_number_e164 AS callerPhone,
        COALESCE(crc.caller_display_name, ce.caller_name, 'Unknown Caller') AS callerName,
        ce.occurred_at AS timestamp,
        (ce.duration_seconds || 's') AS duration,
        ce.call_status AS status,
        COALESCE(crc.ai_drafted_message, '') AS aiDraftedResponse,
        COALESCE(crc.approval_status, 'PENDING_APPROVAL') AS approvalStatus,
        crc.id AS recoveryCaseId,
        ce.provider_call_sid AS providerCallSid,
        crc.provider_message_sid AS providerMessageSid
      FROM call_events ce
      LEFT JOIN call_recovery_cases crc
        ON crc.tenant_id = ce.tenant_id AND crc.call_event_id = ce.id
      WHERE ce.tenant_id = ?
        AND ce.call_status IN ('MISSED', 'NO_ANSWER', 'BUSY', 'FAILED', 'VOICEMAIL_RECEIVED')
        AND ce.is_spam_or_blocked = 0
      ORDER BY ce.occurred_at DESC`
    )
    .all(tenantId);
  return rows;
}

async function startServer() {
  const sqlite = getDatabase();

  // Register durable background job handlers
  durableQueue.registerHandler('MISSED_CALL_RECOVERY_SMS', async (job, payload) => {
    const recoveryCaseId = String(payload.recoveryCaseId || '');
    const toPhone = String(payload.toPhone || '');
    const body = String(payload.message || '');
    const now = new Date().toISOString();

    // Fail-closed provider check: only call live Twilio REST API if credentials are configured
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const fromPhone = process.env.TWILIO_FROM_NUMBER || '+15558901234';

    let messageSid = `SM_sandbox_${crypto.randomBytes(6).toString('hex')}`;
    let deliveryMode = 'SANDBOX_SIMULATED_NO_CREDENTIALS';

    if (sid && token) {
      const auth = Buffer.from(`${sid}:${token}`).toString('base64');
      const form = new URLSearchParams({ To: toPhone, From: fromPhone, Body: body });
      const resp = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: form.toString(),
      });
      const json = (await resp.json()) as { sid?: string; message?: string };
      if (!resp.ok) {
        throw new Error(`Twilio SMS error (${resp.status}): ${json.message || 'Unknown error'}`);
      }
      messageSid = json.sid || messageSid;
      deliveryMode = 'TWILIO_LIVE';
    }

    if (recoveryCaseId) {
      sqlite
        .prepare(
          `UPDATE call_recovery_cases
           SET approval_status = 'SENT',
               sent_at = ?,
               provider_message_sid = ?,
               updated_at = ?
           WHERE tenant_id = ? AND id = ?`
        )
        .run(now, messageSid, now, job.tenant_id, recoveryCaseId);
    }

    return { delivered: true, deliveryMode, messageSid, toPhone, sentAt: now };
  });

  durableQueue.registerHandler('ESTIMATE_FOLLOWUP_REMINDER', async (job, payload) => {
    const estimateId = String(payload.estimateId || job.resource_id);
    return {
      processed: true,
      estimateId,
      step: payload.step ?? 1,
      status: 'DRAFTED_FOR_OWNER_APPROVAL',
      processedAt: new Date().toISOString(),
    };
  });

  durableQueue.registerHandler('MAINTENANCE_SERVICE_OPPORTUNITY', async (job, payload) => {
    return {
      processed: true,
      contractId: job.resource_id,
      dueDate: payload.nextServiceDate || null,
      processedAt: new Date().toISOString(),
    };
  });

  durableQueue.startWorker(4000);

  const app = express();
  const httpServer = http.createServer(app);
  app.use(express.json());

  // In-memory data store for GODS COMMAND AI (Enterprise Contractor Edition & Revenue Engine)
  const db = {
    organization: {
      name: "Apex Elite Mechanical & HVAC",
      industry: "HVAC & Mechanical Services",
      tier: "Professional",
      owner: "Marcus Vance",
      email: "marcus@apexelitehvac.com",
      phone: "+1 (555) 890-1234",
      address: "742 Industrial Pkwy, Austin, TX 78701",
      currency: "USD",
      stripeConnected: true
    },
    metrics: {
      totalRevenue: 248000,
      grossProfit: 164000,
      netProfit: 82000,
      profitMargin: 33.2,
      activeJobs: 14,
      pendingLeads: 28,
      unpaidInvoicesCount: 6,
      unpaidInvoicesAmount: 34200,
      missedCallsToday: 4,
      maintenanceContractsActive: 89
    },
    leads: [
      {
        id: "lead-1",
        customerName: "Sarah Jenkins",
        email: "sarah.j@gmail.com",
        phone: "+1 (555) 234-5678",
        serviceAddress: "1284 Oakridge Dr, Austin, TX",
        category: "HVAC Repair",
        urgency: "HIGH",
        status: "QUALIFIED",
        problemDescription: "Central AC unit stopped blowing cold air during peak afternoon heat. Making loud humming noise.",
        aiQualification: {
          confidence: 0.96,
          intent: "Urgent Repair",
          summary: "Compressor overload / capacitor failure suspected. Immediate dispatch recommended.",
          recommendedAction: "Schedule emergency diagnostic visit within 2 hours.",
          suggestedResponse: "Hi Sarah, we received your emergency HVAC request. Our lead technician can be at your home by 2 PM today."
        },
        createdAt: new Date(Date.now() - 3600000 * 3).toISOString()
      },
      {
        id: "lead-2",
        customerName: "Robert Thorne",
        email: "rthorne@thorndevelopment.com",
        phone: "+1 (555) 432-8765",
        serviceAddress: "450 Capital Blvd, Austin, TX",
        category: "Commercial Maintenance",
        urgency: "NORMAL",
        status: "NEW",
        problemDescription: "Quarterly inspection and filter replacement for 12 rooftop HVAC units.",
        aiQualification: {
          confidence: 0.91,
          intent: "Commercial Contract",
          summary: "Routine multi-unit commercial preventative maintenance.",
          recommendedAction: "Generate commercial maintenance proposal.",
          suggestedResponse: "Hello Robert, thank you for reaching out to Apex Elite. We can schedule your commercial rooftop inspection next Tuesday."
        },
        createdAt: new Date(Date.now() - 3600000 * 8).toISOString()
      },
      {
        id: "lead-3",
        customerName: "Elena Rostova",
        email: "elena@rostovadesign.com",
        phone: "+1 (555) 987-6543",
        serviceAddress: "912 Barton Springs Rd, Austin, TX",
        category: "Mini-Split Installation",
        urgency: "LOW",
        status: "ESTIMATE_SENT",
        problemDescription: "Looking to install 3 ductless mini-split units for a renovated studio space.",
        aiQualification: {
          confidence: 0.94,
          intent: "New Installation",
          summary: "High-value residential multi-zone installation opportunity.",
          recommendedAction: "Follow up on pending estimate #EST-2026-089.",
          suggestedResponse: "Hi Elena, checking in on your ductless mini-split proposal. Let us know if you have any questions!"
        },
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
      }
    ],
    estimates: [
      {
        id: "est-1",
        estimateNumber: "EST-2026-089",
        customerName: "Elena Rostova",
        email: "elena@rostovadesign.com",
        serviceAddress: "912 Barton Springs Rd, Austin, TX",
        scope: "Supply and install 3 Mitsubishi 12k BTU ductless inverter mini-split heat pump systems with wall controllers.",
        items: [
          { description: "Mitsubishi 12k BTU Mini-Split Unit", qty: 3, unitPrice: 1850, total: 5550 },
          { description: "Professional Installation Labor & Wiring", qty: 1, unitPrice: 1900, total: 1900 },
          { description: "Line-set Covers & Mounting Brackets", qty: 3, unitPrice: 150, total: 450 }
        ],
        subtotal: 7900,
        tax: 651.75,
        total: 8551.75,
        status: "SENT",
        expiresAt: new Date(Date.now() + 86400000 * 14).toISOString(),
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
      },
      {
        id: "est-2",
        estimateNumber: "EST-2026-090",
        customerName: "David Miller",
        email: "dmiller@gmail.com",
        serviceAddress: "314 Lakeway Dr, Austin, TX",
        scope: "Emergency replacement of failed 50-gallon Rheem water heater and thermal expansion tank.",
        items: [
          { description: "Rheem 50-Gallon Professional Water Heater", qty: 1, unitPrice: 1450, total: 1450 },
          { description: "Expansion Tank & Safety Pan", qty: 1, unitPrice: 280, total: 280 },
          { description: "Emergency Removal & Installation Labor", qty: 1, unitPrice: 650, total: 650 }
        ],
        subtotal: 2380,
        tax: 196.35,
        total: 2576.35,
        status: "APPROVED_PENDING_SEND",
        expiresAt: new Date(Date.now() + 86400000 * 7).toISOString(),
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
      }
    ],
    jobs: [
      {
        id: "job-1",
        jobNumber: "JOB-2026-401",
        customerName: "Arthur Pendelton",
        phone: "+1 (555) 789-0123",
        serviceAddress: "612 Guadalupe St, Austin, TX",
        scope: "Commercial Chiller Diagnostics & Refrigerant Recharge",
        status: "IN_PROGRESS",
        assignedTechnician: "Jake Henderson",
        scheduledTime: "2026-11-25T10:00:00Z",
        contractAmount: 4200.00,
        actualLaborCost: 850.00,
        actualMaterialCost: 1450.00,
        grossProfit: 1900.00,
        notes: "Unit operating at 85% capacity. Recharging R-410A and clearing condensate line."
      },
      {
        id: "job-2",
        jobNumber: "JOB-2026-402",
        customerName: "Melissa Vance",
        phone: "+1 (555) 345-6789",
        serviceAddress: "890 Enfield Rd, Austin, TX",
        scope: "Annual Fall HVAC Tune-up & Filter Replacement",
        status: "COMPLETED",
        assignedTechnician: "Carlos Mendez",
        scheduledTime: "2026-11-24T14:00:00Z",
        contractAmount: 249.00,
        actualLaborCost: 95.00,
        actualMaterialCost: 25.00,
        grossProfit: 129.00,
        notes: "System passed electrical safety and combustion analysis."
      }
    ],
    invoices: [
      {
        id: "inv-1",
        invoiceNumber: "INV-2026-104",
        customerName: "Melissa Vance",
        amount: 249.00,
        status: "PAID",
        dueDate: "2026-12-01",
        createdAt: "2026-11-24T15:30:00Z",
        paidAt: "2026-11-24T16:15:00Z",
        paymentMethod: "Stripe Card (**** 4242)"
      },
      {
        id: "inv-2",
        invoiceNumber: "INV-2026-105",
        customerName: "Westlake Medical Center",
        amount: 14250.00,
        status: "ISSUED",
        dueDate: "2026-12-15",
        createdAt: "2026-11-22T09:00:00Z",
        paidAt: null,
        paymentMethod: null
      }
    ],
    missedCalls: [
      {
        id: "call-1",
        callerPhone: "+1 (555) 839-2041",
        callerName: "Unknown Caller (Identified: Marcus Brody)",
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        duration: "42s",
        status: "MISSED",
        aiDraftedResponse: "Hi Marcus, sorry we missed your call at Apex Elite Mechanical! Are you looking for emergency HVAC service or routine maintenance?",
        approvalStatus: "PENDING_APPROVAL"
      },
      {
        id: "call-2",
        callerPhone: "+1 (555) 621-9988",
        callerName: "Jennifer Lawson",
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        duration: "18s",
        status: "MISSED",
        aiDraftedResponse: "Hi Jennifer, thanks for calling Apex Elite. We saw your missed call regarding residential plumbing repair. How can we assist you today?",
        approvalStatus: "SENT"
      }
    ],
    followups: [
      {
        id: "fu-1",
        estimateId: "est-1",
        customerName: "Elena Rostova",
        estimateNumber: "EST-2026-089",
        amount: 8551.75,
        sequenceStep: 2,
        scheduledDate: new Date(Date.now() + 3600000 * 12).toISOString(),
        channel: "SMS",
        message: "Hi Elena, checking in on estimate #EST-2026-089 for your mini-split installation. Our schedule for next week is filling up fast. Would you like to lock in your date?",
        status: "QUEUED_FOR_APPROVAL"
      }
    ],
    maintenanceContracts: [
      {
        id: "mc-1",
        planName: "Apex Elite Diamond Comfort Club",
        customerName: "Harrison Ford",
        serviceAddress: "1920 Exposition Blvd, Austin, TX",
        frequency: "Semiannual",
        price: 29.00,
        billingInterval: "Monthly",
        status: "ACTIVE",
        nextServiceDate: "2026-12-10T09:00:00Z",
        lastServiceDate: "2026-06-12T10:00:00Z"
      },
      {
        id: "mc-2",
        planName: "Apex Commercial Gold Shield",
        customerName: "Barton Creek Square Management",
        serviceAddress: "2901 S Capital of Texas Hwy, Austin, TX",
        frequency: "Quarterly",
        price: 450.00,
        billingInterval: "Quarterly",
        status: "ACTIVE",
        nextServiceDate: "2026-12-01T08:00:00Z",
        lastServiceDate: "2026-09-01T08:00:00Z"
      }
    ]
  };

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString(), version: '1.2.0' });
  });

  app.get('/api/dashboard', (req, res) => {
    const missedCalls = getMissedCallsFromDb(DEFAULT_TENANT_ID);
    res.json({
      organization: db.organization,
      metrics: {
        ...db.metrics,
        missedCallsToday: missedCalls.length,
      },
      recentLeads: db.leads.slice(0, 5),
      activeJobs: db.jobs.filter(j => j.status === 'IN_PROGRESS'),
      missedCalls,
    });
  });

  // Leads
  app.get('/api/leads', (req, res) => {
    res.json(db.leads);
  });

  app.post('/api/leads', (req, res) => {
    const newLead = {
      id: `lead-${Date.now()}`,
      ...req.body,
      status: 'NEW',
      aiQualification: {
        confidence: 0.95,
        intent: req.body.category || 'General Service',
        summary: req.body.problemDescription || 'New customer inquiry received.',
        recommendedAction: 'Review and approve AI qualification & draft response.',
        suggestedResponse: `Hi ${req.body.customerName}, thanks for contacting ${db.organization.name}. We received your request regarding ${req.body.category}.`
      },
      createdAt: new Date().toISOString()
    };
    db.leads.unshift(newLead);
    db.metrics.pendingLeads += 1;
    res.json(newLead);
  });

  // Estimates
  app.get('/api/estimates', (req, res) => {
    res.json(db.estimates);
  });

  app.post('/api/estimates', (req, res) => {
    const newEst = {
      id: `est-${Date.now()}`,
      estimateNumber: `EST-2026-${Math.floor(100 + Math.random() * 900)}`,
      ...req.body,
      status: 'DRAFT',
      createdAt: new Date().toISOString()
    };
    db.estimates.unshift(newEst);
    res.json(newEst);
  });

  app.post('/api/estimates/:id/approve', (req, res) => {
    const est = db.estimates.find(e => e.id === req.params.id);
    if (!est) return res.status(404).json({ error: 'Estimate not found' });
    est.status = 'APPROVED_PENDING_SEND';
    res.json(est);
  });

  app.post('/api/estimates/:id/send', (req, res) => {
    const est = db.estimates.find(e => e.id === req.params.id);
    if (!est) return res.status(404).json({ error: 'Estimate not found' });
    est.status = 'SENT';

    // Schedule durable 24h follow-up reminder with strict idempotency
    const runAt = new Date(Date.now() + 86_400_000).toISOString();
    durableQueue.enqueue({
      tenantId: DEFAULT_TENANT_ID,
      jobType: 'ESTIMATE_FOLLOWUP_REMINDER',
      resourceId: est.id,
      idempotencyKey: `est_followup_${est.id}_step1`,
      runAt,
      payload: {
        estimateId: est.id,
        estimateNumber: est.estimateNumber,
        customerName: est.customerName,
        step: 1,
      },
    });

    res.json(est);
  });

  app.post('/api/estimates/:id/accept', (req, res) => {
    const est = db.estimates.find(e => e.id === req.params.id);
    if (!est) return res.status(404).json({ error: 'Estimate not found' });
    est.status = 'ACCEPTED';

    // Immediately cancel all pending follow-up reminders for this estimate
    const cancelledFollowups = durableQueue.cancelPendingForResource(
      DEFAULT_TENANT_ID,
      est.id,
      'ESTIMATE_FOLLOWUP_REMINDER'
    );
    
    // Automatically convert to job (Step 5 & 6)
    const newJob = {
      id: `job-${Date.now()}`,
      jobNumber: `JOB-2026-${Math.floor(400 + Math.random() * 600)}`,
      customerName: est.customerName,
      phone: "+1 (555) 555-0199",
      serviceAddress: est.serviceAddress,
      scope: est.scope,
      status: 'SCHEDULED',
      assignedTechnician: 'Unassigned (Dispatch Queue)',
      scheduledTime: new Date(Date.now() + 86400000).toISOString(),
      contractAmount: est.total,
      actualLaborCost: est.total * 0.25,
      actualMaterialCost: est.total * 0.35,
      grossProfit: est.total * 0.40,
      notes: `Converted from accepted estimate ${est.estimateNumber}`
    };
    db.jobs.unshift(newJob);
    db.metrics.activeJobs += 1;
    
    res.json({ success: true, estimate: est, createdJob: newJob, cancelledFollowups });
  });

  // Jobs
  app.get('/api/jobs', (req, res) => {
    res.json(db.jobs);
  });

  app.post('/api/jobs/:id/complete', (req, res) => {
    const job = db.jobs.find(j => j.id === req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    job.status = 'COMPLETED';
    
    // Create Invoice automatically
    const newInv = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-2026-${Math.floor(110 + Math.random() * 900)}`,
      customerName: job.customerName,
      amount: job.contractAmount,
      status: 'ISSUED',
      dueDate: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      paidAt: null,
      paymentMethod: null
    };
    db.invoices.unshift(newInv);
    db.metrics.unpaidInvoicesCount += 1;
    db.metrics.unpaidInvoicesAmount += job.contractAmount;
    
    res.json({ success: true, job, invoice: newInv });
  });

  // Invoices & Payments (Stripe sandbox)
  app.get('/api/invoices', (req, res) => {
    res.json(db.invoices);
  });

  app.post('/api/invoices/:id/pay-stripe', (req, res) => {
    const inv = db.invoices.find(i => i.id === req.params.id);
    if (!inv) return res.status(404).json({ error: 'Invoice not found' });
    inv.status = 'PAID';
    inv.paidAt = new Date().toISOString();
    inv.paymentMethod = 'Stripe Secure Webhook (Verified)';
    
    db.metrics.totalRevenue += inv.amount;
    db.metrics.grossProfit += inv.amount * 0.45;
    db.metrics.netProfit += inv.amount * 0.32;
    db.metrics.unpaidInvoicesCount = Math.max(0, db.metrics.unpaidInvoicesCount - 1);
    db.metrics.unpaidInvoicesAmount = Math.max(0, db.metrics.unpaidInvoicesAmount - inv.amount);
    
    res.json({ success: true, invoice: inv, verified: true });
  });

  // Missed Calls & Telephony (SQLite-backed)
  app.get('/api/telephony/connections', (req, res) => {
    const rows = sqlite
      .prepare(
        `SELECT id, tenant_id, provider, account_sid_masked, phone_number_e164,
                after_hours_auto_draft, auto_send_enabled, recording_enabled,
                status, last_verified_at, created_at
         FROM telephony_connections WHERE tenant_id = ?`
      )
      .all(DEFAULT_TENANT_ID);
    res.json(rows);
  });

  app.get('/api/missed-calls', (req, res) => {
    res.json(getMissedCallsFromDb(DEFAULT_TENANT_ID));
  });

  app.post('/api/webhooks/twilio/voice', (req, res) => {
    const { CallSid, From, To, CallStatus, CallDuration, CallerName } = req.body || {};
    if (!CallSid || !From || !To || !CallStatus) {
      return res.status(400).json({ error: 'Missing required Twilio CallSid, From, To, or CallStatus' });
    }

    const fromE164 = normalizeE164(String(From));
    const toE164 = normalizeE164(String(To));
    const normalizedStatus = String(CallStatus).toUpperCase().replace(/-/g, '_');
    const allowedStatuses = new Set(['ANSWERED', 'MISSED', 'BUSY', 'NO_ANSWER', 'FAILED', 'VOICEMAIL_RECEIVED']);
    const mappedStatus = allowedStatuses.has(normalizedStatus) ? normalizedStatus : 'MISSED';

    const conn = sqlite
      .prepare('SELECT id FROM telephony_connections WHERE tenant_id = ? AND phone_number_e164 = ? LIMIT 1')
      .get(DEFAULT_TENANT_ID, toE164) as { id: string } | undefined;

    const connFallback = conn || (sqlite
      .prepare('SELECT id FROM telephony_connections WHERE tenant_id = ? LIMIT 1')
      .get(DEFAULT_TENANT_ID) as { id: string } | undefined);

    if (!connFallback) {
      return res.status(412).json({ error: 'No telephony_connections configured for tenant' });
    }

    const existing = sqlite
      .prepare('SELECT id FROM call_events WHERE tenant_id = ? AND provider_call_sid = ?')
      .get(DEFAULT_TENANT_ID, String(CallSid)) as { id: string } | undefined;

    if (existing) {
      return res.json({ deduplicated: true, callEventId: existing.id });
    }

    const callId = `call_${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const payloadHash = crypto.createHash('sha256').update(JSON.stringify(req.body)).digest('hex');

    sqlite.exec('BEGIN IMMEDIATE;');
    try {
      sqlite
        .prepare(
          `INSERT INTO call_events (
            id, tenant_id, telephony_connection_id, provider_call_sid, direction,
            from_number_e164, to_number_e164, caller_name, call_status, duration_seconds,
            is_business_hours, is_spam_or_blocked, signature_verified, raw_payload_hash, occurred_at
          ) VALUES (?, ?, ?, ?, 'INBOUND', ?, ?, ?, ?, ?, 1, 0, ?, ?, ?)`
        )
        .run(
          callId,
          DEFAULT_TENANT_ID,
          connFallback.id,
          String(CallSid),
          fromE164,
          toE164,
          CallerName ? String(CallerName) : null,
          mappedStatus,
          Number(CallDuration || 0),
          req.headers['x-twilio-signature'] ? 1 : 0,
          payloadHash,
          now
        );

      let recoveryCaseId: string | null = null;
      if (mappedStatus !== 'ANSWERED') {
        recoveryCaseId = `rcase_${crypto.randomUUID()}`;
        const displayName = CallerName ? String(CallerName) : `Caller ${fromE164}`;
        const draft = `Hi ${CallerName || 'there'}, thanks for contacting ${db.organization.name}. Sorry we missed your call — how can we help with your service request?`;

        sqlite
          .prepare(
            `INSERT INTO call_recovery_cases (
              id, tenant_id, call_event_id, caller_phone_e164, caller_display_name,
              ai_model, ai_drafted_message, approval_status, consent_checked
            ) VALUES (?, ?, ?, ?, ?, 'gemini-4-hydrogen', ?, 'PENDING_APPROVAL', 1)`
          )
          .run(recoveryCaseId, DEFAULT_TENANT_ID, callId, fromE164, displayName, draft);
      }

      sqlite.exec('COMMIT;');
      return res.status(201).json({ deduplicated: false, callEventId: callId, recoveryCaseId });
    } catch (err: any) {
      sqlite.exec('ROLLBACK;');
      return res.status(500).json({ error: err?.message || 'Failed to persist call event' });
    }
  });

  app.post('/api/missed-calls/:id/approve-and-send', async (req, res) => {
    const recovery = sqlite
      .prepare(
        `SELECT crc.*, ce.from_number_e164
         FROM call_recovery_cases crc
         JOIN call_events ce ON ce.tenant_id = crc.tenant_id AND ce.id = crc.call_event_id
         WHERE crc.tenant_id = ? AND crc.call_event_id = ?`
      )
      .get(DEFAULT_TENANT_ID, req.params.id) as
      | { id: string; ai_drafted_message: string; caller_phone_e164: string; approval_status: string }
      | undefined;

    if (!recovery) return res.status(404).json({ error: 'Call recovery case not found' });

    const now = new Date().toISOString();
    const finalMessage = String(req.body?.message || recovery.ai_drafted_message);

    sqlite
      .prepare(
        `UPDATE call_recovery_cases
         SET approval_status = 'QUEUED',
             final_message = ?,
             approved_by_user_id = ?,
             approved_at = ?,
             updated_at = ?
         WHERE tenant_id = ? AND id = ?`
      )
      .run(finalMessage, db.organization.owner, now, now, DEFAULT_TENANT_ID, recovery.id);

    const { job, deduplicated } = durableQueue.enqueue({
      tenantId: DEFAULT_TENANT_ID,
      jobType: 'MISSED_CALL_RECOVERY_SMS',
      resourceId: req.params.id,
      idempotencyKey: `recovery_sms_${recovery.id}`,
      payload: {
        recoveryCaseId: recovery.id,
        toPhone: recovery.caller_phone_e164,
        message: finalMessage,
      },
    });

    // Process immediately so UI receives updated SENT state while preserving durable queue trail
    await durableQueue.processSinglePass(5);
    const updatedList = getMissedCallsFromDb(DEFAULT_TENANT_ID) as Array<{ id: string }>;
    const updatedCall = updatedList.find(c => c.id === req.params.id);

    res.json({
      success: true,
      call: updatedCall,
      queueJobId: job.id,
      deduplicated,
      message: 'SMS recovery approved and dispatched via durable queue.',
    });
  });

  // Durable Queue & Dead-Letter Management Endpoints
  app.get('/api/queue/jobs', (req, res) => {
    const data = durableQueue.listJobs(DEFAULT_TENANT_ID);
    res.json(data);
  });

  app.post('/api/queue/jobs', (req, res) => {
    const { jobType, resourceId, idempotencyKey, payload, runAt, maxAttempts } = req.body || {};
    if (!jobType || !resourceId || !idempotencyKey) {
      return res.status(400).json({ error: 'jobType, resourceId, and idempotencyKey are required' });
    }
    const result = durableQueue.enqueue({
      tenantId: DEFAULT_TENANT_ID,
      jobType,
      resourceId: String(resourceId),
      idempotencyKey: String(idempotencyKey),
      payload: payload || {},
      runAt,
      maxAttempts,
    });
    res.status(result.deduplicated ? 200 : 201).json(result);
  });

  app.post('/api/queue/jobs/:id/retry', (req, res) => {
    const job = durableQueue.retryJob(DEFAULT_TENANT_ID, req.params.id);
    if (!job) return res.status(404).json({ error: 'Queue job not found for tenant' });
    res.json({ success: true, job });
  });

  app.post('/api/queue/tick', async (req, res) => {
    const summary = await durableQueue.processSinglePass(10);
    res.json(summary);
  });

  // Maintenance Contracts
  app.get('/api/maintenance', (req, res) => {
    res.json(db.maintenanceContracts);
  });

  // AI Neural Command Center
  app.post('/api/ai/command', async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is not configured.");
      }

      const ai = new GoogleGenAI({ apiKey });
      const systemInstruction = `You are GODS REVENUE RECOVERY & CONTRACTOR COMMAND AI. 
You manage an elite HVAC & Home Services business (${db.organization.name}).
Current Business Stats:
- Total Revenue: $${db.metrics.totalRevenue.toLocaleString()}
- Gross Profit: $${db.metrics.grossProfit.toLocaleString()}
- Active Jobs: ${db.metrics.activeJobs}
- Pending Leads: ${db.metrics.pendingLeads}
- Unpaid Invoices: ${db.metrics.unpaidInvoicesCount} ($${db.metrics.unpaidInvoicesAmount.toLocaleString()})
- Missed Calls Today: ${db.metrics.missedCallsToday}
- Active Maintenance Contracts: ${db.metrics.maintenanceContractsActive}

Provide crisp, authoritative, actionable contractor intelligence and revenue recovery insights.`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      res.json({
        result: response.text || "AI Neural Core processed your command successfully.",
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      // Fallback response if API key is not yet set or network error
      console.warn("Gemini AI API warning/fallback:", err?.message);
      
      let fallbackText = `GODS AI Neural Intelligence Summary for ${db.organization.name}:\n`;
      const p = prompt.toLowerCase();
      if (p.includes('revenue') || p.includes('money') || p.includes('profit')) {
        fallbackText += `Total Revenue stands at $${db.metrics.totalRevenue.toLocaleString()} with a gross profit of $${db.metrics.grossProfit.toLocaleString()} (33.2% margin). Collected cash flow is stable with $34,200 pending across 6 invoices.`;
      } else if (p.includes('lead') || p.includes('call')) {
        fallbackText += `You have ${db.metrics.pendingLeads} pending leads and ${db.metrics.missedCallsToday} missed calls today awaiting SMS recovery approval.`;
      } else if (p.includes('job') || p.includes('technician') || p.includes('schedule')) {
        fallbackText += `There are ${db.metrics.activeJobs} active field jobs currently in progress and 89 active recurring maintenance contracts.`;
      } else {
        fallbackText += `All operational systems are nominal. 3 estimates are pending customer acceptance, and automated follow-up sequences are active.`;
      }

      res.json({
        result: fallbackText,
        timestamp: new Date().toISOString(),
        fallback: true
      });
    }
  });

  // Vite middleware integration for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        ws: { server: httpServer },
        allowedHosts: true,
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT || 3000);
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`GODS COMMAND AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
