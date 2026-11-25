-- ============================================================================
-- GODS COMMAND AI — V1.2.0 TELEPHONY, RECOVERY & DURABLE QUEUE SCHEMA
-- Migration: 001_v1_2_telephony_and_queue.sql
-- Enforces strict multi-tenant isolation via composite (tenant_id, id) FKs,
-- unique idempotency constraints, and performance-optimized covering indexes.
-- ============================================================================

-- Ensure core tenant anchor tables exist for foreign key integrity
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  industry TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'Professional',
  owner_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  stripe_connected INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  service_address TEXT,
  category TEXT NOT NULL,
  urgency TEXT NOT NULL CHECK (urgency IN ('LOW', 'NORMAL', 'HIGH', 'EMERGENCY')),
  status TEXT NOT NULL DEFAULT 'NEW',
  problem_description TEXT,
  ai_qualification_json TEXT,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  UNIQUE (tenant_id, id)
);

CREATE INDEX IF NOT EXISTS idx_leads_tenant_phone
  ON leads (tenant_id, phone);

CREATE INDEX IF NOT EXISTS idx_leads_tenant_status_created
  ON leads (tenant_id, status, created_at DESC);

-- ============================================================================
-- 1. TELEPHONY CONNECTIONS
-- Stores tenant-scoped telephony provider configurations (e.g., Twilio Voice/SMS)
-- Credentials are stored encrypted / referenced via secret key IDs, never plaintext.
-- ============================================================================
CREATE TABLE IF NOT EXISTS telephony_connections (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('TWILIO', 'RINGCENTRAL', 'AIRCALL', 'CUSTOM')),
  account_sid_masked TEXT NOT NULL,
  credential_ref TEXT NOT NULL,
  phone_number_e164 TEXT NOT NULL,
  webhook_secret_hash TEXT NOT NULL,
  business_hours_json TEXT NOT NULL DEFAULT '{"timezone":"America/Chicago","monFri":"08:00-18:00"}',
  after_hours_auto_draft INTEGER NOT NULL DEFAULT 1,
  auto_send_enabled INTEGER NOT NULL DEFAULT 0, -- Must default to 0 (human approval required)
  recording_enabled INTEGER NOT NULL DEFAULT 0, -- Default OFF for consent compliance
  status TEXT NOT NULL DEFAULT 'NOT_CONFIGURED'
    CHECK (status IN ('NOT_CONFIGURED', 'CONNECTED', 'DEGRADED', 'SUSPENDED', 'ERROR')),
  last_verified_at TEXT,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),

  -- Strict tenant isolation composite key & unique phone binding
  UNIQUE (tenant_id, id),
  UNIQUE (tenant_id, phone_number_e164)
);

