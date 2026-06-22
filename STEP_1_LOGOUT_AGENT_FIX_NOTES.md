# Step 1 – Logout + Agent Login Crash Fix

Implemented only the first confirmed client issue.

## Fixed

- Logout now clears the `tfd_crm_session` cookie with production-safe cookie attributes.
- Logout also clears browser local/session storage and forces a clean navigation to `/login`.
- Login now performs a full page navigation to `/dashboard` after successful authentication to avoid stale RSC/client cache from the previous role.
- Role guard no longer sends users to a restricted path after role switching; unauthorized stale paths now redirect safely to `/dashboard?access=restricted`.
- Added a CRM error boundary so any unexpected role/session page error shows a controlled CRM recovery screen instead of the default Next.js "This page couldn't load" screen.

## Not changed

- No UI redesign.
- No payment/pipeline/follow-up feature changes yet.
- No CST integration changes in this step.

## Tested

- `npm run lint` passed.
- `npx tsc --noEmit` passed.
