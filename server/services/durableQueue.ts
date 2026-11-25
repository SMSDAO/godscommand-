import crypto from 'crypto';
import { getDatabase } from '../db/database.js';

export type QueueJobType =
  | 'MISSED_CALL_RECOVERY_SMS'
  | 'ESTIMATE_FOLLOWUP_REMINDER'
  | 'MAINTENANCE_SERVICE_OPPORTUNITY'
  | 'PAYMENT_RECONCILIATION';

export type QueueJobStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'DEAD_LETTERED';

export interface DurableQueueJob {
  id: string;
  tenant_id: string;
  job_type: QueueJobType;
  resource_id: string;
  idempotency_key: string;
  payload_json: string;
  status: QueueJobStatus;
  attempts: number;
  max_attempts: number;
  next_run_at: string;
  locked_at: string | null;
  locked_until: string | null;
  worker_id: string | null;
  last_error: string | null;
  result_json: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DeadLetterRecord {
  id: string;
  original_job_id: string;
  tenant_id: string;
  job_type: QueueJobType;
  resource_id: string;
  idempotency_key: string;
  payload_json: string;
  attempts: number;
  failure_reason: string;
  failed_at: string;
  retried_at: string | null;
}

export interface EnqueueJobInput {
  tenantId: string;
  jobType: QueueJobType;
  resourceId: string;
  idempotencyKey: string;
  payload: Record<string, unknown>;
  runAt?: string;
  maxAttempts?: number;
}

export type JobHandler = (job: DurableQueueJob, parsedPayload: Record<string, unknown>) => Promise<Record<string, unknown>>;

export class DurableQueueService {
  private workerId: string;
  private handlers = new Map<QueueJobType, JobHandler>();
  private timer: NodeJS.Timeout | null = null;
  private isPolling = false;
  private leaseMs = 30_000;

  constructor(workerId = `worker-${process.pid}-${crypto.randomBytes(3).toString('hex')}`) {
    this.workerId = workerId;
  }

  registerHandler(jobType: QueueJobType, handler: JobHandler) {
    this.handlers.set(jobType, handler);
  }

