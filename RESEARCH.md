# Piso Wais research notes

All facts checked on **2026-11-04 (Asia/Manila)** unless marked. "Verified" = read on the official page (direct fetch or curl) or on a regulator/government page. "Verified (search index)" = text of the official page read through the search engine's index because direct fetch was blocked. "Secondary" = news or comparison site only. "Unverified" = not confirmed; NOT used on the site as fact.

The site's single data file is `site/data/rates.json`; every rate on the site and in the PDF comes from it or from this file.

## 1. Rules that apply to all deposits

| Fact | Status | Source |
|---|---|---|
| PDIC max deposit insurance: PHP 1,000,000 per depositor, per bank, effective March 15, 2025 | Verified | https://www.pdic.gov.ph/MDIC |
| 20% final withholding tax on interest from peso bank deposits of individuals (NIRC Sec. 24(B)(1)); CMEPA (RA 12214) applies flat 20% from July 1, 2025 | Verified (PwC PH, DOF) | https://www.pwc.com/ph/en/news/2025/income-tax-on-interest-income-earned-from-bank-deposits.html ; https://www.dof.gov.ph/dof-calls-out-fake-news-cmepa-does-not-impose-a-new-tax-instead-corrects-an-unfair-system-that-favors-the-wealthy/ |
| E-wallet balance is not a deposit; savings products inside apps are accounts at partner banks (GSave = CIMB; Maya Savings = Maya Bank) | Verified (CIMB PDS, Maya Bank page) | https://www.cimbbank.com.ph/content/dam/cimbph/pds/2026-pds/GSave%20Account%20Product%20Disclosure_20260601_2.3Base%20Rate.pdf ; https://www.mayabank.ph/highinterestsavings/ |

## 2. Traditional bank baseline

| Product | Rate | Conditions | Status | Source |
|---|---|---|---|---|
| BPI Regular Savings | 0.0625% p.a. | Earns only if daily balance >= PHP 5,000; PHP 3,000 to open / MADB | Verified (curl of official page) | https://www.bpi.com.ph/personal/bank/savings-accounts/regular-savings |
| BDO Regular Savings | 0.0625% (search result) | The page found is BDO **Network Bank** (rural bank), not BDO Unibank | Not used | https://www.bdo.com.ph/bdonetworkbank/deposits/regular-savings |
| BSP weekly savings deposit rates, universal/commercial banks | range 0.00% to 5.75% (high/low quotes, not an average) | weekly release Oct 26, 2026 | Verified (search index) | https://www.bsp.gov.ph/Statistics/Financial%20System%20Accounts/weeklypressrelease.pdf |

## 3. E-wallets and digital banks (base rates, gross p.a.)

