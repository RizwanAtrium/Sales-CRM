# Step 6 - Role-based Pipeline + Closed Sale Flow

Implemented for the Sales CRM pipeline screen:

- Same board/list pipeline view remains available to Agent, Team Lead/Closer, Manager, and Super Admin.
- Pipeline data is now filtered by role hierarchy:
  - Agent sees opportunities where they are setter/closer.
  - Team Lead/Closer sees their own opportunities plus assigned agents.
  - Manager sees their own opportunities plus team leads/closers and their agents.
  - Super Admin sees all opportunities.
- Pipeline cards/list now show Agent/Setter and Team Lead/Closer ownership.
- Role-specific stage visibility was added:
  - Agent pipeline: Submitted, In Progress, Rejected/Reversed, Approved.
  - Team Lead/Manager/Super Admin pipeline: Submitted, In Progress, Rejected/Reversed, Approved, Closed Won, Closed Lost.
- Stage update API now validates role permissions and opportunity visibility.
- Closed Won sends notifications to closer, team lead, manager, and super admins.
- Closed sale services remain multi-line with per-service prices and total deal value.
- CST handoff label/flow changed so Sales forwards to CST Manager queue, not directly to an individual CST handler.

No theme/design rewrite was done; this is a controlled behavior/data-flow patch.
