# Piso Wais Premium - review only

## Status / review routes

Branch `feat/piso-wais-premium-tools`, based on clean `origin/main` dfdcdf9.
This change is NOT merged or published. Existing public version and port 8793 are untouched.
Isolated review worktree: `/workspace/pisowais-premium-review`.
Server: `http://localhost:8794` (static `docs/`).

- Offer, no data: `/dashboard/?view=premium`
- Explicit examples: `/dashboard/?demo=1&premium=1&view=assets`
- Net worth: `/dashboard/?demo=1&premium=1&view=networth`
- Insights / downloads: `/dashboard/?demo=1&premium=1&view=insights`
- Free regression: `/dashboard/` or `/dashboard/?demo=1`
- Synthetic local entries: choose **Use local preview**, acknowledge unencrypted storage, then Your data > Try extra tools and acknowledge the separate extra-data consent.

Do not use sensitive real numbers in a test preview, especially on shared devices. Different ports are different browser storage origins. No data is imported from the public website or port 8793.

## Boundaries

| Free, kept or added | Optional premium tool preview |
|---|---|
| Income/expense/savings/debt-payment CRUD and drilldowns | Non-cash assets, dated contribution/withdrawal/value events |
| Bills, mark-paid once, basic debt balances | Allocation and value versus net tracking capital chart |
| One linked savings goal | Multiple additional **manual earmark plans** |
| New core transaction CSV, no upgrade needed | Recorded net worth and explicit daily snapshots |
| Existing free 12-page PDF and stable links | Payday allocation, debt payoff strategies, rule-based insights, CSV/JSON exports |

Proposed offer: **PHP 99/month or PHP 990/year**. Not purchasable. No checkout, payment details, trial renewal, fake success screen or paid entitlement. The frontend toggle is explicitly not a security boundary.
Cloud accounts remain disabled, config unchanged. Extra tools intentionally refuse account mode. There is no premium remote schema, API or server-enforced entitlement in this PR. No Supabase project selection, remote migration or Finance Vitality change was made.

## Accounting contract

- Integer centavos. Every flow needs an actual post-event value, dated today or earlier in Asia/Manila. Same-day latest-entered event determines the value; editing keeps sequence. Backdating recalculates from actual dates.
- `net tracking capital = opening baseline value + contributions - withdrawals`.
- `tracked gain/loss = current recorded value + withdrawals - opening baseline - contributions`.
- Opening baseline is the market/manual value when tracking starts, NOT original lifetime cost. Gain is since tracking began, not unrealized tax gain, annualized ROI, IRR or a promised return. Withdrawals include cash distributions; profitable full exits can have negative net capital. No percentage ROI is invented.
- A transfer between holdings is an equal withdrawal/contribution. No automatic ledger entry, bank balance change or expense/income is created.
- Net worth = manually reconciled cash/deposits + non-cash holding values - current free debt balances. Cash includes cash-held savings earmarks. Investment-held earmarks are already in asset values. Goals, available-to-budget and recorded income are NEVER added as separate assets. This avoids automatic double counting; users must still avoid registering the same asset twice.
- Cash is independent from available-to-budget and is NOT auto-adjusted by ledger/asset changes. Reconcile it manually. Assets and cash may have different valuation dates; the UI and snapshot show the source dates.
- Net-worth snapshots capture **today only**, explicitly, at most one per Manila date with confirmed replacement/deletion. They retain copied totals/source dates after later edits or asset deletion. Past debt is not reconstructed and no history is fabricated.
- Additional goals are manual targets/balances, separate from the free transaction-linked goal. They do not post transfers. Full cloud multi-goal transaction integration is not implemented.
- Payday uses deterministic largest-remainder centavo allocation and whole percentages totaling 100; plans post nothing. Debt scenarios use fixed APR, exact half-up monthly centavo interest, minimums first then avalanche/snowball extras, no new borrowing or fees, a 600-month limit and negative-amortization/no-overall-principal-progress guards. Lender terms may differ; a rejected strategy displays no payoff estimate.

## Storage / security

Free key `piso-wais-local-preview-v1` and its validation/one-goal constraint are unchanged. No free-data migration is needed or performed.
Separate extra key `piso-wais-premium-preview-v1`, with `{version:1,...}`, is loaded only after extra local consent. Unsupported/corrupt versions fail closed without overwriting. Write failures leave memory/storage unchanged; stale-tab writes are rejected. Loading returns defensive copies. Explicit **clear only extra data** keeps all free records. **Clear local preview data** confirms removal of both namespaces. Turning tools off retains data and can be reversed free of charge.

