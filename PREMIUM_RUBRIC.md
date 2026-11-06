# Premium review rubric (defined before implementation/scoring)

This is a local/example frontend review, not an account or paid launch. Maximum 100. Unverified items earn zero, not a guessed pass. Any critical data-loss, cross-user leak, false checkout/auth or wrong money total blocks delivery irrespective of score.

| Dimension | Points | Evidence required |
|---|---:|---|
| Free boundaries and useful premium interactions | 20 | Free CRUD/bills/debt/one goal/PDF unchanged (8); working holdings/events/multiple plans/snapshots (8); working planners/export/insights (4) |
| Exact finance math | 25 | Withdrawals/baselines/transfers/contributions (10); net worth no savings/available double count (6); dated actual history and zero/invalid/overflow (5); payday/debt guards/rounding (4) |
| Local data preservation and privacy | 15 | Existing v1 core bytes preserved; isolated versioned premium data and failure atomicity (8); opt-in, unencrypted/local/example/reset clarity, no credentials or telemetry (7) |
| Security and release scope | 15 | Escaping and malicious input/CSV formula tests (6); disabled accounts/checkout/no entitlement claim (5); unchanged remote/backend and reproducible build/dependency/static checks (4) |
| Accessibility and navigation | 10 | DOM accessible labels/table/progress/native controls/navigation focus (5); actual browser keyboard/focus trapping/zoom and screen reader audit (5) |
| Responsive and brand | 10 | Exact existing assets/palette/Poppins and responsive code/automated structures (4); actual mobile visual/touch and desktop browser review (6) |
| Integration and delivery | 5 | Homepage/PDF/config/link/hash/build checks and review server (3); clean diff/documented PR without publication (2) |

Scoring records individual earned/missing points and evidence in FINAL.md. DOM is not visual/browser testing. Hosted Auth, payment authorization, production RLS and entitlement work remain prerequisites, not features certified by this rubric.