| Platform / product | Base rate | Conditions, caps, promos | Insurance / holder | Min deposit, limits, fees | Status | Sources |
|---|---|---|---|---|---|---|
| GCash, GSave by CIMB | 2.30% (from 2.60% on Jun 1, 2026) | Interest credited monthly; basic GSave PHP 50,000 cumulative deposit cap and 12-month validity (PDS); GCash help: deposit limit PHP 100,000/yr basic, withdraw limit PHP 100,000/day; pre-selected users may get CIMB Grow 4% | Deposit at CIMB Bank PH (bank). PDIC status not read on a CIMB page: shown as "confirm in app" | No minimum deposit; GSave partner banks dormancy fee PHP 30 after 24 months no use | Verified (CIMB FAQ, CIMB advisory, CIMB PDS); GCash help (search index) | https://www.cimbbank.com.ph/en/help-and-support/faqs/savings-account/gsave-account/what-is-the-interest-rate-of-the-gsave-account.html ; https://www.cimbbank.com.ph/en/help-and-support/customer-advisories/2026/important-advisory-on-cimb-deposit-interest-rates.html ; https://help.gcash.com/hc/en-us/articles/12520304490905-What-is-the-interest-rate-in-GSave-by-CIMB ; https://help.gcash.com/hc/en-us/articles/4414721290521-GSave-interest-rates-transaction-limits-and-fees |
| GCash GInvest, GCredit | n/a | GInvest = investment marketplace (funds/stocks, not deposits, can lose value); GCredit = revolving credit line, not savings. Mentioned only as context, no rates | n/a | n/a | Context only (not researched in depth) | n/a |
| Maya, Maya Savings (Maya Bank) | 3% base (from Apr 1, 2026; 3.5% before per secondary source) | Boost tiers 5% to 12% need monthly transaction missions; 13%/15% for select users only; boosts apply only to first PHP 100,000. New-user promo 15% for 1 month after deposit of PHP 1,000 (promo stated through Nov 30, 2026). No deposit/withdrawal for 2 years = no interest | Held by Maya Bank, Inc. PDIC cover per secondary source (phbanks.com); site says "confirm in app" | Credited daily | Verified (mayabank.ph curl); promo extension via maya.ph deals page | https://www.mayabank.ph/highinterestsavings/ ; https://www.maya.ph/deals/cashin/get-banked-with-maya-to-enjoy-new-user-exclusive-perks-november-2024 ; https://phbanks.com/maya (secondary) |
| GoTyme Bank, GoalSave | 3.0% | Up to 5 GoalSaves, "no missions, no limits"; paid monthly, 20% WHT (search index of help page) | Page states savings insured by PDIC | No min/max balance (search index) | Verified (curl of official page for rate) | https://www.gotyme.com.ph/save-and-invest |
| Tonik, Solo Stash / Group Stash | 3.25% / 3.25% (3.75% with owner + 2 participants) | Tonik Account only 0.1%. Rates cut Oct 19, 2026 (Solo from 4%). Time deposit 3.5% to 4% + 1% conditional | Tonik states PDIC up to PHP 1M per depositor | Max 5 stashes | Verified (official rates page); cut date from Bankero (secondary) | https://tonikbank.com/deposit-interest-rates ; https://tonikbank.com/savings-cards/group-stash ; https://bankero.com.ph/tonik-slashes-savings-interest-rates-starting-oct-19/main-news/ |
| Seabank = MariBank (renamed), Savings | 3.25% up to PHP 1M; 3.75% above PHP 1M | Credited daily, no maintaining balance; rate effective Jan 15, 2026 (YugaTech) | MariBank states PDIC up to PHP 1M per depositor | Free transfers from ShopeePay; other banks/e-wallets may charge to send in | Verified (official fees page + product page) | https://www.maribank.ph/fees-rates ; https://www.maribank.ph/product/savings ; https://www.yugatech.com/news/maribank-interest-rate-down-to-3-75-p-a/ |
| CIMB Bank PH, UpSave / CIMB savings | 2.30% | From Jun 1, 2026 for GSave, UpSave, DragonFi Save, CIMB Grow. "Earn More" promo up to 4.15% until Dec 31, 2026 on ADB growth (secondary, PesoHub) | Bank; PDIC not read on page | | Verified (advisory); promo secondary, NOT on site | https://www.cimbbank.com.ph/en/help-and-support/customer-advisories/2026/important-advisory-on-cimb-deposit-interest-rates.html |
| Komo (EastWest Rural Bank) | 2.5% | Tiers (1.5% on next PHP 1.5M, 1% above PHP 2M) | "Backed by EastWest" | | Rate verified (curl komo.ph/savings); tiers unverified | https://www.komo.ph/savings |
| Salmon, Salmon Save | 4% (from 3% on Aug 24, 2026) | No maintaining balance; daily calculation. Time deposits 6% to 8% by amount (search index, not on site) | PDIC not confirmed on the page read | | Verified (official help page) | https://salmon.ph/help/how-much-interest-will-i-earn-from-salmon-save |
| OwnBank, Own It | 3.8% | Daily accrual, PHP 1 min, subject to change; Basic account PHP 50,000 max (PesoHub, secondary) | Not confirmed | No max withdrawal limit (terms) | Verified (official terms page) | https://www.ownbank.com/protocol/42 |
| UNO Digital Bank, #UNOready Savings | 3.50% (PHP 5,000 to <5M); 3.00% below 5,000; 1.00% from 5M | Daily credit; 1% bonus ended Oct 31, 2026 | Not confirmed | | Verified (search index; direct fetch blocked) | https://www.uno.bank/savings-account/ ; https://www.uno.bank/1-percent-bonus/ |
| UnionDigital, NetBank, GoTyme TD etc. | | Seen in comparison sites; not researched | | | Unverified, not on site | https://pesohub.ph/rates/savings-rates/best-digital-bank-rates-philippines/ |

## 4. Referral programs (official pages found)