Both namespaces are UNENCRYPTED, browser-local, not synced or backed up; another person using the browser can see them. This is not account isolation. Example data remains in memory only and never reads/writes either local namespace. No account passwords/tokens, analytics, personal-number logs, live quotes, automatic payments, bank integrations or scheduled alerts were added.

User strings are escaped. CSV text beginning with spreadsheet formula/control characters is apostrophe-prefixed as well as quoted; amounts are exact integer centavos. JSON downloads contain preview data, not credentials; keep files private. No JSON import/restore or PDF report export is claimed.

## Desktop/browser QA checklist for parent (not yet performed by executor)

1. Offer route: verify planned PHP 99 / PHP 990, not-purchasable copy, disabled accounts, no checkout or email/password collection. PDF stays free.
2. Example Assets route: expect **PHP 18,600 value**, **PHP 18,000 net tracking capital**, **PHP 600 tracked gain**. Chart has four actual sample dates. Open a holding detail; edit only via explicit actions.
3. Add synthetic asset baseline PHP 1,000. Add contribution PHP 200, post-value PHP 1,250; tracked gain PHP 50. Add withdrawal PHP 300, post-value PHP 1,000; tracked gain PHP 100. Edit/delete events and asset, confirm cancellation/delete behavior. Test a name with quotes/HTML (must remain inert text).
4. Example Net worth: cash PHP 40,000 + assets PHP 18,600 - debts PHP 23,000 = **PHP 35,600**, not plus the PHP 6,000 free goal or extra earmarks. Save a snapshot. Change cash to PHP 50,000: live PHP 45,600, saved PHP 35,600 until explicit confirmed replacement. Delete snapshot with confirmation.
5. Goals: free linked emergency fund unchanged; create/edit/delete two extra manual plans. Neither changes free income or net worth. Free goal transfers continue working.
6. Plan: PHP 0.29 at 33/33/33/1 produces PHP 0.10/0.10/0.09/0.00. Percentages 99 must reject. No transactions are posted.
7. Debt: zero APR PHP 1,000, min PHP 100, monthly budget PHP 300 => 4 months, PHP 0 interest, PHP 1,000 paid. APR 12%, PHP 1,000 balance and PHP 10 total budget => no interest-only estimate. Basic debt tracker remains free.
8. Local mode with synthetic data: reload, explicitly re-enable extra tools, verify retained data. Turn extra tools off; free CRUD/export still works. Clear only extra data; free ledger stays. Clear-all confirmation clearly names both namespaces.
9. Insights: only documented on-screen rules. Download CSV/JSON; verify centavo units and private local files, with no network upload.
10. Real browser keyboard Tab/Enter/Escape, dialog focus restoration/trapping, 200% zoom, small phone portrait/landscape and touch. Executor DOM tests do not establish these.

## Before any real account / paid launch

Select the correct dedicated backend with approval; review/apply appropriate migrations only after explicit approval; finish hosted Auth/redirect/email/OTP/session/erasure testing; production owner/RLS/API/concurrency tests; design premium tables and multi-goal links with server-verified entitlements (do NOT relax free one-goal RLS by trusting the UI); approve actual billing provider, final offer/pricing/renewal/cancellation/refund terms; implement verified payment webhooks and authorization. Add import/restore and fully integrated goals/asset transfers only with reviewed accounting/data migrations. Complete real desktop/mobile/accessibility review and release approval. No remote migration files were added or applied in this change.

Free PDF untouched: `site/downloads/piso-wais-cheat-sheet.pdf` / `docs/downloads/piso-wais-cheat-sheet.pdf`, SHA256 `f3a6f423a47a33ddcf95b2cbb46acc78aee1ff6829517e274f76a04ccba3fdf5`.

## Verification at handoff

- `npm run build`: 30 pages, generated docs and local SDK build successful.
- `npm test`: **121 passing checks**: 57 existing calculator/article/quiz checks plus 64 dashboard tests/subtests, zero failures/skips. Includes 34 new premium checks and the unchanged local PGlite owner/RLS suite. PGlite is not hosted Auth/API/concurrency testing.
- `python3 qa_static.py`: all static checks passed (12-page PDF checked).
- `npm audit`: zero reported dependency vulnerabilities.
- `git diff --check`: clean before commit.
- HTTP verification: 23 actual review routes/modules/brand/font/config/PDF resources, all 200 and byte-identical to `docs`. This does not prove browser rendering.
- No real desktop/mobile visual review, native keyboard/screen reader audit, live-account or payment testing performed by this executor. The parent performs browser QA next.
- Criteria were defined before implementation in `PREMIUM_RUBRIC.md`. Scored evidence is also handed to the parent as a local review artifact, not a production-readiness claim.
