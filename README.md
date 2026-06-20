# TFD Sales CRM

Next.js App Router CRM with a Node.js runtime and MongoDB/Mongoose backend. The product follows `Sales CRM Complete Roadmap.md` and includes a polished SaaS interface, light/dark themes, follow-up queues, lead management, pipeline, payments, call stats, team capacity, immutable audit records, and admin configuration.

## Stack

- Next.js 16, React 19, TypeScript
- Node.js route handlers for backend APIs
- MongoDB with Mongoose
- Tailwind CSS 4 and shadcn/ui
- Framer Motion animations
- JWT HttpOnly-cookie authentication with bcrypt password hashing

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Set `MONGODB_URI`, `JWT_SECRET`, and a strong `SEED_ADMIN_PASSWORD`.
3. Run `npm run seed` from a terminal where those variables are loaded.
4. Set `CRM_DEMO_MODE=false` to enforce authentication.
5. Run `npm run dev`.

`CRM_DEMO_MODE=true` keeps the interface directly accessible for design review. It must be disabled before production.

## API coverage

- `GET /api/health`
- `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- `GET|POST /api/leads`
- `POST /api/leads/:id/follow-up`
- `GET|POST /api/opportunities`
- `POST /api/opportunities/:id/stage`
- `POST /api/opportunities/:id/payments`
- `POST /api/opportunities/:id/handoff`
- `GET|POST /api/call-stats`
- `GET /api/dashboard`

All protected APIs revalidate active-user state from MongoDB. Audit entries are append-only, lead queues are server-filtered and paginated, payments are ledger-backed, and CST handoffs require Closed-Won plus Paid-in-Full state.
