# Northstar Production Application Architecture

## Decision
QMSPilot microtools will be treated as Northstar production applications rather than isolated HTML pages. Each application remains focused on a specific workflow, but it must use shared Northstar contracts for identity, tenant context, records, evidence, workforce routing, audit history, approvals, and reporting.

## CAPA application boundaries
The CAPA application owns:
- CAPA intake and classification
- containment and correction
- investigation and root cause analysis
- corrective and preventive action planning
- effectiveness verification
- COPQ capture
- evidence and approvals
- CAPA closure package

Northstar owns:
- authentication and authorization
- tenant and site context
- master record identifiers
- cross-application relationships
- workforce orchestration
- notifications and escalations
- durable file storage
- audit-event retention
- dashboards, analytics, and management review reporting

## Shared application contract
Every Northstar application should expose:
1. `QMSPILOT_MICROTOOL_READY`
2. `QMSPILOT_CONTEXT`
3. `QMSPILOT_SUBMIT_TO_NORTHSTAR`
4. `QMSPILOT_SUBMISSION_CONFIRMED`
5. a versioned record schema
6. a versioned audit-event schema
7. a workforce-routing block
8. tenant, site, user, role, and permissions context

## Workforce routing
- **Pilot**: orchestration, record creation, stakeholder coordination, and escalation
- **Atlas**: action ownership, due dates, dependencies, overdue tracking, and status summaries
- **Forge**: problem statement quality, root cause logic, action quality, and engineering review
- **Sentinel**: ISO 9001 alignment, evidence sufficiency, closure controls, and audit readiness
- **Vector**: systemic extent review, recurrence prevention, risk updates, and lessons learned

## Production roadmap
### Phase 1 — Current repository
- Complete client-side workflow
- Branded responsive interface
- Local draft and offline queue
- JSON export/import
- host bridge and direct API modes
- record validation and readiness scoring

### Phase 2 — Shared Northstar foundation
- extract shared shell, theme, navigation, buttons, alerts, and form controls
- add a reusable Northstar SDK
- standardize application manifests
- standardize tenant/user context
- replace wildcard `postMessage` origins with approved origins

### Phase 3 — Supabase production services
- tenant-aware authentication
- row-level security
- CAPA records and action tables
- signed evidence uploads
- immutable audit events
- approval workflow
- notification and escalation jobs

### Phase 4 — Workforce automation
- Forge-assisted problem statement and RCA review
- Atlas task creation and overdue escalation
- Sentinel closure gate and evidence review
- Vector systemic-risk recommendations
- Pilot executive brief and management-review summaries

## Non-negotiable controls
- No CAPA closes without verified effectiveness.
- AI recommendations never replace accountable human approval.
- Every write must carry tenant, user, timestamp, record version, and source application.
- Evidence must use durable storage and checksum metadata.
- Closed records must remain revision controlled and auditable.
- Permissions must be enforced server-side, not only in the interface.
