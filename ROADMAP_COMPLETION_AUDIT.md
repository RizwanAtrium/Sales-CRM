# Sales CRM Roadmap Completion Audit

## Completed in this iteration

- Replaced key review-only/toast actions with persistent backend actions.
- Added opportunity stage workflow endpoints for Submitted → Approved/Unapproved → In Progress → Closed Won/Closed Lost.
- Added payment ledger endpoint that recalculates Amount Received, Amount To Receive, Payment Status, and Date Paid.
- Added Paid-in-Full + Closed-Won CST handoff endpoint with payload snapshot, audit log, retry-safe Handoff record, and CST delivery status.
- Added persistent lead update endpoint with ownership history and audit trail.
- Added persistent follow-up logging endpoint with next reach-back date sync.
- Added removal request approval/rejection persistence.
- Added CSV exports for Leads, Dashboard summary, and Audit Log.
- Updated appointment submission form to use real `/api/leads` data instead of demo lead options.
- Updated payment form to use real `/api/opportunities` Closed-Won data instead of demo opportunity options.
- Updated approval center to load live submitted opportunities/removal requests and post approve/reject decisions.
- Updated daily call stats form to save to `/api/call-stats`.
- Added `force-dynamic` to CRM layout to avoid static build auth/database assumptions.

## Verified

- `npx tsc --noEmit` passes.
- `npm run lint` passes.

## Important production notes

- A real `MONGODB_URI` and strong `JWT_SECRET` are required before production run.
- CST handoff delivery requires the CST CRM URL and integration secret to match the CST CRM project.
- Some visual list pages still include fallback/demo presentation content where no live session/database is connected, but all critical write actions above now have backend routes.
- Full browser click-through QA should still be done with seeded Super Admin, Team Lead, and Agent accounts against a real MongoDB database.
