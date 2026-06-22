# Sales CRM — Complete Product and Build Roadmap

## 1. Document control

- Client/company: Bonjotech LLC / The Fine Dudes (TFD)
- Product: Sales CRM
- Source of truth: existing **TFD Sales Team KPI System** spreadsheet
- Source specification: **Sales CRM Build Spec.docx**
- Prepared for: Umair (Developer)
- Product owner: Asad, Founder & Managing Partner, TFD
- Module boundary: module 1 of 2; Production CRM has a separate specification
- Build status: do not start implementation until the decisions in Section 18 are confirmed

This roadmap converts the complete source specification into connected workflows, data ownership, system dependencies, delivery phases, and acceptance criteria. Any item labelled **Open decision** is not resolved by the source document and must be confirmed rather than guessed.

## 2. Product purpose and success definition

The application replaces the current Excel sales tracker. It manages the sales journey from lead creation through follow-ups, appointment approval, closing, payment, and final handoff to CST.

The build succeeds when:

1. Every active lead always has a next reach-back date.
2. Each agent automatically sees due and overdue follow-ups without filtering manually.
3. A follow-up cannot be cleared without an outcome comment plus either a new reach-back date or a terminal outcome.
4. The queue remains performant with 5,000+ leads per agent through server-side filtering and pagination.
5. Appointments move through controlled submission, approval, closing, payment, and CST handoff steps.
6. Services, deal values, payments, ownership, and the closing chain remain traceable.
7. Daily call activity and pipeline results feed a date-filtered management dashboard.
8. Nothing is hard-deleted; historical data and an immutable audit trail remain available after users leave.

The differentiating feature is the automatic follow-up reminder engine. Other functionality should mirror the existing spreadsheet without unnecessary complexity.

## 3. Connected-system boundary

| System | Responsibility | Connection to Sales CRM |
|---|---|---|
| TFD Sales Team KPI spreadsheet | Current operational source of truth | Supplies the existing data structure and migration baseline; the app replaces its sales-tracking workflow |
| Sales CRM | Leads, follow-ups, appointments, sales pipeline, closing, payment, call activity | Owns the sales process until a deal is won, fully paid, and forwarded |
| CST CRM | Ongoing client servicing after a sale | Receives eligible customers and the handoff record; already built/deploying and otherwise outside this scope |
| Production CRM | Production task delivery for active clients | Separate specification; later consumes relevant customer/service data through the CST/Production side |

Boundary rule: **Sales CRM ends where CST begins.** The minimum known handoff payload is the customer, services sold, service amounts, total/received/outstanding amounts, and closer/ownership chain. The exact payload and integration method remain open decisions.

## 4. End-to-end operating flow

```text
Admin configures users, hierarchy, lead sources, services, and targets
    ↓
Agent creates lead
    ↓ required: lead source, customer, business, phone, reach-back date, assigned agent
Lead enters assigned agent's follow-up cycle
    ↓
Due date arrives → Today/Overdue queue
    ↓
Agent logs comment + next date
    ├─ next date → returns to future follow-up cycle
    └─ terminal outcome → stops follow-up cycle
    ↓
Setter submits qualified appointment → Date Submitted
    ↓
Team Lead reviews
    ├─ Approved → Date Approved → assigned closer → In Progress
    └─ Unapproved → snapshot status
    ↓
Closer records result
    ├─ Closed-Lost → Date Closed Lost
    └─ Closed-Won → Date Closed Won + services/prices + ownership chain
                            ↓
                    Payments recorded incrementally
                            ↓
              Paid in Full → Date Paid → eligible for CST
                            ↓
                Manager forwards to CST Manager
                            ↓
         CST Manager reviews handler load and assigns a handler
                            ↓
                      CST handoff created
```

Parallel activity flow:

```text
Agent daily/shift activity → one daily call-stat record → rates and targets → admin dashboard
All important actions → immutable audit log
All dated pipeline/payment events → date-range dashboard and cycle tracker
```

## 5. Roles, hierarchy, and permissions

