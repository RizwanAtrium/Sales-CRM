# Step 2 - Payment Sale Log Update

Implemented for the Record Payment screen:

- Payment form now captures required customer/business details:
  - Business name
  - Customer name
  - Phone
  - Mobile
  - Email
- Payment form now captures sale ownership:
  - Agent / setter
  - Closer
  - Entered by current logged-in user through the backend session
- Supports multiple services/add-ons in the same sale log.
- Each service has its own price.
- Total services amount is calculated in the UI.
- Backend stores a full payment snapshot with customer details, service lines, total sold amount, agent, closer, and entered-by user.
- Backend updates the linked Lead and Opportunity with the latest customer details, ownership, service lines, total deal value, received amount, outstanding balance, and payment status.
- Agent users can only record their own sale/closer details.
- Admin/manager/team-lead users can select the agent and closer.
- If payment reaches Paid in Full, existing CST handoff logic still runs.

Validation:

- `npm run lint` passed.
- `npx tsc --noEmit` passed.

No unrelated UI redesign was made.
