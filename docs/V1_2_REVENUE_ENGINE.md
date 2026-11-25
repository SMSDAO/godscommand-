# GODS COMMAND AI — V1.2.0 Revenue Recovery & Retention Engine Specification

**Version:** 1.2.0  
**Module:** `REVENUE ENGINE`  
**Status:** Implemented & Locally Verified  

---

## 1. Architecture Overview

The V1.2.0 Revenue Engine unifies three commercial growth workflows into the existing V1.0/V1.1 Lead-to-Cash platform:

1. **Missed-Call Revenue Recovery** (`telephony_connections`, `call_events`, `call_recovery_cases`)
2. **Intelligent Estimate Follow-Up Automation** (scheduled durable reminders + automatic cancellation on acceptance)
3. **Recurring Maintenance Contracts** (monthly/quarterly/semiannual/annual plans & service opportunity scheduling)

All background workflows run through a **database-backed durable queue** (`server/services/durableQueue.ts`) persisted in SQLite (`data/gods_command.db`, WAL mode, `PRAGMA foreign_keys = ON`). No workflow relies on an open browser session.

---

## 2. Database Schema & Tenant Isolation

Schema migration file: `/db/migrations/001_v1_2_telephony_and_queue.sql`

### Strict Multi-Tenant Invariants
- Every table includes `tenant_id TEXT NOT NULL` referencing `organizations(id) ON DELETE CASCADE`.
- Child tables reference parents using **composite tenant-scoped foreign keys**:
  - `FOREIGN KEY (tenant_id, telephony_connection_id) REFERENCES telephony_connections(tenant_id, id)`
  - `FOREIGN KEY (tenant_id, call_event_id) REFERENCES call_events(tenant_id, id)`
  - `FOREIGN KEY (tenant_id, matched_lead_id) REFERENCES leads(tenant_id, id)`
  - `FOREIGN KEY (tenant_id, original_job_id) REFERENCES durable_queue_jobs(tenant_id, id)`
- Composite foreign keys guarantee at the database engine level that no record in Tenant A can ever reference a resource belonging to Tenant B.

---

## 3. Durable Queue Service (`DurableQueueService`)

Implemented in `/server/services/durableQueue.ts` backed by `durable_queue_jobs` and `durable_queue_dead_letters`.

### Supported Job Types
| Job Type | Trigger | Stop / Cancellation Condition |
|---|---|---|
| `MISSED_CALL_RECOVERY_SMS` | Owner approves recovery draft via `POST /api/missed-calls/:id/approve-and-send` | Opt-out / suppression or manual rejection |
| `ESTIMATE_FOLLOWUP_REMINDER` | Estimate sent via `POST /api/estimates/:id/send` | Cancelled immediately upon `POST /api/estimates/:id/accept` |
| `MAINTENANCE_SERVICE_OPPORTUNITY` | Active maintenance interval reached | Contract cancelled or expired |
| `PAYMENT_RECONCILIATION` | Stripe webhook / reconciliation retry | Verified paid or voided invoice |

### Reliability, Idempotency & Restart Recovery
1. **Idempotency**: Enforced via `UNIQUE (tenant_id, idempotency_key)`. Repeated enqueue calls return `{ job, deduplicated: true }` without creating duplicate tasks.
2. **Atomic Claiming**: `claimNextDueJob()` executes inside `BEGIN IMMEDIATE ... COMMIT` to assign a `worker_id` and `locked_until` lease timestamp.
3. **Server Restart Recovery**: On server startup (`startWorker()`) and before each poll (`processSinglePass()`), `recoverStaleLocks()` reclaims any `PROCESSING` job whose `locked_until <= now` back to `PENDING`.
4. **Exponential Backoff**: Failed jobs retry with `backoffMs = min(300_000, 2000 * 2^(attempts - 1))`.
5. **Dead-Letter Queue (DLQ)**: Once `attempts >= max_attempts`, the job transitions to `DEAD_LETTERED` and an immutable record is written to `durable_queue_dead_letters`. Authorized admins can inspect and manually retry via `POST /api/queue/jobs/:id/retry`.

---

## 4. API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/telephony/connections` | List tenant telephony lines and compliance flags |
| `GET` | `/api/missed-calls` | List eligible missed/unanswered calls joined with recovery cases |
| `POST` | `/api/webhooks/twilio/voice` | Ingest inbound voice status callback with `CallSid` deduplication |
| `POST` | `/api/missed-calls/:id/approve-and-send` | Record owner approval & enqueue `MISSED_CALL_RECOVERY_SMS` |
| `POST` | `/api/estimates/:id/send` | Mark estimate sent & enqueue `ESTIMATE_FOLLOWUP_REMINDER` |
| `POST` | `/api/estimates/:id/accept` | Accept estimate, create job, and cancel pending follow-up jobs |
| `GET` | `/api/queue/jobs` | List tenant durable queue jobs and dead-letter entries |
| `POST` | `/api/queue/jobs` | Enqueue a durable task with `idempotencyKey` |
| `POST` | `/api/queue/jobs/:id/retry` | Reset and retry a failed/dead-lettered job |
| `POST` | `/api/queue/tick` | Execute an immediate worker drain pass |
| `GET` | `/api/maintenance` | List active recurring maintenance contracts |

---

## 5. Revenue Attribution & Financial Integrity
- Pending estimates and unapproved drafts are classified strictly as **Pipeline Forecast**, never collected revenue.
- Verified revenue reflects only confirmed payment records.
- Fail-closed behavior: Live Twilio outbound SMS dispatch is gated on `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN`. When absent, the connection reports `NOT_CONFIGURED` and outbound dispatches log sandbox mode explicitly without fabricating live carrier delivery.
