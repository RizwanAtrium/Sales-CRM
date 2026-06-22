# Step 7 — Daily Call Activity Filters and Approval Flow

Implemented on the Sales CRM Daily Call Activity screen.

## Added

- Role filter for Agents / Setters, Team Leads / Closers, Managers, and all roles.
- Team Lead / Closer filter visible only to Manager and Super Admin level users.
- Individual and multi-person selector for viewing one person, multiple people, or the whole visible team.
- Whole team reset button.
- User selector on the daily call logging form so permitted users can log stats for the correct person.
- Approved-only totals, so pending submissions do not inflate visible performance.
- Pending approval queue on the same screen.

## Approval logic

- Agent can submit only their own call stats.
- Team Lead / Closer can submit their own stats and stats for assigned agents.
- Agent submissions remain pending until approved by the Team Lead / Closer or Manager/Super Admin.
- Team Lead / Closer submissions remain pending until approved by their Manager or Super Admin.
- Super Admin submissions are approved immediately.

## Access rules

- Agent sees only own data.
- Team Lead / Closer sees own data and assigned agents.
- Manager sees own data, team leads/closers, and their teams.
- Super Admin sees all users.

## Verification

- ESLint passed.
- TypeScript `npx tsc --noEmit` passed.