Hierarchy: **Super Admin → Manager → Team Lead → Agent**. Higher roles inherit lower-role capabilities.

| Capability | Agent | Team Lead | Manager | Super Admin |
|---|---:|---:|---:|---:|
| Log in and view permitted work | Yes | Yes | Yes | Yes |
| Create/update own leads | Yes | Yes | Yes | Yes |
| Log follow-ups/comments | Yes | Yes | Yes | Yes |
| Submit appointments | Yes | Yes | Yes | Yes |
| Fill own daily call stats | Yes | Yes | Yes | Yes |
| Add agents | No | Yes | Yes | Yes |
| Add Team Leads | No | No | Yes | Yes |
| Approve/reject appointments | No | Yes | Yes, inherited | Yes |
| Edit team leads | Own only | Team leads | Yes | Yes |
| Reassign leads | No | Team scope per role description | Yes | Yes |
| View all data/dashboard | No | Team scope only where specified | Management scope | Yes |
| Request removal | No delete rights | Yes; Manager approves | Yes; Super Admin approves | Not required |
| Remove immediately | No | No | No | Yes |
| View audit log | No | No | Open decision: team-only | Yes |

Role-specific rules:

- Agent: setter or closer; owns leads, follow-ups, submissions, and daily stats; no deletion rights.
- Team Lead: adds agents, edits team leads, approves/rejects submitted appointments, and can act as a closer.
- Manager: adds agents and Team Leads, edits/reassigns leads, forwards paid won clients to the CST Manager.
- CST Manager: treated as a Manager example in the source; receives handoffs, sees CST handler active-client loads, and assigns handlers.
- Super Admin: unrestricted administration, immediate removals, all data, full audit log, and full dashboard.

Every active Agent belongs to a Team Lead; every Team Lead belongs to a Manager. This hierarchy supplies the automatically recorded closing chain.

## 6. Identity, deactivation, and approval workflow

### 6.1 User state

- Removing a user means **deactivating**, never deleting.
- Deactivation revokes login and removes the user from active work queues.
- Leads, call stats, comments, pipeline history, ownership history, and audit entries stay attached to the deactivated user's identity.
- A Manager or higher can reassign leads owned by a deactivated user.
- Reassignment preserves original and subsequent ownership history.

### 6.2 Removal request lifecycle

```text
Team Lead requests removal → pending for Manager → approve or reject
Manager requests removal → pending for Super Admin → approve or reject
Super Admin removes → immediate deactivation/soft-removal
```

The pending action must include requester, target type, target ID, reason if collected, requested timestamp, approver, decision, decision timestamp, and status. No target changes on request alone.

No user, lead, or closed deal is hard-deleted. Approved record removal must therefore be implemented as an inactive/archived state while retaining history.

## 7. Core data model and relationships

The names below describe logical records; final database naming can follow the chosen stack.

| Record | Key data | Connects to |
|---|---|---|
| User | name, login, role, active state, team lead, manager | Leads, appointments, deals, call stats, approvals, comments, audit entries |
| Team/Hierarchy | manager, team lead, agents, effective dates | Assignment routing and historical responsibility |
| Lead Source | editable name, active state | Lead |
| Lead | source, customer, business, contact details, niche, notes, current reach-back date, owner, current status | Follow-ups, status history, appointment, ownership history, audit |
| Lead Ownership History | lead, previous owner, new owner, changed by, timestamp | Preserves assignment history |
| Follow-up/Comment | lead, comment, outcome/status, next reach-back date, actor, timestamp | Updates the lead queue and supplies history |
| Appointment/Opportunity | originating lead, setter, closer, team chain, current pipeline stage, stage dates | Approval decision, deal, dashboard |
| Stage History | opportunity, from stage, to stage, actor, timestamp | Auditability and cycle analysis |
| Service Catalog | admin-editable service name, active state | Deal service line |
| Deal Service Line | deal, service snapshot, price | Deal total and CST handoff |
| Deal | opportunity, Closed-Won/Closed-Lost data, owner chain, calculated totals/status | Payments and handoff |
| Payment | deal, amount, received date, entered by, timestamp | Amount received, outstanding, payment status, Date Paid |
| CST Handoff | deal/customer/services/amounts/ownership payload, forwarding manager, CST manager, handler, timestamps/status | CST CRM and Production side later |
| CST Handler Load | handler, active-client count | CST Manager assignment decision |
| Daily Call Stats | unique agent/date row, activity counts, off-day flag, notes | Targets, rates, dashboard |
| Weekly Target | metric, target value, agent/team/global scope, effective week | Actual-vs-target dashboard |
| Removal Request | requester, approver role/user, target, decision/status/timestamps | Soft-removal/deactivation and audit |
| Notification | user, due/overdue counts or summary, read state, created timestamp | Login/scheduled reminders |
| Audit Entry | server timestamp, actor, action, target, before/after | Append-only compliance/history |