CREATE INDEX IF NOT EXISTS idx_telephony_connections_tenant_status
  ON telephony_connections (tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_telephony_connections_phone_lookup
  ON telephony_connections (phone_number_e164, status);

-- ============================================================================
-- 2. CALL EVENTS
-- Immutable log of inbound/outbound telephony webhook events with provider SID
-- deduplication and caller normalization.
-- ============================================================================
CREATE TABLE IF NOT EXISTS call_events (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  telephony_connection_id TEXT NOT NULL,
  provider_call_sid TEXT NOT NULL,
  direction TEXT NOT NULL DEFAULT 'INBOUND' CHECK (direction IN ('INBOUND', 'OUTBOUND')),
  from_number_e164 TEXT NOT NULL,
  to_number_e164 TEXT NOT NULL,
  caller_name TEXT,
  call_status TEXT NOT NULL CHECK (
    call_status IN ('ANSWERED', 'MISSED', 'BUSY', 'NO_ANSWER', 'FAILED', 'VOICEMAIL_RECEIVED')
  ),
  duration_seconds INTEGER NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0),
  is_business_hours INTEGER NOT NULL DEFAULT 1,
  is_spam_or_blocked INTEGER NOT NULL DEFAULT 0,
  matched_lead_id TEXT,
  signature_verified INTEGER NOT NULL DEFAULT 0,
  raw_payload_hash TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  received_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),

  -- Strict tenant-scoped foreign keys (prevents cross-tenant FK linking)
  UNIQUE (tenant_id, id),
  UNIQUE (tenant_id, provider_call_sid),
  FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, telephony_connection_id)
    REFERENCES telephony_connections(tenant_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, matched_lead_id)
    REFERENCES leads(tenant_id, id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_call_events_tenant_occurred
  ON call_events (tenant_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_call_events_tenant_caller
  ON call_events (tenant_id, from_number_e164, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_call_events_tenant_status
  ON call_events (tenant_id, call_status, is_spam_or_blocked);

-- ============================================================================
-- 3. CALL RECOVERY CASES
-- Tracks the recovery lifecycle for eligible missed/unanswered calls:
-- DRAFT -> PENDING_APPROVAL -> APPROVED -> QUEUED -> SENT / SUPPRESSED / REJECTED
-- ============================================================================
CREATE TABLE IF NOT EXISTS call_recovery_cases (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  call_event_id TEXT NOT NULL,
  lead_id TEXT,
  caller_phone_e164 TEXT NOT NULL,
  caller_display_name TEXT,
  ai_model TEXT,
  ai_drafted_message TEXT NOT NULL,
  final_message TEXT,
  approval_status TEXT NOT NULL DEFAULT 'PENDING_APPROVAL' CHECK (
    approval_status IN (
      'DRAFT',
      'PENDING_APPROVAL',
      'APPROVED',
      'QUEUED',
      'SENT',
      'DELIVERED',
      'REJECTED',
      'SPAM_EXCLUDED',
      'SUPPRESSED_OPTOUT',
      'FAILED'
    )
  ),
  consent_checked INTEGER NOT NULL DEFAULT 0,
  opt_out_suppressed INTEGER NOT NULL DEFAULT 0,
  approved_by_user_id TEXT,
  approved_at TEXT,
  sent_at TEXT,
  provider_message_sid TEXT,
  attributed_estimate_id TEXT,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),

  -- Strict 1:1 per call_event per tenant + composite tenant FK integrity
  UNIQUE (tenant_id, id),
  UNIQUE (tenant_id, call_event_id),
  FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, call_event_id)
    REFERENCES call_events(tenant_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, lead_id)
    REFERENCES leads(tenant_id, id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_call_recovery_tenant_approval
  ON call_recovery_cases (tenant_id, approval_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_call_recovery_tenant_phone
  ON call_recovery_cases (tenant_id, caller_phone_e164);

-- ============================================================================
-- 4. DURABLE QUEUE JOBS & DEAD LETTERS
-- Database-backed durable workflow & messaging job queue with idempotency,
-- lease locking for server restart recovery, exponential backoff, and DLQ.
-- ============================================================================
CREATE TABLE IF NOT EXISTS durable_queue_jobs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL CHECK (
    job_type IN (
      'MISSED_CALL_RECOVERY_SMS',
      'ESTIMATE_FOLLOWUP_REMINDER',
      'MAINTENANCE_SERVICE_OPPORTUNITY',
      'PAYMENT_RECONCILIATION'
    )
  ),
  resource_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (
    status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'DEAD_LETTERED')
  ),
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  next_run_at TEXT NOT NULL,
  locked_at TEXT,
  locked_until TEXT,
  worker_id TEXT,
  last_error TEXT,
  result_json TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),

  UNIQUE (tenant_id, id),
  UNIQUE (tenant_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_durable_queue_poll
  ON durable_queue_jobs (status, next_run_at ASC);

CREATE INDEX IF NOT EXISTS idx_durable_queue_tenant_status
  ON durable_queue_jobs (tenant_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_durable_queue_stale_locks
  ON durable_queue_jobs (status, locked_until);

CREATE TABLE IF NOT EXISTS durable_queue_dead_letters (
  id TEXT PRIMARY KEY,
  original_job_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  attempts INTEGER NOT NULL,
  failure_reason TEXT NOT NULL,
  failed_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  retried_at TEXT,

  FOREIGN KEY (tenant_id, original_job_id)
    REFERENCES durable_queue_jobs(tenant_id, id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_dlq_tenant_failed
  ON durable_queue_dead_letters (tenant_id, failed_at DESC);
