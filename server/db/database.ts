import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..', '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const DB_PATH = path.join(DATA_DIR, 'gods_command.db');
const MIGRATION_PATH = path.join(ROOT_DIR, 'db', 'migrations', '001_v1_2_telephony_and_queue.sql');

export const DEFAULT_TENANT_ID = 'tenant_apex_hvac_01';

let dbInstance: DatabaseSync | null = null;

export function getDatabase(): DatabaseSync {
  if (dbInstance) return dbInstance;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const db = new DatabaseSync(DB_PATH);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec('PRAGMA busy_timeout = 5000;');

  const migrationSql = fs.readFileSync(MIGRATION_PATH, 'utf-8');
  db.exec(migrationSql);

  seedInitialData(db);
  dbInstance = db;
  return db;
}

function seedInitialData(db: DatabaseSync) {
  const existingOrg = db
    .prepare('SELECT id FROM organizations WHERE id = ?')
    .get(DEFAULT_TENANT_ID) as { id: string } | undefined;

  if (!existingOrg) {
    db.prepare(
      `INSERT INTO organizations (
        id, name, industry, tier, owner_name, email, phone, address, currency, stripe_connected
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      DEFAULT_TENANT_ID,
      'Apex Elite Mechanical & HVAC',
      'HVAC & Mechanical Services',
      'Professional',
      'Marcus Vance',
      'marcus@apexelitehvac.com',
      '+1 (555) 890-1234',
      '742 Industrial Pkwy, Austin, TX 78701',
      'USD',
      1
    );
  }

  const existingConn = db
    .prepare('SELECT id FROM telephony_connections WHERE tenant_id = ? LIMIT 1')
    .get(DEFAULT_TENANT_ID) as { id: string } | undefined;

  if (!existingConn) {
    const connId = 'tel_conn_apex_01';
    const secretHash = crypto.createHash('sha256').update('twilio_sandbox_webhook_secret').digest('hex');

    db.prepare(
      `INSERT INTO telephony_connections (
        id, tenant_id, provider, account_sid_masked, credential_ref, phone_number_e164,
        webhook_secret_hash, after_hours_auto_draft, auto_send_enabled, recording_enabled,
        status, last_verified_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      connId,
      DEFAULT_TENANT_ID,
      'TWILIO',
      'AC****************************8f2a',
      'ENV:TWILIO_AUTH_TOKEN',
      '+15558901234',
      secretHash,
      1,
      0,
      0,
      process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN ? 'CONNECTED' : 'NOT_CONFIGURED',
      new Date().toISOString()
    );

    const call1Id = 'call-1';
    const call2Id = 'call-2';

    db.prepare(
      `INSERT INTO call_events (
        id, tenant_id, telephony_connection_id, provider_call_sid, direction,
        from_number_e164, to_number_e164, caller_name, call_status, duration_seconds,
        is_business_hours, is_spam_or_blocked, signature_verified, raw_payload_hash, occurred_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      call1Id,
      DEFAULT_TENANT_ID,
      connId,
      'CA_seed_0001',
      'INBOUND',
      '+15558392041',
      '+15558901234',
      'Marcus Brody',
      'MISSED',
      42,
      1,
      0,
      1,
      crypto.createHash('sha256').update('CA_seed_0001').digest('hex'),
      new Date(Date.now() - 1800000).toISOString()
    );

    db.prepare(
      `INSERT INTO call_events (
        id, tenant_id, telephony_connection_id, provider_call_sid, direction,
        from_number_e164, to_number_e164, caller_name, call_status, duration_seconds,
        is_business_hours, is_spam_or_blocked, signature_verified, raw_payload_hash, occurred_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      call2Id,
      DEFAULT_TENANT_ID,
      connId,
      'CA_seed_0002',
      'INBOUND',
      '+15556219988',
      '+15558901234',
      'Jennifer Lawson',
      'NO_ANSWER',
      18,
      1,
      0,
      1,
      crypto.createHash('sha256').update('CA_seed_0002').digest('hex'),
      new Date(Date.now() - 7200000).toISOString()
    );

    db.prepare(
      `INSERT INTO call_recovery_cases (
        id, tenant_id, call_event_id, caller_phone_e164, caller_display_name,
        ai_model, ai_drafted_message, approval_status, consent_checked
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      'rcase-1',
      DEFAULT_TENANT_ID,
      call1Id,
      '+15558392041',
      'Unknown Caller (Identified: Marcus Brody)',
      'gemini-4-hydrogen',
      'Hi Marcus, sorry we missed your call at Apex Elite Mechanical! Are you looking for emergency HVAC service or routine maintenance?',
      'PENDING_APPROVAL',
      1
    );

    db.prepare(
      `INSERT INTO call_recovery_cases (
        id, tenant_id, call_event_id, caller_phone_e164, caller_display_name,
        ai_model, ai_drafted_message, final_message, approval_status, consent_checked,
        approved_by_user_id, approved_at, sent_at, provider_message_sid
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      'rcase-2',
      DEFAULT_TENANT_ID,
      call2Id,
      '+15556219988',
      'Jennifer Lawson',
      'gemini-4-hydrogen',
      'Hi Jennifer, thanks for calling Apex Elite. We saw your missed call regarding residential plumbing repair. How can we assist you today?',
      'Hi Jennifer, thanks for calling Apex Elite. We saw your missed call regarding residential plumbing repair. How can we assist you today?',
      'SENT',
      1,
      'owner_marcus_vance',
      new Date(Date.now() - 7000000).toISOString(),
      new Date(Date.now() - 6995000).toISOString(),
      'SM_seed_0002'
    );
  }
}

export function normalizeE164(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return phone.startsWith('+') ? phone : `+${digits}`;
}
