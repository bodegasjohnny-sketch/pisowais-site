# Piso Wais dashboard review build

## Review now, no hosting changes

- Source: `site/pages/dashboard.html`, `site/dashboard-layout.html`, `site/css/dashboard.css`, `site/js/dashboard/*`.
- Stable intended public route: `/dashboard/` (also works under the GitHub Pages repo subpath).
- `npm ci && npm run build` builds the static site and vendors the pinned Supabase browser SDK. Do not use only `python3 build.py` for an account-enabled release: it does not bundle the SDK.
- `python3 -m http.server 8793 --bind 0.0.0.0 --directory docs` then open `http://localhost:8793/dashboard/`.
- Example-only deep link for design review: `http://localhost:8793/dashboard/?demo=1`.
- No merge, Pages publish, hosted migrations or database writes are part of this review build.

## What works without a backend

The example preview has explicit fictional data and in-memory edits. Reload resets it. Local preview requires a checkbox consent, starts with zeros, and persists to this browser only. It is unencrypted, not synced, not backed up, not an account, and never automatically uploaded. Both paths support income/expense/savings/withdrawal/debt-payment entries, edit/delete confirmation, bill reminders + one linked payment, one goal, debt balances, category charts, total and goal drilldowns. Invalid inputs and broken links are rejected. Delete referenced entries before deleting a goal/debt/bill.

Payday allocation and avalanche/snowball calculations work **only in the labelled example preview**. They are proposed Premium concepts, not paid features sold to users. Multiple goals and export are not implemented. There is no price, checkout, entitlement token, subscription or charge. Real and local modes cannot activate Premium. The backend enforces one free goal per owner; no client-editable paid entitlement exists.

## Calculation contract

Amounts are integer centavos, never floating-point pesos. All-time, **cash-basis** available-to-budget = income - cash/debit expenses - savings deposits + savings withdrawals - debt payments. This is a record-book net amount, not a bank balance. Record only one type per outflow: do not record a credit-card purchase as an expense and then also record the repayment. Savings/transfers and debt payments are excluded from expense graphs. Opening goal savings/debt and unpaid bills are not income/expenses. Linked bill payments are unique. Removing a linked expense makes that bill unpaid again. Interest/new borrowing are not applied to the manual debt balance automatically; reconcile against a lender statement.

Scenario assumptions: annual rate in basis points, monthly interest rounded to centavos, fixed rates, minimums first then extra to highest APR (avalanche) or lowest balance (snowball). No new fees or borrowing, no promised payoff date. Fail clearly below minimums or if not paid within 600 months. Payday percentages must be whole numbers totalling 100; the largest-remainder method assigns centavos exactly. Plans do not write transactions.

## Account launch prerequisites — NOT done

1. Johnny must select/approve a **dedicated Piso Wais** Supabase project. Read-only connector discovery found gsql-test, Forge, AI Prompt Library, apex-climate-hvac and corzo-calls, none identified as Piso Wais. None was selected, linked, modified or read for private data. No new infrastructure or paid plan was provisioned.
2. Review `supabase/migrations/20261106163745_piso_wais_finance.sql` and apply first to an isolated staging project. The file has **not** been applied to any hosted database. Enable email Auth, disable anonymous sign-ins, select the storage region, and configure trusted URLs. Test migrations and Supabase security/performance advisors there before production approval.
3. Configure real email delivery (SMTP), rate limits/abuse controls/CAPTCHA as appropriate. Set both new-user confirmation and email sign-in templates to include `{{ .Token }}` as a one-time code. The app calls `signInWithOtp` then `verifyOtp(type: 'email')`; it deliberately does not process magic-link callback URLs. No real email was sent by this build.
4. After staging verifies identity + schema + owner isolation, set `site/config/dashboard.json` to the dedicated HTTPS API URL and **modern publishable** `sb_publishable_...` key, plus `accountsEnabled: true`. This JSON is public. **Never add a service-role/secret key or a password.** Missing/invalid config fails closed and shows setup-required copy. Do not enable the account switch just because the migration exists.
5. Sessions use the official pinned `@supabase/supabase-js` SDK with `persistSession:false`, `autoRefreshToken:true`, `detectSessionInUrl:false`. Session/OTP/password are not saved in localStorage. Reload requires signing in again. Logout disposes the adapter and clears account records from the tab; in-flight responses are epoch-guarded against user changes. RLS remains the authorization boundary. Queries also filter `owner_id`, updates/deletes request a returned row, reads paginate beyond the server row cap.
6. The migration enables RLS on all four exposed tables, revokes anon and broad default privileges, grants only authenticated CRUD, and uses owner SELECT/INSERT/UPDATE/DELETE policies. Composite owner+record foreign keys forbid cross-user goal/debt/bill linking. A unique owner goal rule, a unique bill payment rule, per-owner advisory locks and private invoker triggers enforce balances. There are no public views, exposed privileged functions, user_metadata decisions or paid entitlements.
7. Confirm retention/deletion/backup policy, processor region and operational contact before collecting personal finance data. Revise the privacy page's prelaunch wording to match the final configuration. For approved administrative erasure, delete a user's transactions, goals, debts and bills in one transaction before removing their Auth account; revoke sessions first. No self-service Auth-account deletion is claimed. Test this on staging.
8. Verify two real staging users cannot read/update/delete/link the other account's records, OTP delivery, expired/revoked sessions, offline/network errors, API pagination, and simultaneous withdrawals/payments from two sessions. The local PostgreSQL suite verifies SQL/RLS behaviour, not Supabase's hosted email/JWT/PostgREST deployment or multi-connection load.

## Tests and limitations

`npm test`: existing calculators/articles/quizzes plus dashboard model, local persistence, scoped/disposed/paginated adapter, DOM-only UI interaction (jsdom), and the **actual SQL migration in isolated PGlite PostgreSQL** under anon/authenticated roles and two identities. No hosted project is touched. This is not a completed production security audit. Parent should separately review desktop/mobile screenshots, overflow, keyboard/focus and accessibility with an actual browser. Browser automation was not run by this worker.

No statement import, bank connection, money movement, automatic interest posting, recurring bills engine, real paid entitlement/payment, multiple goals, export, or cross-device account sync has been verified in a live environment. Avoid claiming those are launched.

## Lead magnet integration

The revised source/PDF/QR from `/workspace/pisowais-leadmagnet-revision/` were copied to `site/cheatsheet/cheatsheet.html`, `site/downloads/piso-wais-cheat-sheet.pdf`, and `site/cheatsheet/art/qr-dashboard.png`. The normal build copies the PDF to `docs/downloads/`. The stable download filename is unchanged. 12 pages, 4,062,666 bytes; the useful free core and Coming soon / no agreed price wording remain. No source snapshots or QA files are copied to the public tree. `/dashboard/` CTAs are prelaunch until a verified release. Existing PDF cover art is unchanged because the cover layout/art remains the same.
