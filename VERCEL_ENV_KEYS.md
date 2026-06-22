# Sales CRM - Vercel Environment Variables

Add these in Vercel Project Settings > Environment Variables for Production, Preview, and Development.

```env
MONGODB_URI=<your-sales-mongodb-uri>
JWT_SECRET=<at-least-32-character-random-secret>
CRM_DEMO_MODE=false
SEED_ADMIN_EMAIL=admin@thefinedudes.com
SEED_ADMIN_PASSWORD=<strong-password>
SEED_MANAGER_EMAIL=manager@thefinedudes.com
SEED_TEAM_LEAD_EMAIL=teamlead@thefinedudes.com
SEED_AGENT_EMAIL=agent@thefinedudes.com
SEED_TEST_PASSWORD=<strong-test-password>
CST_CRM_API_URL=https://cst-crm-api.vercel.app/api
CST_CRM_INTEGRATION_SECRET=<same-secret-as-cst-sales-crm-integration-secret>
```

Important:
- `CST_CRM_API_URL` should point to the CST backend/API deployment, not the CST frontend.
- `CST_CRM_INTEGRATION_SECRET` must exactly match CST backend `SALES_CRM_INTEGRATION_SECRET`.
