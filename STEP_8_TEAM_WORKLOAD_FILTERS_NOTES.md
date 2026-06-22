# Step 8 — Team and Workload filters

Implemented on the Sales CRM Team and Workload screen.

## Added

- Removed CST handler capacity block from Sales CRM Team and Workload.
- Added role filter for Setter, Team Lead, Closer, and Manager views.
- Added team filter for whole team or specific team views.
- Added individual person filter.
- Super Admin style view now shows setters, team leads/closers, and managers together.
- Team cards now show metrics according to JD:
  - Setters: Calls, Booked, Approved.
  - Team Leads/Closers: Approved, In progress, Won.
  - Managers: Approvals, Closed, Revenue.
- Cards display team and hierarchy context for each member.

## Preserved

- Existing page style and CRM visual system.
- Existing add team member flow.
- Existing role/auth work from previous steps.

## Note

This screen is now sales-only. CST capacity belongs inside CST CRM, not Sales CRM.
