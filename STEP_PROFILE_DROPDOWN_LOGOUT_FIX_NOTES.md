# Profile Dropdown / Logout Fix

Fixed the Sales CRM top-right profile menu crash where clicking the Asad/Super Admin profile area or signing out could send the app into the generic "This page couldn't load" screen.

## Changes

- Replaced the Base UI dropdown in the CRM shell with a small controlled native React account menu.
- Account menu opens/closes without route changes or hydration-sensitive menu primitives.
- Sign out now clears localStorage and sessionStorage before redirecting.
- Logout request uses `credentials: include` and `cache: no-store`.
- Login form clears stale browser storage before authenticating a new user.
- Login redirect now uses `window.location.replace('/dashboard')` to avoid stale role/session history.

## Files changed

- `src/components/shell/app-shell.tsx`
- `src/components/auth/login-form.tsx`

## Test

After deploy, test:

1. Login as Super Admin.
2. Click top-right Asad/Super Admin menu.
3. Open Profile/Preferences.
4. Sign out.
5. Login as Agent.
6. Confirm `/dashboard` loads instead of "This page couldn't load".