Critical relationship rules:

- A lead has one current assigned agent and many ownership-history records.
- A lead has many comments/follow-up events but one current next reach-back date.
- A lead may create an appointment/opportunity when submitted.
- One opportunity has one current stage and many transition-history entries.
- A won deal has multiple service lines and multiple payment entries.
- Catalog changes must not alter historical service names/prices already recorded on deals; store a deal-time snapshot.
- Org-chart changes must not rewrite the historical closer/Team Lead/Manager chain on an existing won deal; store a deal-time snapshot.
- Every mutable business action also writes an audit entry.

## 8. Lead capture specification

| Field | Type | Required | Validation/ownership |
|---|---|---:|---|
| Lead Source | Admin-editable dropdown | Yes | Seed: Cold Calling, Meta/Facebook Ads, LinkedIn Outreach, Google/SEO, Referral, Other |
| Customer Name | Text | Yes | Contact person |
| Business Name | Text | Yes | — |
| Phone Number | Text | Yes | Primary number |
| Mobile Number | Text | No | Secondary/cell |
| Email | Email | No | Validate format when present |
| Business Address | Text | No | — |
| Niche/Industry | Text or dropdown | No | Examples: braiding salon, real estate, contractor; final control type is open |
| Notes | Long text | No | Free call notes |
| Reach-back/Callback Date | Date | Yes, blocks save | Drives follow-up engine; inline error and form remains open if absent |
| Assigned Agent | Auto/default plus dropdown | Yes | Defaults to creator; Team Lead+ can reassign within permission scope |

Create flow:

1. Validate all required fields on both client and server.
2. Reject any create request without a reach-back date.
3. Save the lead with creator and assigned-agent references.
4. Create initial ownership history.
5. Write a lead-created audit entry.
6. Make the lead eligible for the assigned agent's queue when its reach-back date becomes due.

## 9. Follow-up reminder engine

### 9.1 Queue query

For the logged-in agent, return active non-terminal leads where:

```text
assigned_agent = current user
AND reach_back_date <= current business date
```

- Separate `due today` and `overdue` counts.
- Sort oldest reach-back date first.
- Visually flag overdue records.
- Filter and paginate on the server.
- Do not load all leads into the browser.
- Must support at least 5,000 leads per agent.

### 9.2 Handling a follow-up

A follow-up is complete only when:

```text
non-empty outcome comment
AND
(next reach-back date OR terminal status)
```

Terminal outcomes named in the source: **Closed-Won, Closed-Lost, Not Interested**.

If a next date is supplied:

1. Append a timestamped follow-up/comment event with actor.
2. Update the lead's current reach-back date.
3. Remove it from the current queue.
4. Return it automatically on the future date.
5. Write audit entries for the comment/status/date change.

If a terminal outcome is supplied:

1. Append the comment and terminal outcome.
2. Stop future follow-up reminders.
3. Stamp the relevant status date where defined.
4. Continue into closing/payment flow when Closed-Won.

### 9.3 Reminder delivery

- Recalculate/surface due and overdue counts on login.
- Recalculate/surface them on a fixed schedule.
- V1 minimum is an in-app count/badge/summary.
- Email and WhatsApp are optional extensions pending confirmation.
- Every comment and status change includes actor, action, and timestamp in lead history.

