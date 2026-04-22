# CAPA Workflow — E2E Test Plan (PR #9)

Test against `main` (PR #9 merged). Docker Compose stack running locally.

## Test users (already seeded in DB)

| Role | Email | Password |
|---|---|---|
| admin_owner | owner@acme.test | owner123 |
| quality_manager | qm@acme.test | qm123456 |
| employee | emp@acme.test | emp123456 |

Org: `Acme Manufacturing` (id `9485ef7d-ac6c-…`).

## Setup-phase discoveries (pre-recording, will be flagged to user)

- **Invite-accept 500 bug (pre-existing, PR #5/#6)** — `POST /api/invites/accept` returns 500 because `AuditService.log(actor, …)` is called with `actor.userId` = the not-yet-persisted new user's id, violating FK on `audit_logs.userId`. Worked around by inserting QM/Employee directly via psql. **Out of scope for PR #9** but will be called out in the final report as a separate regression.
- Only failing CI on PR #9 is the external "Continuous AI" bot check — not real CI.

## Primary flow (one continuous recording)

Each step lists **expected** and the observable **pass/fail** criterion.

### 1. Employee submits an NC
- Log in as `emp@acme.test`.
- Non-Conformities → New NC → fill in title `Scratched aluminum panel on line 3` + description → Submit.
- **Expect**: new row appears with status `SUBMITTED` chip.
- **Pass**: row visible + status chip = `SUBMITTED`.

### 2. QM promotes NC → CAPA
- Log out, log in as `qm@acme.test`.
- Non-Conformities → find the NC → click **Promote to CAPA**.
- **Expect**: snack toast "CAPA created", redirected to `/capas/<uuid>` detail page, CAPA code in format `CAPA-YYYY-0001`, NC status on the NC list page now `UNDER_INVESTIGATION`.
- **Pass**: all three conditions hold.

### 3. QM fills 5 Whys + root cause
- On CAPA detail page: 5 inputs + root cause textarea visible.
- Fill `Why 1..5` + root cause `Coolant pressure below spec due to worn regulator`.
- Click **Save 5 Whys**.
- **Expect**: snack "Saved", values persist after page reload.
- **Pass**: reload keeps all 6 values.

### 4. QM adds subtask assigned to Employee
- Click **Add subtask** → title `Replace coolant regulator on line 3`, assignee `Eve Worker`, due date = tomorrow.
- **Expect**: new row in subtasks table with status chip `TODO`, assignee `Eve Worker`, due date shown.
- **Pass**: row visible with all fields populated.

### 5. Negative — QM tries to Submit for validation without all subtasks done
- **Expect**: **Submit for validation** button disabled, tooltip says "all subtasks must be DONE".
- **Pass**: button disabled + tooltip text matches.

### 6. Employee does the work
- Log out, log in as `emp@acme.test`.
- Dashboard → **My Tasks** widget shows the subtask (title, CAPA code, due date).
- Change status TODO → IN_PROGRESS via dropdown.
- **Expect**: widget updates; CAPA auto-transitions to `IN_PROGRESS` (verifiable from CAPA list page chip).
- Change status IN_PROGRESS → DONE.
- **Pass**: My Tasks row status = DONE; CAPA status chip = IN_PROGRESS (still — auto-transition only happens off TODO, not to CLOSED).

### 7. QM submits for validation
- Log out, log in as `qm@acme.test`.
- CAPA detail page: **Submit for validation** now enabled (root cause filled + all subtasks done).
- Click it.
- **Expect**: CAPA → `PENDING_VALIDATION` (chip purple), **Validate & close** + **Send back** buttons visible.
- **Pass**: status chip = PENDING_VALIDATION + both buttons visible.

### 8. Negative — admin_owner cannot validate
- Open an incognito window, log in as `owner@acme.test` → open the same CAPA.
- **Expect**: **Validate & close**, **Send back**, **Reopen** buttons are NOT shown (QM-only).
- **Pass**: those three buttons absent for admin_owner.

### 9. QM validates → CAPA CLOSED + NC auto-closes
- Back to QM session. Click **Validate & close**.
- **Expect**: CAPA status = `CLOSED` (green chip), workflow buttons removed except **Reopen**.
- Navigate to Non-Conformities: linked NC status = `CLOSED`.
- **Pass**: both statuses are CLOSED.

### 10. Audit log shows all transitions
- Navigate to Admin → Audit.
- **Expect**: log entries for: promote, five-whys update, subtask create, subtask update (status changes), submit for validation, validate.
- **Pass**: at least these six rows present, actor column correct.

## Regression guardrails (quick checks if time permits)

- Document share link (PR #8) still loads for external viewer — not re-tested this run.
- User invites flow — already known-broken, flagged separately.

## Recording

- Start recording **after** logins are staged (setup done). Use `record_annotate` at each numbered step.
- Annotation style: `type="test_start"` + `test="It should <...>"` per section, then `type="assertion"` with `test_result="passed"|"failed"`.
