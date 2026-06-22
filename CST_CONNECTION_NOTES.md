# CST CRM Connection Notes

Changes made without changing the UI/design:

- Fixed the Sales CRM hydration warning caused by browser-injected body attributes by adding `suppressHydrationWarning` to the body tag.
- Sales CRM now connects to the CST CRM integration endpoint:
  - `POST {CST_CRM_API_URL}/integrations/sales/handoffs`
  - `GET {CST_CRM_API_URL}/integrations/sales/handlers`
- When an opportunity becomes `PAID_IN_FULL`, Sales CRM creates/syncs the handoff to CST CRM automatically.
- Manual manager handoff still works from the Sales CRM handoff action.
- CST CRM already contains the receiver API. It creates:
  - Client
  - Client services
  - Onboarding checklist
  - Audit log

Required env values:

Sales CRM `.env.local`:

```env
CST_CRM_API_URL=http://localhost:5000/api
CST_CRM_INTEGRATION_SECRET=development-sales-integration-key
```

CST CRM backend `.env`:

```env
SALES_CRM_INTEGRATION_SECRET=development-sales-integration-key
```

Both secrets must match.