| Platform | What we found | Status |
|---|---|---|
| GoTyme | "50-50 Referral Rewards" promo: up to 100 Go Rewards points each for referrer and friend after two PHP 50 in-store debit-card payments within 15 days (Jul to Dec 2026) | Search index of official page: https://www.gotyme.com.ph/promos/50-50-referral-rewards |
| Maya | "Member Get Member" page: vouchers for referrer (up to PHP 4,000) and friend (PHP 50) after qualifying activity, Nov 2026 | Search index of https://www.maya.ph/refer ; amounts NOT put on site |
| Tonik | "Friends with Benefits": PHP 1,000 per approved and disbursed Quick/Flex Loan referral | Search index of https://tonikbank.com/loans-fwb-terms (loan referral; promoting loans has extra compliance risk) |
| MariBank | "Refer and Earn" help article exists; reward terms not read | https://www.maribank.ph/help-center/article/10205-refer-and-earn (unverified terms) |
| GCash, CIMB, Komo, Salmon, OwnBank, UNO | Not found / not checked | Unverified |

No referral earnings are promised anywhere on the site.

## 5. Credit cards (BSP)

| Fact | Status | Source |
|---|---|---|
| Interest/finance charge ceiling: 36% per year (3% per month) on credit card transactions | Verified (BSP Circular 1165, Jan 2023, in force; industry still lobbying to lift it as of Jan 2026) | https://www.bsp.gov.ph/Regulations/Issuances/2023/1165.pdf ; https://businessmirror.com.ph/2026/01/23/ccap-wants-interest-cap-lifted-to-boost-inclusion/ |
| Credit card installment loans: max 1% monthly add-on | Verified | same |
| Cash advance: max PHP 200 processing fee per transaction, plus interest | Verified | same |
| Ceiling reviewed by BSP every 6 months | Verified | same |
| Earlier Circular 1098 (2020) set 2%/month; superseded by 1165 | Verified (search) | https://www.bsp.gov.ph/Regulations/Issuances/2020/c1098.pdf |
| Late payment fee amount (e.g., PHP 850 or unpaid MAD) | Issuer-specific, NOT a BSP cap | Unverified as a rule; not on site |
| Minimum amount due rules | Issuer-specific | Unverified; site only says "minimum payment is a trap" |
| Float of ~45 to 50 days | General card mechanics, depends on card; stated as "can reach roughly" | Not a verified universal number; worded as approximate |

## 6. Wealth basics

| Fact | Status | Source |
|---|---|---|
| Pag-IBIG MP2 2025 dividend rate 7.12% (announced Feb 27, 2026) | Verified across 3 outlets (search index) | https://www.pna.gov.ph/index.php/articles/1270003 ; https://www.gmanetwork.com/news/topstories/nation/978147/pag-ibig-announces-record-64-34b-dividend-for-2025-regular-savings-earn-6-62-m-2-yields-7-12/story/ ; https://mb.com.ph/2026/02/27/pag-ibig-fund-declares-record-p6434-b-dividends-for-2025 |
| RTBs, UITFs, index funds | Described neutrally, no rates | n/a |

## 7. Platform / brand facts

| Fact | Status | Source |
|---|---|---|
| BMF Vault: "200K+ community members" of Business Minded Filipinos | Verified on bmfceo.vip (curl). Not used as social proof on the Piso Wais site; only a brand-level mention in About | https://bmfceo.vip |
| Facebook Content Monetization available in PH (invite/interest form) | Verified (Meta help, search index) | https://en-gb.facebook.com/business/help/267128784014981 |
| TikTok Creator Rewards Program not available in PH (Oct 2026) | Secondary | https://www.tiktok.com/creator-academy/en/article/creator-rewards-program ; https://www.lilachbullock.com/tiktok-creator-rewards-philippines/ |
| Selling/referring insurance online needs an Insurance Commission license | Verified (IC legal opinion, search index) | https://www.insurance.gov.ph/wp-content/uploads/2023/05/IC-LO-No.-2023-14_Request-for-Legal-Opinion-on-Electronic-Sale-of-Insurance-Products-by-Intermediaries.pdf |
| Influencers/endorsers can be liable for promoting unregistered investments (SRC, RA 11765) | Secondary (news citing SEC advisories) | https://business.inquirer.net/597946/sec-flags-illegal-investment-taking-by-eagles-one ; https://www.sec.gov.ph/investors-education-and-information/advisories/ |
