# Step 4 - Follow-up reach-back timezones and missed notifications

Implemented for the Sales CRM follow-up workflow:

- Reach-back now stores both date/time and a USA timezone.
- New Lead form includes a USA timezone dropdown.
- Lead follow-up dialog includes next reach-back date/time and timezone.
- Follow-up queue calculates overdue work using the stored reach-back date/time.
- Missed reach-back notifications are created automatically when the follow-up queue or notifications API is loaded.
- Notification recipients include:
  - assigned owner / agent / closer
  - their Team Lead, when assigned
  - their Manager, when assigned
  - all active Super Admin users
- Notification copy clearly says which user missed which lead/customer/business.
- Notifications are persistent in MongoDB and can be marked read.

USA timezone options added:

- Eastern Time (ET) - America/New_York
- Central Time (CT) - America/Chicago
- Mountain Time (MT) - America/Denver
- Arizona Time (MST) - America/Phoenix
- Pacific Time (PT) - America/Los_Angeles
- Alaska Time (AKT) - America/Anchorage
- Hawaii Time (HST) - Pacific/Honolulu

Validation completed:

- `npm run lint` passed
- `npx tsc --noEmit` passed

No visual redesign was done.