## 10. Pipeline, approval, and stage rules

Use one current status field plus separate canonical date columns, while also retaining transition history.

| Stage | Actor | Required stored date | Dashboard/date behavior |
|---|---|---|---|
| Submitted | Setter | Date Submitted | Counts by Date Submitted |
| Approved | Team Lead | Date Approved | Counts by Date Approved |
| Unapproved | Team Lead | No date defined; snapshot only | Date-range basis is open |
| In Progress | Closer | No date defined; snapshot only | Date-range basis is open |
| Closed-Won | Closer | Date Closed Won | Counts/value by Date Closed Won unless metric says otherwise |
| Closed-Lost | Closer | Date Closed Lost | Counts by Date Closed Lost |
| Forwarded to CST | After Closed-Won and fully paid | No date specified, but a forward timestamp is operationally required | Date-range basis is open; recommended Date Forwarded |

Required transition flow:

```text
Submitted → Approved or Unapproved
Approved → In Progress
In Progress → Closed-Won or Closed-Lost
Closed-Won + Paid in Full → Forwarded to CST
```

Each transition must:

1. Enforce actor permission and prerequisite stage.
2. Update the single current status.
3. Stamp the defined canonical date.
4. Append stage history with actor and server timestamp.
5. Write an audit entry.

Reopening, resubmission after Unapproved, rollback, and whether canonical dates mean first or latest transition are not defined and require confirmation.

## 11. Won deal, services, prices, and payment

### 11.1 Initial service catalog

- Website
- Google Business Profile (GMB)
- SEO
- Logo/Design
- Brand Guidelines
- Video Editing
- Community Management
- Ads Management
- Facebook
- Instagram
- TikTok
- LinkedIn
- YouTube
- X (Twitter)
- Google Ads
- YouTube Ads
- AI Content Creation

Admin can add, edit, and deactivate services without a code deployment. A won deal supports multiple selected services, each with its own dollar amount.

### 11.2 Deal calculations

```text
Total Deal Value = sum(all selected service prices)
Amount Received = sum(all payment entries)
Amount To Receive = Total Deal Value - Amount Received
Payment percentage = Amount Received / Total Deal Value × 100
```

| Calculated state | Rule |
|---|---|
| Unpaid | Amount Received = 0 |
| Partial | 0 < Amount Received < Total Deal Value; display percentage |
| Paid in Full | Amount Received >= Total Deal Value |
| Date Paid | Set when the deal first becomes Paid in Full |

Payment flow:

1. Closer records selected services and prices when marking Closed-Won.
2. System calculates Total Deal Value.
3. Authorized agent adds each partial/incremental payment as it arrives.
4. System recalculates received, outstanding, percentage, and status.
5. On full payment, system stamps Date Paid.
6. Deal becomes eligible for CST handoff only when both Closed-Won and Paid in Full.
7. All payment additions and calculation-affecting edits are audited.

Payment entries need individual received dates to retain incremental-payment history. Refunds, overpayments, currency handling beyond dollars, payment editing/voiding, and whether Date Paid changes if a payment is reversed are not defined.

## 12. Closing ownership chain and CST routing

Every won deal stores this full responsibility chain:

```text
Closer (Agent or Team Lead)
    ↓ if Agent, derive Team Lead
Team Lead
    ↓ derive Manager
Manager
    ↓ forwards
CST Manager
    ↓ reviews active-client load
CST Handler
```

Rules:

- The closer is an Agent or Team Lead.
- If the closer is an Agent, record that agent's Team Lead.
- Record the Team Lead's Manager automatically.
- Manager forwards the eligible client to the CST Manager.
- CST Manager sees each handler's current active-client count.
- CST Manager manually selects a handler with capacity; automatic load balancing is not required for v1.
- Persist the complete chain on the deal/handoff so later hierarchy changes do not erase historical responsibility.

Known handoff data:

- Customer and business identity/contact record
- Services sold
- Amount for every service
- Total Deal Value
- Amount Received
- Amount To Receive
- Payment status and Date Paid
- Closer
- Team Lead and Manager chain
- Forwarding Manager
- Receiving CST Manager
- Assigned CST handler