  /**
   * Enqueues a durable job with strict tenant-scoped idempotency protection.
   * Duplicate idempotency keys return the existing persisted record without creating duplicates.
   */
  enqueue(input: EnqueueJobInput): { job: DurableQueueJob; deduplicated: boolean } {
    const db = getDatabase();
    const existing = db
      .prepare('SELECT * FROM durable_queue_jobs WHERE tenant_id = ? AND idempotency_key = ?')
      .get(input.tenantId, input.idempotencyKey) as DurableQueueJob | undefined;

    if (existing) {
      return { job: existing, deduplicated: true };
    }

    const id = `jq_${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const nextRunAt = input.runAt ?? now;
    const maxAttempts = input.maxAttempts ?? 5;

    db.prepare(
      `INSERT INTO durable_queue_jobs (
        id, tenant_id, job_type, resource_id, idempotency_key, payload_json,
        status, attempts, max_attempts, next_run_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'PENDING', 0, ?, ?, ?, ?)`
    ).run(
      id,
      input.tenantId,
      input.jobType,
      input.resourceId,
      input.idempotencyKey,
      JSON.stringify(input.payload),
      maxAttempts,
      nextRunAt,
      now,
      now
    );

    const created = db
      .prepare('SELECT * FROM durable_queue_jobs WHERE tenant_id = ? AND id = ?')
      .get(input.tenantId, id) as unknown as DurableQueueJob;

    return { job: created, deduplicated: false };
  }

  /**
   * Reclaims jobs whose lease expired (e.g., due to process crash or server restart).
   */
  recoverStaleLocks(): number {
    const db = getDatabase();
    const now = new Date().toISOString();
    const result = db
      .prepare(
        `UPDATE durable_queue_jobs
         SET status = 'PENDING',
             locked_at = NULL,
             locked_until = NULL,
             worker_id = NULL,
             last_error = COALESCE(last_error, 'Recovered after stale worker lease / server restart'),
             updated_at = ?
         WHERE status = 'PROCESSING' AND locked_until IS NOT NULL AND locked_until <= ?`
      )
      .run(now, now);

    return Number(result.changes || 0);
  }

  /**
   * Atomically claims the next due job using a SQLite IMMEDIATE transaction.
   */
  claimNextDueJob(): DurableQueueJob | null {
    const db = getDatabase();
    const now = new Date().toISOString();
    const lockedUntil = new Date(Date.now() + this.leaseMs).toISOString();

    db.exec('BEGIN IMMEDIATE;');
    try {
      const candidate = db
        .prepare(
          `SELECT id, tenant_id FROM durable_queue_jobs
           WHERE status = 'PENDING' AND next_run_at <= ?
           ORDER BY next_run_at ASC
           LIMIT 1`
        )
        .get(now) as { id: string; tenant_id: string } | undefined;

      if (!candidate) {
        db.exec('COMMIT;');
        return null;
      }

      db.prepare(
        `UPDATE durable_queue_jobs
         SET status = 'PROCESSING',
             attempts = attempts + 1,
             locked_at = ?,
             locked_until = ?,
             worker_id = ?,
             updated_at = ?
         WHERE id = ? AND tenant_id = ? AND status = 'PENDING'`
      ).run(now, lockedUntil, this.workerId, now, candidate.id, candidate.tenant_id);

      const claimed = db
        .prepare('SELECT * FROM durable_queue_jobs WHERE id = ? AND tenant_id = ?')
        .get(candidate.id, candidate.tenant_id) as unknown as DurableQueueJob;

      db.exec('COMMIT;');
      return claimed;
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
  }

  private markCompleted(job: DurableQueueJob, result: Record<string, unknown>) {
    const db = getDatabase();
    const now = new Date().toISOString();
    db.prepare(
      `UPDATE durable_queue_jobs
       SET status = 'COMPLETED',
           result_json = ?,
           completed_at = ?,
           locked_at = NULL,
           locked_until = NULL,
           worker_id = NULL,
           last_error = NULL,
           updated_at = ?
       WHERE id = ? AND tenant_id = ?`
    ).run(JSON.stringify(result), now, now, job.id, job.tenant_id);
  }

  private markFailureOrDeadLetter(job: DurableQueueJob, errorMessage: string) {
    const db = getDatabase();
    const now = new Date().toISOString();

    if (job.attempts >= job.max_attempts) {
      db.exec('BEGIN IMMEDIATE;');
      try {
        db.prepare(
          `UPDATE durable_queue_jobs
           SET status = 'DEAD_LETTERED',
               last_error = ?,
               locked_at = NULL,
               locked_until = NULL,
               worker_id = NULL,
               updated_at = ?
           WHERE id = ? AND tenant_id = ?`
        ).run(errorMessage, now, job.id, job.tenant_id);

        db.prepare(
          `INSERT INTO durable_queue_dead_letters (
            id, original_job_id, tenant_id, job_type, resource_id,
            idempotency_key, payload_json, attempts, failure_reason, failed_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(
          `dlq_${crypto.randomUUID()}`,
          job.id,
          job.tenant_id,
          job.job_type,
          job.resource_id,
          job.idempotency_key,
          job.payload_json,
          job.attempts,
          errorMessage,
          now
        );
        db.exec('COMMIT;');
      } catch (err) {
        db.exec('ROLLBACK;');
        throw err;
      }
      return;
    }

    // Exponential backoff: 2s, 4s, 8s, 16s... capped at 5 minutes
    const backoffMs = Math.min(300_000, 2000 * Math.pow(2, Math.max(0, job.attempts - 1)));
    const nextRunAt = new Date(Date.now() + backoffMs).toISOString();

    db.prepare(
      `UPDATE durable_queue_jobs
       SET status = 'PENDING',
           next_run_at = ?,
           last_error = ?,
           locked_at = NULL,
           locked_until = NULL,
           worker_id = NULL,
           updated_at = ?
       WHERE id = ? AND tenant_id = ?`
    ).run(nextRunAt, errorMessage, now, job.id, job.tenant_id);
  }

