# GODS COMMAND AI — V1.2.0 Telephony & Missed-Call Recovery Specification

**Version:** 1.2.0  
**Module:** Telephony Ingestion, Caller Normalization & Recovery Workflow  
**Primary Provider:** Twilio Voice & Programmable SMS (extensible provider abstraction)  

---

## 1. Provider Abstraction & Fail-Closed Configuration

Telephony connections are persisted per tenant in `telephony_connections`:
- `provider`: `TWILIO | RINGCENTRAL | AIRCALL | CUSTOM`
- `account_sid_masked`: Masked identifier for UI display (full credentials stored via `credential_ref`, never exposed to the browser)
- `phone_number_e164`: Normalized E.164 business line (unique per tenant)
- `webhook_secret_hash`: SHA-256 hash of webhook validation secret
- `auto_send_enabled`: Defaults to `0` (`false`). Outbound SMS requires **Owner Approval** unless explicitly enabled after compliance configuration.
- `recording_enabled`: Defaults to `0` (`false`) to comply with two-party consent laws.
- `status`: `NOT_CONFIGURED | CONNECTED | DEGRADED | SUSPENDED | ERROR`

---

## 2. SQL Schema Summary (`001_v1_2_telephony_and_queue.sql`)

### `telephony_connections`
- **Primary Key:** `id`
- **Unique Constraints:** `(tenant_id, id)`, `(tenant_id, phone_number_e164)`
- **Indexes:** `idx_telephony_connections_tenant_status`, `idx_telephony_connections_phone_lookup`

### `call_events`
- **Primary Key:** `id`
- **Foreign Keys:**
  - `(tenant_id) -> organizations(id) ON DELETE CASCADE`
  - `(tenant_id, telephony_connection_id) -> telephony_connections(tenant_id, id) ON DELETE CASCADE`
  - `(tenant_id, matched_lead_id) -> leads(tenant_id, id) ON DELETE SET NULL`
- **Unique Constraints:** `(tenant_id, id)`, `(tenant_id, provider_call_sid)` (idempotent webhook deduplication)
- **Indexes:** `idx_call_events_tenant_occurred`, `idx_call_events_tenant_caller`, `idx_call_events_tenant_status`

### `call_recovery_cases`
- **Primary Key:** `id`
- **Foreign Keys:**
  - `(tenant_id) -> organizations(id) ON DELETE CASCADE`
  - `(tenant_id, call_event_id) -> call_events(tenant_id, id) ON DELETE CASCADE`
  - `(tenant_id, lead_id) -> leads(tenant_id, id) ON DELETE SET NULL`
- **Unique Constraints:** `(tenant_id, id)`, `(tenant_id, call_event_id)` (1:1 recovery case per missed call)
- **Indexes:** `idx_call_recovery_tenant_approval`, `idx_call_recovery_tenant_phone`

---

## 3. Webhook Ingestion & Call Classification Flow

`POST /api/webhooks/twilio/voice`

1. **Payload Validation**: Validates presence of `CallSid`, `From`, `To`, and `CallStatus`.
2. **Phone Normalization**: Converts `From` and `To` into canonical E.164 format via `normalizeE164()`.
3. **Deduplication**: Checks `(tenant_id, provider_call_sid)` in `call_events`. Duplicate callbacks return `{ deduplicated: true, callEventId }` with HTTP `200`.
4. **Classification**: Maps provider status into `ANSWERED`, `MISSED`, `BUSY`, `NO_ANSWER`, `FAILED`, or `VOICEMAIL_RECEIVED`.
5. **Transactional Persistence**: Inside `BEGIN IMMEDIATE ... COMMIT`, inserts the `call_events` row and, for unanswered calls (`call_status !== 'ANSWERED'`), inserts a `call_recovery_cases` record initialized to `PENDING_APPROVAL` with an AI-drafted SMS response (`gemini-4-hydrogen`).

---

## 4. Human-Approved Recovery & Compliance Rules

1. **Default Mode (`DRAFT -> PENDING_APPROVAL -> QUEUED -> SENT`)**: No automated SMS is dispatched without explicit owner approval (`POST /api/missed-calls/:id/approve-and-send`).
2. **Durable Dispatch**: Approval enqueues a `MISSED_CALL_RECOVERY_SMS` job in `durable_queue_jobs` with `idempotency_key = recovery_sms_<recoveryCaseId>`.
3. **Consent & Opt-Out**: `consent_checked` and `opt_out_suppressed` flags prevent outbound messaging to suppressed numbers (`SUPPRESSED_OPTOUT`).
4. **No Fabricated Promises**: AI recovery drafts do not quote unapproved pricing, discounts, or guaranteed technician arrival times.
