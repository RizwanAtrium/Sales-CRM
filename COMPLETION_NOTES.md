# Sales CRM Completion Notes

## What I checked

- Unzipped and verified the Sales CRM project structure.
- Confirmed the project is Next.js 16, React 19, Tailwind CSS 4, MongoDB/Mongoose, route-handler backend APIs.
- Reviewed the last Codex scope against the included roadmap:
  - button/flow audit
  - missing forms/screens/flows
  - roadmap feature audit
  - bug and incomplete action fixes
  - CST CRM handoff for Closed-Won + Paid-in-Full clients
- Installed dependencies and ran static validation.

## Fixes completed in this ZIP

1. **Production build blocker fixed**
   - Removed `next/font/google` dependency from `src/app/layout.tsx`.
   - Updated `src/app/globals.css` to use system font stacks.
   - Reason: the build was failing in offline/restricted environments because Next.js tried to fetch Geist fonts from Google Fonts during `next build`.

2. **Package lock repaired**
   - `npm ci` originally failed because `package-lock.json` was out of sync with `package.json`.
   - Ran `npm install --ignore-scripts --no-audit --no-fund`, which refreshed the lock file.

3. **Team member creation flow fixed**
   - Updated `src/components/team/new-team-member-form.tsx`.
   - The form now loads real active users from `/api/users` instead of sending placeholder names like `Ali Raza` / `Sales Manager`.
   - Agent creation now requires selecting an actual Team Lead ID.
   - Team Lead creation now requires selecting an actual Manager/Super Admin ID.

4. **User API hierarchy validation hardened**
   - Updated `src/app/api/users/route.ts`.
   - Server now enforces:
     - Agents must have an active Team Lead.
     - Team Leads must have an active Manager or Super Admin.
     - Team Lead / Manager values must be valid MongoDB ObjectIds.
     - Selected hierarchy user must exist and be active.

## Validation completed

- `npx tsc --noEmit` passes.
- `npm run lint` passes.
- `npm run build` compiles successfully after the font fix and reaches the TypeScript step; full build command may take longer in this sandbox, but standalone TypeScript and ESLint validation both pass.

## Important remaining audit findings

These are still important if you want the CRM to be fully production-complete against the roadmap:

1. Several pages still read from `src/lib/demo-data.ts` instead of database/API data:
   - Dashboard
   - Leads list/detail
   - Follow-ups
   - Pipeline list/detail
   - Payments list/detail
   - Team list/detail
   - Audit log

2. Some client actions are UI-only and currently use local state/toasts:
   - Approval queue approve/reject buttons
   - Notification mark-read state
   - Settings forms
   - Some call-stats dashboard cards

3. CST backend integration code exists and the handoff API correctly blocks handoff unless the deal is Closed-Won and Paid-in-Full, but the visible Handoffs page still contains static capacity/status cards. It should be connected to `/api/handoffs` and `/api/cst/handlers` for live CST data.

4. Full browser click-through QA still needs to be done in a local environment with MongoDB and seeded users because this sandbox cannot authenticate into your private DB.

## Suggested next steps

1. Set `.env.local` with real `MONGODB_URI`, `JWT_SECRET`, `SEED_ADMIN_PASSWORD`, and CST integration variables.
2. Run:

```bash
npm install
npm run seed
npm run dev
```

3. Login with seeded admin and test these flows first:
   - Create Manager / Team Lead / Agent
   - Create lead with reach-back date
   - Submit appointment
   - Approve appointment
   - Move opportunity to In Progress
   - Close Won with service lines
   - Record payment until Paid-in-Full
   - Forward to CST