  /**
   * Cancels pending jobs for a given resource (e.g., stopping estimate follow-ups upon acceptance).
   */
  cancelPendingForResource(tenantId: string, resourceId: string, jobType?: QueueJobType): number {
    const db = getDatabase();
    const now = new Date().toISOString();
    if (jobType) {
      const res = db
        .prepare(
          `UPDATE durable_queue_jobs
           SET status = 'CANCELLED', updated_at = ?
           WHERE tenant_id = ? AND resource_id = ? AND job_type = ? AND status IN ('PENDING', 'FAILED')`
        )
        .run(now, tenantId, resourceId, jobType);
      return Number(res.changes || 0);
    }
    const res = db
      .prepare(
        `UPDATE durable_queue_jobs
         SET status = 'CANCELLED', updated_at = ?
         WHERE tenant_id = ? AND resource_id = ? AND status IN ('PENDING', 'FAILED')`
      )
      .run(now, tenantId, resourceId);
    return Number(res.changes || 0);
  }

  /**
   * Manually retries a dead-lettered or failed job for a tenant.
   */
  retryJob(tenantId: string, jobId: string): DurableQueueJob | null {
    const db = getDatabase();
    const now = new Date().toISOString();

    const job = db
      .prepare('SELECT * FROM durable_queue_jobs WHERE tenant_id = ? AND id = ?')
      .get(tenantId, jobId) as DurableQueueJob | undefined;

    if (!job) return null;

    db.prepare(
      `UPDATE durable_queue_jobs
       SET status = 'PENDING',
           attempts = 0,
           next_run_at = ?,
           last_error = NULL,
           locked_at = NULL,
           locked_until = NULL,
           updated_at = ?
       WHERE tenant_id = ? AND id = ?`
    ).run(now, now, tenantId, jobId);

    db.prepare(
      `UPDATE durable_queue_dead_letters
       SET retried_at = ?
       WHERE tenant_id = ? AND original_job_id = ? AND retried_at IS NULL`
    ).run(now, tenantId, jobId);

    return db
      .prepare('SELECT * FROM durable_queue_jobs WHERE tenant_id = ? AND id = ?')
      .get(tenantId, jobId) as unknown as DurableQueueJob;
  }

  listJobs(tenantId: string, limit = 50): { jobs: DurableQueueJob[]; deadLetters: DeadLetterRecord[] } {
    const db = getDatabase();
    const jobs = db
      .prepare('SELECT * FROM durable_queue_jobs WHERE tenant_id = ? ORDER BY created_at DESC LIMIT ?')
      .all(tenantId, limit) as unknown as DurableQueueJob[];

    const deadLetters = db
      .prepare('SELECT * FROM durable_queue_dead_letters WHERE tenant_id = ? ORDER BY failed_at DESC LIMIT ?')
      .all(tenantId, limit) as unknown as DeadLetterRecord[];

    return { jobs, deadLetters };
  }

  /**
   * Executes one drain pass over currently due jobs.
   */
  async processSinglePass(maxBatch = 10): Promise<{ recovered: number; processed: number; succeeded: number; failed: number }> {
    const recovered = this.recoverStaleLocks();
    let processed = 0;
    let succeeded = 0;
    let failed = 0;

    while (processed < maxBatch) {
      const job = this.claimNextDueJob();
      if (!job) break;

      processed += 1;
      const handler = this.handlers.get(job.job_type);
      if (!handler) {
        this.markFailureOrDeadLetter(job, `No handler registered for job type: ${job.job_type}`);
        failed += 1;
        continue;
      }

      try {
        const parsedPayload = JSON.parse(job.payload_json) as Record<string, unknown>;
        const result = await handler(job, parsedPayload);
        this.markCompleted(job, result);
        succeeded += 1;
      } catch (err: any) {
        this.markFailureOrDeadLetter(job, err?.message || 'Unknown worker execution error');
        failed += 1;
      }
    }

    return { recovered, processed, succeeded, failed };
  }

  startWorker(intervalMs = 3000) {
    if (this.timer) return;
    // Recover any stale locks immediately upon server startup
    const recovered = this.recoverStaleLocks();
    if (recovered > 0) {
      console.log(`[DurableQueue] Recovered ${recovered} stale in-flight job(s) after restart.`);
    }

    this.timer = setInterval(async () => {
      if (this.isPolling) return;
      this.isPolling = true;
      try {
        await this.processSinglePass();
      } catch (err) {
        console.error('[DurableQueue] Worker poll error:', err);
      } finally {
        this.isPolling = false;
      }
    }, intervalMs);
  }

  stopWorker() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

export const durableQueue = new DurableQueueService();
