# CAPA Workflow E2E Test Report — PR #9

**Tested against**: `main` (PR #9 merged) running in Docker Compose locally.
**Method**: End-to-end through the UI, three real user sessions (employee → QM → admin_owner → QM), plus database-level audit-log inspection afterwards.
**Session**: https://app.devin.ai/sessions/579591363bd54e4cab86c518889712da
**Recording**: `rec-3c6d1dab-8552-40bc-bb2d-230de4f80849-edited.mp4` (attached)

---

## Escalations (read this first)

- **Pre-existing bug, NOT PR #9**: `POST /api/invites/accept` returns **500** with `audit_logs_userId_fkey` violation — the audit entry is written with the not-yet-persisted new user's id. This was introduced in PR #5/#6. I worked around it by seeding the QM and Employee users directly in Postgres so CAPA testing could continue. Filing as a separate ticket; does **not** affect PR #9.
- No blockers found in PR #9 itself. All 12 planned assertions passed.

---

## Assertions

All assertions below ran against seeded data: Org "Acme Manufacturing", users Alice Owner (admin_owner), Quinn Manager (quality_manager), Eve Worker (employee).

- **Employee submits NC** — PASSED. NC "Scratched aluminum panel on line 3" appears with status `SUBMITTED`, CAPA=none, submitted-by Eve Worker.
- **QM promotes NC → CAPA** — PASSED. `CAPA-2026-0001` created, status `Open`, linked NC flipped to `under_investigation` on the NC list.
- **Submit for validation blocked until preconditions met** — PASSED. Button disabled on freshly-promoted CAPA (empty root cause + 0 subtasks).
- **5 Whys + root cause save** — PASSED. All 5 whys + root cause persisted; toast "Root cause saved"; values survive reload.
- **QM adds subtask assigned to employee** — PASSED. Subtask row shows Eve Worker, Apr 28 2026, status `To do`; counter `0 / 1 done`.
- **Subtask visible in employee's My Tasks** — PASSED. My Tasks shows "Replace coolant regulator on line 3" CAPA-2026-0001, Due Apr 28 2026.
- **Employee changes status TODO → IN_PROGRESS → DONE** — PASSED. Status dropdown toggled through both transitions; My Tasks counter updated from `1 open` → `0 open`.
- **CAPA auto-transitions to IN_PROGRESS on first subtask movement** — PASSED. CAPA list shows `CAPA-2026-0001` status `in_progress` after employee moved subtask off TODO. Audit log contains explicit `auto_in_progress` entry with `trigger=subtask_status_change`.
- **Submit for validation enables when conditions met** — PASSED. With root cause filled and 1/1 subtasks Done, the button became enabled.
- **Submit for validation transitions CAPA to PENDING_VALIDATION** — PASSED. Chip=`Pending validation`; `Validate & close` + `Send back` buttons visible; toast "Submitted for validation".
- **admin_owner cannot see QM-only workflow buttons** — PASSED. Logged in as Alice Owner on the same CAPA: only the `Pending validation` chip is rendered — no `Validate & close`, no `Send back`, no `Reopen`.
- **Validate & close → CAPA Closed + linked NC auto-closed** — PASSED. QM clicked Validate & close → CAPA status=`Closed`, only `Reopen` button remains, linked NC shows `closed` on the CAPA detail and on the NC list. Validation footer: "Closed by Quinn Manager on Apr 22, 2026, 3:30:28 AM".
- **Audit log contains all transitions** — PASSED. `/audit-logs` shows 10 CAPA-related entries spanning the full lifecycle (see screenshot below).

---

## Evidence

### CAPA auto-transitioned to IN_PROGRESS after employee picked up subtask
![CAPA list status=in_progress](https://app.devin.ai/attachments/3f335013-9d65-4ae6-9c12-26f798b103de/screenshot_890f3824102c4d45aab6e0faf219ecdc.png)

### CAPA detail — Submit for validation enabled, 1/1 done
![Submit enabled](https://app.devin.ai/attachments/8acbdb79-9f3b-4004-bfdf-cdff33510be5/screenshot_546a70feb06347c99c391411e70e2eac.png)

### PENDING_VALIDATION state — Validate & close + Send back buttons visible (QM)
![Pending validation QM view](https://app.devin.ai/attachments/efa3cc00-2bee-4ab0-848f-5124f8b9c010/screenshot_8dc21ac860a34d7a946dce1eefc58b15.png)

### Same CAPA seen by admin_owner — no validate buttons
![Admin owner view](https://app.devin.ai/attachments/ab578637-97f3-4d93-856c-4da3a632cdd4/screenshot_f0d2314ddcae4c29a8b7bcedc5063f63.png)

### After Validate & close — CAPA=Closed, linked NC=closed
![CAPA closed](https://app.devin.ai/attachments/b55feaef-eb0a-4fd6-9f28-2a6b77bc9a27/screenshot_f211046251a140eeaf228c3ee7130eb2.png)

### NC list confirms linked NC auto-closed
![NC list status=closed](https://app.devin.ai/attachments/619a4456-12c5-4905-b18e-ddbe858e74b6/screenshot_c37663c63f7c41eea0b9db6373f4c908.png)

### Audit log — all 10 transitions recorded
![Audit log](https://app.devin.ai/attachments/10c536a9-89e8-4778-b76d-822857c722d0/screenshot_2672feb3fedc43efab630a173a5c4cfd.png)

Actions captured, in order of occurrence:
1. `create` NonConformity — by Eve (employee)
2. `promote_to_capa` NonConformity — by Quinn (QM)
3. `create_from_nc` CAPA — by Quinn
4. `update_five_whys` CAPA `{ whysCount: 5, rootCauseSet: true }`
5. `create` CapaSubtask — assignee=Eve
6. `auto_in_progress` CAPA `{ trigger: "subtask_status_change" }`
7. `update` CapaSubtask `{ status: "in_progress" }` — by Eve
8. `update` CapaSubtask `{ status: "done" }` — by Eve
9. `submit_for_validation` CAPA — by Quinn
10. `validate_and_close` CAPA `{ linkedNCs: ["0cee8b98-…"] }` — by Quinn

### Employee's My Tasks after marking Done (0 open)
![My Tasks done](https://app.devin.ai/attachments/7afc6319-2d57-43ef-a9ff-aea74c68ebd4/screenshot_fe5c253d644b42dfbb686e5086197cf2.png)

---

## Not tested this run

- `Reopen` action (CAPA Closed → Reopened) — button present on closed CAPA but not exercised.
- `Send back` / reject flow from Pending Validation — button present but not exercised.
- Org-level isolation (cross-tenant 403 on CAPA endpoints) — relied on for PR #7 already, not re-run here.
- Resend email notifications to subtask assignees — out of PR #9 scope.
- Invite-accept flow end-to-end (blocked by pre-existing bug noted above).

Happy to cover any of those next.
