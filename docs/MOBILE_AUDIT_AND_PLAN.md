# WePay — Audit & Android Development Plan

_Audit of `dev-lusale/wePay` at commit `604e5e2` ("update the virtual card")._

## 1. What exists today

| Area | Implementation | Status |
|---|---|---|
| Framework | Next.js 14 App Router + one Pages-Router file for NextAuth | Working |
| Database | PostgreSQL via Prisma 5.17; schema applied with `prisma db push` (no migrations folder) | Working |
| Auth (web) | NextAuth Credentials provider, JWT strategy, **httpOnly cookie**, 30-day sessions, bcrypt (cost 12) | Working |
| Registration | 3-step web form → `POST /api/auth/register` (name, email, phone, NRC, employer, NAPSA, salary ≥ 1000, password ≥ 8). Creates User + EmploymentProfile (PENDING) + CreditProfile (PENDING) | Working |
| Dashboard stats | `GET /api/dashboard/stats` — available credit = 3× salary − active loan amount | Working |
| Loan application | `POST /api/loans` — ZMW 500–100,000, 1–36 months, 18% p.a. amortised, cap 3× salary, one open loan | Working |
| Loan list | `GET /api/loans` (with repayments) | Working |
| Transactions | `GET /api/transactions` (latest 50) | Working (read-only) |
| Profile | `GET /api/user/profile` | Working (read-only) |
| Loan approval / disbursement | — | **Missing.** No admin endpoint or screen ever moves a loan out of `PENDING`, creates repayment rows or writes transactions |
| Repayment schedules | `LoanRepayment` model exists | **No code creates them** |
| Credit profile | Model exists; TransUnion score never populated | Placeholder only |
| Employment verification | `verificationStatus` always `PENDING` | No verification flow |
| Virtual cards (`/dashboard/card`) | Hard-coded card numbers, CVV, balance and card transactions in the page | **Mock UI — no backend** |
| Money transfers | — | Not implemented |
| Savings goals | — | Not in schema |
| Password reset | — | Not implemented |
| Profile pictures | — | No field / storage |
| Push notifications | — | Not implemented |
| Tests | — | None |

### Security observations
- API routes check the session themselves, so data endpoints were already user-scoped. Good.
- `next@14.2.5` has published security advisories (incl. middleware auth bypass). **Upgraded to 14.2.35.**
- Registration returned raw database error text to the client in some paths → now generic in production.
- Web login reveals whether an email exists ("No account found…") — left unchanged to preserve web behaviour; the mobile login uses one generic message. Recommend aligning the web.
- No rate limiting anywhere → added for mobile login, refresh, password reset and registration.
- The web `/dashboard/card` page shows **fabricated card numbers and balances**. It isn't exposed in the mobile app. Recommend hiding it on web until a card issuer is integrated.

## 2. Decisions

1. **Keep everything**: Next.js app, Prisma schema, existing tables and users. Schema changes are **additive only** (4 new tables). `prisma/sql/001_mobile_support.sql` is equivalent to `db push`.
2. **Mobile auth**: NextAuth cookies don't suit a native app, so the backend issues its own tokens — 15-minute JWT access tokens + 30-day opaque refresh tokens, rotated on every use, stored hashed, with reuse detection. Every access token is tied to a DB session, so logout and "sign out everywhere" take effect immediately. Same `users` table and bcrypt hashes → existing accounts sign in on mobile unchanged.
3. **One API for both clients**: existing routes now accept `Authorization: Bearer` *or* the NextAuth cookie (`src/lib/api-auth.ts`). No duplicated business logic.
4. **Loan maths lives on the server** (`src/lib/loan-rules.ts`, shared by `POST /api/loans` and the new `GET /api/loans/quote`). The app only displays what the server returns.
5. **No invented money**: where the backend has no data (no repayment schedule issued, no transactions), the app shows empty states or a clearly-labelled *estimate*. Cards, transfers and savings are **left out of the mobile navigation** — there is no backend for them.
6. **Bottom navigation**: Home · Analytics · Loans · Activity (transactions) · Profile.

## 3. New/changed API surface

| Method & path | Purpose |
|---|---|
| `POST /api/mobile/auth/login` | Email + password → access + refresh tokens |
| `POST /api/mobile/auth/refresh` | Rotate refresh token |
| `POST /api/mobile/auth/logout` | Revoke this device |
| `GET/DELETE /api/mobile/auth/sessions` | List devices / sign out everywhere |
| `DELETE /api/mobile/auth/sessions/:id` | Revoke one device |
| `POST /api/mobile/auth/forgot-password` | Email a 6-digit code (needs SMTP in production) |
| `POST /api/mobile/auth/reset-password` | Code + new password; revokes all mobile sessions |
| `GET /api/loans/quote` | Rules, salary limit, eligibility blockers, repayment quote |
| `GET /api/loans/:id` | Loan detail, official or estimated schedule, outstanding balance |
| `GET /api/transactions?q&type&from&to&before&limit` | Filtered/paginated history (no params = old behaviour) |
| `GET /api/transactions/:id` | Transaction detail |
| `GET /api/analytics?months=` | Monthly activity, totals, loan status counts, repayment progress |

## 4. Roadmap beyond this delivery (backend work needed first)
1. **Admin/operations flow** — approve/reject loans, disburse, generate `LoanRepayment` rows, record `Transaction`s. Without it, every loan stays "Pending review" and charts stay empty.
2. Employment/NAPSA verification and TransUnion credit pull.
3. Email provider (SMTP/Resend) for password reset codes.
4. Profile photo upload (needs object storage, e.g. S3/R2/Vercel Blob).
5. Push notifications (Expo push tokens table + sender) for repayment reminders.
6. Cards / transfers / savings only with a licensed issuer or payment provider (e.g. via a Bank of Zambia–authorised partner).