The exact final field list, transport method (live API versus export), CST endpoint/schema, authentication, retries, duplicate prevention, and handoff failure handling must be confirmed.

## 13. Daily call statistics and targets

One record per agent per calendar day:

| Field | Type | Rule |
|---|---|---|
| Date | Date | Defaults to today |
| Agent | Auto | Logged-in agent |
| Calls Made | Number | Non-negative |
| Connected | Number | Non-negative |
| Conversations 2 min+ | Number | Non-negative |
| Calls Booked | Number | Appointments booked |
| Approved | Number | Approved appointments |
| No Shows | Number | Non-negative |
| Notes/Observations | Text | Optional |
| Off Day | Boolean/status | Allows weekends/off-days without corrupting rate math |

Rules:

- Enforce a unique agent/date record because the specification requires one row per agent per day.
- Allow entry once per shift while retaining the one-row-per-day result; editing permissions/cutoff are open.
- Support weekly targets per metric, including Calls Made and Connected.
- Dashboard compares actual versus target.
- `Connect Rate = Connected ÷ Calls Made`, per agent and overall.
- Division by zero must display zero or N/A consistently, not error.
- Off-days must be excluded from target/rate assumptions where appropriate.

## 14. Asad's dashboard and metric lineage

The Super Admin dashboard has global From/To date filters. Each metric uses its own event date, allowing one deal to appear in different reporting periods.

| Dashboard metric | Source record | Date/filter column | Calculation |
|---|---|---|---|
| Appointments Submitted | Opportunity | Date Submitted | Count, per agent and total |
| Approved | Opportunity | Date Approved | Count, per agent and total |
| Unapproved | Opportunity | Not defined | Current snapshot; date-range rule open |
| In Progress | Opportunity | Not defined | Current snapshot; date-range rule open |
| Closed-Won | Deal/Opportunity | Date Closed Won | Count, per agent and total |
| Closed-Lost | Opportunity | Date Closed Lost | Count, per agent and total |
| Forwarded to CST | Handoff | Date not defined | Count; recommended Date Forwarded |
| Revenue Collected | Deal/payment | Source says Date Paid | Sum collected; partial-payment date treatment is open |
| Total Pipeline Value | Closed-Won deals | Recommended Date Closed Won | Sum Total Deal Value |
| Still To Receive | Partial/unpaid won deals | Recommended selected-range deal set | Sum Amount To Receive |
| Approval Rate | Opportunities | Submitted/Approved dates per selected definition | Approved ÷ Submitted |
| Close Rate | Opportunities | Approved/Closed-Won dates per selected definition | Closed-Won ÷ Approved |
| Connect Rate | Daily Call Stats | Stats Date | Connected ÷ Calls Made |
| Submission → Approval | Opportunity dates | Date Submitted, Date Approved | Average elapsed days |
| Approval → Close-Won | Opportunity dates | Date Approved, Date Closed Won | Average elapsed days |
| Close-Won → Payment | Deal dates | Date Closed Won, Date Paid | Average elapsed days |
| Full cycle | Opportunity/deal dates | Date Submitted, Date Paid | Average elapsed days |
| Activity actual vs target | Daily Call Stats + Weekly Targets | Stats date/target week | Sum actual versus applicable target |

Dashboard dimensions:

- Per agent
- Overall total
- Selected From/To range
- Pipeline stage
- Payment status where relevant

All rates and averages must define zero-denominator, missing-date, timezone, and inclusive date-boundary behavior before implementation.

## 15. Audit log and retention

Audit storage is central, append-only, and immutable through the application.

| Field | Required content |
|---|---|
| Timestamp | Server time |
| Actor | User identity retained after deactivation |
| Action | Created lead, edited lead, changed status, reassigned, requested removal, approved/rejected removal, deactivated user, login, and other protected mutations |
| Target | Target type and ID: lead, deal, user, etc. |
| Before → After | Old and new values for edits |

Minimum audited actions from the source:

