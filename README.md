# VerifyVahan — Admin Panel

Operator console for **VerifyVahan** — dashboard, finance, support tickets, users & vehicles, broadcast.
React 18 · Vite 5 · Tailwind CSS 3. Talks to the back-end admin API at `/admin/api`.

## Commands
```bash
npm install
npm run dev      # http://localhost:5176 (proxies /admin/api -> back-end :5007)
npm run build    # -> dist/
```
Production build: set `VITE_API_BASE` to the live API origin (e.g. `https://api.verifyvahan.in`).

## Auth
PIN sign-in → HMAC bearer token (in sessionStorage, dies with the tab). The back-end reads the PIN
from `ADMIN_PIN` (default `1234` for dev) and signs tokens with `ADMIN_TOKEN_SECRET`.
**The fixed PIN is a temporary single-operator gate — swap for per-admin OTP before scaling.**

## Pages
- **Dashboard** — captured revenue, today's totals, full-report/user/ticket counts, 14-day revenue bars, recent payments.
- **Finance** — all payments with status filter, method, invoice number, Razorpay payment id.
- **Support tickets** — list + status filter; one-click advance OPEN → IN_PROGRESS → RESOLVED → CLOSED (drives the one-open-ticket-per-user rule).
- **Users & vehicles** — searchable users; a detail drawer with their vehicles, reports and PDF download.
- **Broadcast** — WhatsApp message to all users or specific numbers (free-form; template needed outside the 24h window).

## Backend endpoints (src/routers/adminRouter.js in the back-end)
`POST /login` · `GET /me` · `GET /dashboard` · `GET /payments` · `GET /tickets` · `PATCH /tickets/:id`
· `GET /users` · `GET /users/:id` · `GET /reports` · `GET /reports/:id/pdf` · `POST /broadcast`
