import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { getDatabase, DEFAULT_TENANT_ID } from '../server/db/database.js';
import { DurableQueueService } from '../server/services/durableQueue.js';

async function runTests() {
  const db = getDatabase();
  const queue = new DurableQueueService('test-worker');

  // 1. Verify tables exist
  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table'")
    .all() as Array<{ name: string }>;
  const tableNames = new Set(tables.map((t) => t.name));

  for (const required of [
    'telephony_connections',
    'call_events',
    'call_recovery_cases',
    'durable_queue_jobs',
    'durable_queue_dead_letters',
  ]) {
    assert.ok(tableNames.has(required), `Missing required table: ${required}`);
  }
  console.log('PASS 1: All required SQLite schema tables exist.');

  // 2. Verify strict composite tenant isolation FK constraint rejects cross-tenant reference
  const otherTenantId = 'tenant_other_99';
  db.prepare(
    `INSERT OR IGNORE INTO organizations (id, name, industry, owner_name, email, phone, address)
     VALUES (?, 'Other Contractor', 'Plumbing', 'Jane Doe', 'jane@other.com', '+15550009999', '99 Test Rd')`
  ).run(otherTenantId);

  let crossTenantBlocked = false;
  try {
    db.prepare(
      `INSERT INTO call_events (
        id, tenant_id, telephony_connection_id, provider_call_sid, direction,
        from_number_e164, to_number_e164, call_status, duration_seconds, raw_payload_hash, occurred_at
      ) VALUES (?, ?, 'tel_conn_apex_01', ?, 'INBOUND', '+15551112222', '+15558901234', 'MISSED', 10, 'abc', ?)`
    ).run(
      `call_cross_${crypto.randomUUID()}`,
      otherTenantId,
      `CA_cross_${crypto.randomUUID()}`,
      new Date().toISOString()
    );
  } catch (err: any) {
    crossTenantBlocked = true;
  }
  assert.ok(crossTenantBlocked, 'Cross-tenant foreign key insertion must be blocked by SQLite!');
  console.log('PASS 2: Composite (tenant_id, id) FK strictly blocks cross-tenant call_events linking.');

  // 3. Verify idempotency deduplication
  const idemKey = `test_idem_${crypto.randomUUID()}`;
  const first = queue.enqueue({
    tenantId: DEFAULT_TENANT_ID,
    jobType: 'ESTIMATE_FOLLOWUP_REMINDER',
    resourceId: 'est-test-1',
    idempotencyKey: idemKey,
    payload: { estimateId: 'est-test-1', step: 1 },
  });
  const second = queue.enqueue({
    tenantId: DEFAULT_TENANT_ID,
    jobType: 'ESTIMATE_FOLLOWUP_REMINDER',
    resourceId: 'est-test-1',
    idempotencyKey: idemKey,
    payload: { estimateId: 'est-test-1', step: 1 },
  });
  assert.equal(first.deduplicated, false);
  assert.equal(second.deduplicated, true);
  assert.equal(first.job.id, second.job.id);
  console.log('PASS 3: Idempotency key prevents duplicate durable queue jobs.');

  // 4. Verify crash/restart stale lock recovery & completion
  const expiredLock = new Date(Date.now() - 60_000).toISOString();
  db.prepare(
    `UPDATE durable_queue_jobs SET status = 'PROCESSING', locked_until = ?, worker_id = 'dead-worker' WHERE id = ?`
  ).run(expiredLock, first.job.id);

  queue.registerHandler('ESTIMATE_FOLLOWUP_REMINDER', async () => ({ sent: true }));
  const summary = await queue.processSinglePass(10);
  assert.ok(summary.recovered >= 1, 'Expected stale lock to be recovered on restart pass');

  const updated = db
    .prepare('SELECT status FROM durable_queue_jobs WHERE id = ?')
    .get(first.job.id) as { status: string };
  assert.equal(updated.status, 'COMPLETED');
  console.log('PASS 4: Stale lock recovery after simulated restart completed the job.');

  // 5. Verify failure -> Dead-Letter Queue -> Manual Retry
  const failKey = `test_fail_${crypto.randomUUID()}`;
  const failing = queue.enqueue({
    tenantId: DEFAULT_TENANT_ID,
    jobType: 'MAINTENANCE_SERVICE_OPPORTUNITY',
    resourceId: 'mc-test-1',
    idempotencyKey: failKey,
    payload: { contractId: 'mc-test-1' },
    maxAttempts: 1,
  });
  queue.registerHandler('MAINTENANCE_SERVICE_OPPORTUNITY', async () => {
    throw new Error('Simulated provider outage');
  });
  await queue.processSinglePass(10);

  const dlqJob = db
    .prepare('SELECT status, last_error FROM durable_queue_jobs WHERE id = ?')
    .get(failing.job.id) as { status: string; last_error: string };
  assert.equal(dlqJob.status, 'DEAD_LETTERED');
  assert.match(dlqJob.last_error, /Simulated provider outage/);

  const retried = queue.retryJob(DEFAULT_TENANT_ID, failing.job.id);
  assert.equal(retried?.status, 'PENDING');
  console.log('PASS 5: Dead-letter handling and manual retry verified.');

  // Cleanup test records
  db.prepare('DELETE FROM durable_queue_jobs WHERE id IN (?, ?)').run(first.job.id, failing.job.id);
  db.prepare('DELETE FROM organizations WHERE id = ?').run(otherTenantId);
  console.log('ALL V1.2 TELEPHONY & DURABLE QUEUE VERIFICATION CHECKS PASSED.');
}

runTests().catch((err) => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