- Create
- Edit
- Delete/removal request
- Approve/reject removal
- Deactivate
- Reassign
- Status change
- Login

Application rules:

- No audit entry can be edited or deleted.
- Super Admin can view the entire log.
- Manager team-scoped access is optional and must be confirmed.
- User deactivation creates an audit entry.
- Historical actor identity remains readable after deactivation.

## 16. Required screens and system components

### Agent-facing

1. Login
2. Today/Overdue follow-up queue with counts, flags, sorting, and pagination
3. Lead create form
4. Lead detail/history and follow-up update form
5. My leads/search/filter
6. Appointment submission
7. Assigned closing work and deal close form for agents acting as closers
8. Payment entry/history where permitted
9. Daily call stats entry and personal actual-vs-target view
10. In-app notification/reminder area

### Team Lead-facing

1. Team queue/leads
2. Pending submitted appointments
3. Approve/reject controls
4. Agent creation
5. Team lead editing/reassignment controls
6. Removal request submission
7. Closer work when Team Lead is assigned as closer

### Manager/CST Manager-facing

1. Team/Team Lead administration
2. Lead edit/reassignment
3. Pending removal approvals from Team Leads
4. Own removal requests to Super Admin
5. Eligible won-and-paid deals
6. Forward-to-CST action
7. Incoming CST handoffs
8. CST handler list with active-client counts
9. CST handler assignment
10. Optional team-scoped audit view if approved

### Super Admin-facing

1. User and hierarchy administration
2. Lead-source administration
3. Service-catalog administration
4. Weekly target administration
5. Full data management and reassignment
6. Pending Manager removal requests
7. Immediate deactivation/archive controls
8. Global dashboard with date range
9. Full immutable audit log viewer

### Backend/system components

1. Authentication and role-based authorization
2. Server-side lead query/filter/pagination service
3. Follow-up validation/state service
4. Scheduled due/overdue notification job
5. Pipeline transition service
6. Deal/service/payment calculation service
7. CST handoff service/export
8. Dashboard aggregation service
9. Append-only audit writer
10. Data migration/import process from the spreadsheet

## 17. Delivery roadmap and dependencies

### Phase 0 — Discovery and design lock

Dependencies: source spreadsheet access, answers from Section 18, CST technical details.

- Inspect and map every sheet/column in the existing KPI spreadsheet.
- Compare live spreadsheet values/statuses with this roadmap.
- Resolve all open decisions.
- Approve stack, hosting, database, authentication, scheduler, and third-party costs.
- Define timezone/business-date behavior.
- Define migration scope and data-cleaning rules.
- Finalize ERD/data schema, role matrix, stage state machine, dashboard formulas, and CST contract.

Exit gate: Asad signs off the schema, formulas, open decisions, cost, and integration method.

### Phase 1 — Foundation, users, hierarchy, retention

- Authentication and active/inactive login enforcement
- Four-role authorization hierarchy
- Manager → Team Lead → Agent structure
- User create/deactivate flows
- Ownership-history mechanism
- Removal requests/approvals
- Append-only audit infrastructure from the first mutation
- Admin-editable lead sources and service catalog

Exit gate: permission tests pass; deactivation retains all linked history; audit entries cannot be mutated.

### Phase 2 — Lead capture and core follow-up engine

- Lead schema and required fields
- Create/edit/detail/history screens
- Reach-back-date hard validation
- Assigned-agent defaults and controlled reassignment
- Today and Overdue queues
- Server-side filters, oldest-first sorting, pagination, and badges
- Follow-up completion validation
- Recurring future-date cycle and terminal outcomes
- Login and scheduled in-app reminders

Exit gate: tested with 5,000+ leads for one agent; no active lead can fall out of the cycle without a terminal outcome.

### Phase 3 — Appointments and sales pipeline

- Setter submission and Date Submitted
- Team Lead approval/rejection and Date Approved
- Closer assignment and In Progress
- Closed-Won/Closed-Lost and date stamps
- Transition permission/prerequisite enforcement
- Stage and comment history
- Per-stage/per-agent operational views

