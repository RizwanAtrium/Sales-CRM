# Auth + Role Update Notes

## Completed

- Sales CRM login screen is wired to `/api/auth/login`.
- Logout is wired to `/api/auth/logout` and clears the HttpOnly session cookie.
- CRM routes are protected by session checks when `CRM_DEMO_MODE=false`.
- Logged-in users are redirected away from `/login` to `/dashboard`.
- Sidebar account name/role now comes from the logged-in session instead of hardcoded text.
- Sidebar modules are filtered by role:
  - Super Admin / Manager: full CRM access.
  - Team Lead: workspace access except manager-only CST handoff/audit areas.
  - Agent: operational modules only.
- Direct URL access is blocked with `/forbidden` when a role is not allowed.
- Seed script now creates Super Admin, Manager, Team Lead, and Agent test users.
- TypeScript and ESLint passed.

## Required production env

Set these in Vercel before deploy:

```env
CRM_DEMO_MODE=false
MONGODB_URI=...
JWT_SECRET=...
CST_CRM_API_URL=https://your-cst-vercel-domain.vercel.app/api
CST_CRM_INTEGRATION_SECRET=development-sales-integration-key
```

## Test users from seed

Use one strong password for all test accounts with `SEED_TEST_PASSWORD`.

- `SEED_ADMIN_EMAIL` default: `admin@thefinedudes.com`
- `SEED_MANAGER_EMAIL` default: `manager@thefinedudes.com`
- `SEED_TEAM_LEAD_EMAIL` default: `teamlead@thefinedudes.com`
- `SEED_AGENT_EMAIL` default: `agent@thefinedudes.com`

Run:

```bash
npm run seed
```

Then test login/logout for each role.