Exit gate: complete setter → Team Lead → closer scenario passes, including rejected and lost paths.

### Phase 4 — Services, deal value, payments, and CST handoff

- Multi-service won-deal form with per-service prices
- Total calculation
- Incremental payment ledger
- Outstanding amount, percentage, and automatic payment status
- Date Paid and eligibility rule
- Historical closer/Team Lead/Manager chain snapshot
- Manager forwarding flow
- CST Manager handler-load view and manual assignment
- Confirmed live integration or export implementation
- Duplicate-safe handoff status/history

Exit gate: only won-and-fully-paid deals can be forwarded; known handoff data is reconciled end to end.

### Phase 5 — Daily stats, targets, and dashboard

- One agent/day call-stat entry
- Off-day/weekend handling
- Weekly target configuration
- Per-agent and overall actual-versus-target
- Date-range dashboard
- Pipeline, revenue, outstanding, and conversion metrics
- Cycle-time averages from stage dates
- Metric reconciliation against spreadsheet examples

Exit gate: every dashboard card is traceable to its source field/date and matches approved spreadsheet test cases.

### Phase 6 — Hardening and migration

- Import users, hierarchy, leads, ownership, stage dates, services, amounts, payments, and stats from the spreadsheet as available
- Data validation and reconciliation report
- Authorization/security review
- Concurrent update and duplicate-submit protection
- Queue/index performance tests
- Calculation and timezone boundary tests
- Audit completeness review
- Backup/restore and operational monitoring plan
- User acceptance testing by Agent, Team Lead, Manager/CST Manager, and Super Admin

Exit gate: accepted migration totals, no orphaned records, and all role-specific UAT scenarios pass.

### Phase 7 — Test deployment and go-live

- Deploy to a test URL
- Seed/import agreed test data
- Run the acceptance checklist in Section 19
- Obtain Asad's verification/sign-off
- Plan cutover from spreadsheet, including final delta import and rollback
- Deploy production, monitor queues/jobs/handoffs, and reconcile initial dashboard values

Exit gate: production operation verified without missed follow-ups or lost historical data.

## 18. Decision register — confirm before development

### Explicitly open in the source document

1. Final service list and niche-specific services to seed.
2. In-app-only reminders for v1 versus email and/or WhatsApp.
3. Exact CST handoff fields.
4. Live CST integration versus export.
5. Manager access to their team's audit log versus Super Admin only.
6. Proposed technical stack, hosting, and third-party costs.

### Additional alignment gaps exposed by the data-flow mapping

7. `Not Interested` is a follow-up terminal outcome but is absent from the pipeline stage list: separate lead disposition or pipeline stage?
8. Unapproved and In Progress have no dates, but the dashboard uses a date range: current snapshot only or add Date Unapproved/Date In Progress?
9. Forwarded to CST has no date, but the dashboard counts it by selected range: add Date Forwarded?
10. Revenue Collected is said to use Date Paid, but partial payments arrive earlier: count cash on each payment's received date or only once fully paid?
11. Dashboard Approved exists both in manually entered Daily Call Stats and in opportunity approvals: which is authoritative for each card?
12. Calls Booked versus Appointments Submitted: should these reconcile automatically or remain independent manual/activity and pipeline metrics?
13. Niche/Industry control: free text, admin-editable dropdown, or both?
14. Team Lead lead-reassignment scope: own team only is assumed; confirm.
15. CST handler identity: Sales CRM user role, read-only reference imported from CST, or live CST lookup?
16. CST handler active-client count: calculated in CST CRM, manually maintained, or synchronized through API?
17. Removal target behavior for leads/deals: archived/hidden state and restoration rules.
18. Removal approval interpretation: does Manager approval of a Team Lead request execute removal immediately, despite Managers otherwise requiring Super Admin approval for their own removals?
19. Pipeline resubmission/reopen/rollback rules and permissions.
20. When a stage repeats, do canonical stage dates keep first entry or latest entry?
21. Who can add/edit/void payments, and how are refunds, overpayments, and reversals handled?
22. Currency: dollars only is implied; confirm precision and currency support.
23. Daily stats editing window, approval, and handling of multiple shifts despite one-row-per-day storage.
24. Weekly target scope: per agent, team, role, or company, and how targets change midweek.
25. Business timezone, day cutoff, week start, weekend definition, and date-range inclusivity.
26. Duplicate-lead detection by phone/email/business and merge rules.
27. Spreadsheet migration cutoff, columns, historical depth, duplicate cleanup, and whether comments/stage histories exist to import.
28. Dashboard denominator/cohort logic: independently filter numerator by its own date as stated, or use submission cohorts.
29. Null/zero denominator presentation for rates and incomplete records for cycle averages.
30. Data retention duration, backup frequency, restore objectives, and audit export requirements.

## 19. Acceptance checklist

### Follow-up engine

- Lead save fails without reach-back date and preserves form input.
- Assigned agent sees a lead on its due date.
- Overdue lead stays visible, flagged, counted, and sorted oldest-first.
- Follow-up cannot clear with only a comment.
- Follow-up cannot clear with only a next date.
- Comment plus next date removes it now and returns it on that date.
- Comment plus approved terminal status ends reminders.
- Queue filters/paginates on the server with 5,000+ leads.

### Roles and retention

- Every role can perform only approved actions.
- Team Lead/Manager user-creation scope is enforced.
- Removal creates the correct pending approval.
- Rejection changes nothing on the target.
- Approval deactivates/archives without hard deletion.
- Deactivated user cannot log in or receive active work.
- Their leads, stats, actions, and attribution remain queryable.
- Reassignment preserves original ownership history.

### Pipeline and closing

- Setter submission stamps Date Submitted.
- Team Lead approval stamps Date Approved; rejection follows confirmed Unapproved rules.
- Closer can move approved work through In Progress to Won/Lost.
- Won/Lost stamps the correct date.
- Won deal requires the confirmed service/payment fields.
- Multiple service prices sum correctly.
- Partial payments update received, outstanding, percentage, and status.
- Full payment sets Date Paid.
- Non-won or not-fully-paid deal cannot be forwarded.
- Full closing chain remains historically preserved.
- CST Manager sees handler loads and can assign a handler.
- Handoff contains every approved field exactly once.

### Stats and dashboard

- One daily call-stat record exists per agent/date.
- Off-days do not break calculations.
- Connect Rate is correct per agent and overall.
- Actual-versus-weekly-target is correct.
- Every date-range metric uses its approved source date.
- Approval, close, and connect rates match approved examples.
- Four cycle averages use the correct date pairs.
- Per-agent values sum/reconcile to overall totals where mathematically applicable.

### Audit and deployment

- Every required action produces actor, server timestamp, target, and before/after.
- Audit entries cannot be changed or deleted through the app.
- Visibility follows the final role decision.
- Test URL supports the complete agent → Team Lead → closer → Manager → CST path.
- Migrated totals reconcile to the approved spreadsheet baseline.
- Production cutover has a verified rollback and backup path.

## 20. Traceability to the original specification

| Source section | Roadmap coverage |
|---|---|
| 1. Purpose & Context | Sections 2–4 |
| 2. One Thing Better Than Excel | Sections 2 and 9 |
| 3. Roles & Permissions | Sections 5–7 and 15 |
| 4. Lead Capture | Sections 7–8 |
| 5. Follow-Up Reminder Engine | Sections 9, 16, 17, 19 |
| 6. Sales Pipeline & Stages | Sections 10, 14, 17 |
| 7. Closing, Services, Pricing & Routing | Sections 11–12 |
| 8. Daily Call Stats | Sections 13–14 |
| 9. Asad's Dashboard | Section 14 |
| 10. Audit Log & Retention | Sections 6, 7, 15 |
| 11. Open Items | Section 18 |
| Expected deliverable/test URL | Sections 17 and 19 |

This roadmap is the implementation-alignment document. Development should begin only after Phase 0 decisions are answered and the existing KPI spreadsheet has been mapped against this structure.
