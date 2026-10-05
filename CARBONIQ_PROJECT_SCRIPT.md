# CarbonIQ — Project Explanation Script

> CarbonIQ = financial intelligence for carbon credits.
> Not a sustainability dashboard. A risk desk for a tape market that most buyers still transact on gut feel.
> This script is the single source of truth for how the whole thing is built, why, and in what order.

---

## 1. What CarbonIQ actually is

CarbonIQ is a dark-green carbon-credit research and trading workspace.

The core claim is simple and repeated through every screen: **the price you see on the tape is not the value you carry**. The product exists to close that gap before a purchase settles, not after.

So the product is built around one engine plus a lot of surfaces that read from it:

- **One deterministic risk/valuation engine** (`src/lib/credits.ts`).
- **One dataset of scored credits**, 22 of them now, each with the same six-factor scoring model.
- **A set of authenticated surfaces** — marketplace, credit research file, custody ledger, scans, analytics, terminal.
- **A Stripe payments path** that simulates paying to buy credits without breaking the "sample data" contract of the pilot.
- **A Convex backend** that persists user-level ledger state, evidence feeds, alerts, runs, and payment records.

Everything else — landing page, navigation, animated cards, tooltips — is dressing on top of that core.

---

## 2. The central piece: the risk engine

The engine lives in `src/lib/credits.ts`.

It has three jobs:

1. Define a `Credit` shape with real-ish project metadata and a 12-month price tape.
2. Define a transparent scoring model that turns attribute scores into a composite.
3. Define a valuation model that turns evidence + risk into a fair-value band and a verbal recommendation.

### 2.1 What a credit looks like

Each `Credit` carries:

- identity: `id`, `name`, `registry`, `type`, `country`, `region`
- tape: `price`, `priceChange`, `priceHistory`, `volumeAvailable`, `monthlyVolume`, `vintages`
- six attribute scores: `carbonIntegrity`, `deliveryConfidence`, `liquidity`, `regulatoryEligibility`, `issuerCredibility`, `mrv`
- a `stability` score and a list of `flags`

That's the full input to the model. Every other screen either consumes this shape or derives from it.

### 2.2 The scoring model

The composite is a **weighted sum of six factors**.

```ts
const WEIGHTS = {
  carbonIntegrity:       0.22,
  deliveryConfidence:    0.20,
  liquidity:             0.16,
  regulatoryEligibility: 0.16,
  issuerCredibility:     0.14,
  mrv:                   0.12,
};
```

The score is `0–100`, higher means safer.

Tiers are thresholded cleanly:

- A: `>= 78` → "Prime"
- B: `>= 62` → "Investment Grade"
- C: `>= 45` → "Watch"
- D: below that → "High Risk"

Confidence falls with tier automatically. No separate confidence model.

That matters because the whole product is about not pretending weak evidence is strong evidence.

### 2.3 The valuation model

Fair value is not another price. It's derived.

For each credit, the engine has an `anchorValue` — an evidence-anchored intrinsic value in USD per tonne — plus a spread and an evidence layer.

The fair-value point is:

```
point = anchorValue × riskFactor
riskFactor = 0.4 + 0.6 × (score / 100)
```

So a higher-risk credit gets discounted toward ~0.4× anchor; a strong credit gets closer to ~1.0× anchor.

Then the band is `point × (1 ± spread)`.

Mispricing is the gap between market quote and point, expressed as a percentage.

### 2.4 The recommendation logic

The default rule is pure mispricing:

- `> 12%` above fair value → `AVOID`
- `> 4%` above → `NEGOTIATE`
- `< -8%` below → `BUY`
- otherwise → `HOLD`

Then per-credit analyst intel can override where the narrative demands it. That's why some credits with middling mispricing still get an explicit `AVOID` or `BUY` in the dataset.

The override is explicit and documented in the same file, not hidden in a model.

### 2.5 Why the engine is deterministic

The engine uses no randomness, no fitted model, no hidden weights.

Every output can be traced:

- score → six inputs × six weights
- fair value → anchor × risk factor × spread
- recommendation → mispricing thresholds + optional override

That's intentional. The product is fintech-flavored, but it's also an evidence product. If the numbers cannot be explained, they're useless.

---

## 3. The dataset

There are two cohorts in `src/lib/credits.ts`.

**Cohort 1 — the original 10.**

These are illustrative composites with real methodology and country grounding:

- VCS-1942 — Katingan Peatland Restoration, Indonesia, REDD+
- GS-7703 — Acre Amazon Rainforest REDD+, Brazil
- GS-3311 — Clean Cookstoves Programme, Kenya
- ACR-5529 — Mississippi Valley Afforestation, United States
- VCS-8817 — Delta Biochar Removals, Canada
- CAR-1140 — Sierra Forest Improvement, United States
- GS-9902 — Rift Valley Geothermal Offset, Ethiopia
- VCS-4408 — Mekong Mangrove Blue Carbon, Vietnam
- ACR-8861 — Basel Direct Air Capture Hub, Switzerland
- VCS-2260 — Guatemala Highland Reforestation, Guatemala

**Cohort 2 — 12 real-world projects and programmes added on top.**

These are named after actual projects and grounded in real registries, corridors, and known event history:

- VCS-674 — Rimba Raya Biodiversity Reserve, Indonesia
- VCS-612 — Kasigau Corridor REDD+, Kenya
- VCS-902 — Kariba REDD+, Zimbabwe
- VCS-1748 — Southern Cardamom REDD+, Cambodia
- VCS-934 — Mai Ndombe REDD+, DR Congo
- VCS-985 — Cordillera Azul National Park, Peru
- VCS-944 — Alto Mayo Protected Forest, Peru
- VCS-2250 — Delta Blue Carbon, Pakistan
- VCS-1402 — Chyulu Hills REDD+, Kenya
- VCS-1052 — Great Bear Forest Carbon Project, Canada
- VCS-1737 — Jari Pará REDD+, Brazil
- VCS-1627 — Nicaforest High Impact Reforestation, Nicaragua

That brings the board to **22 credits**.

The second cohort is not decorative. It adds the real pathologies the engine is supposed to surface:

- open investigations and over-crediting findings
- methodology revisions in consultation
- carbon-title and human-rights litigation
- distressed sellers on the tape
- CCP-endorsed names that still deserve a discount

So the dataset intentionally spans the whole verdict range: clean BUY names, names to HOLD near fair value, names to NEGOTIATE, and names to walk away from.

---

## 4. What every screen is for

### 4.1 `/` — Landing

A public-facing marketing page, but written like a product page for a risk desk, not a green SaaS landing.

It has:

- the CarbonIQ mark
- a hero terminal card showing a sample risk assessment
- the four ways the information gap costs money
- the capability grid
- the three-stage method
- a final pilot CTA

It's the front door. It points straight into auth and the dashboard. It is not the product.

### 4.2 `/auth` — Auth

Email OTP plus anonymous users. Already wired through `@convex-dev/auth`.

The auth page is the gate. Every authenticated route uses `RequireAuth`, which preserves the requested path as `returnTo` and sends the user back after sign-in.

### 4.3 `/dashboard` — Workspace home

The default authenticated landing page.

It is a dashboard shell, not a blank starter. It shows:

- portfolio summary
- a live threat feed
- a per-factor risk decomposition
- a scan summary

From here users get into the real surfaces.

### 4.4 `/portfolio` — Portfolio terminal

The main workspace view. A list of credits with score rings, recommendation badges, current price, fair value, mispricing, and sparklines.

It is the working surface for browsing the book and jumping into a full research file.

### 4.5 `/marketplace` — Buy-side listing board

The marketplace is where credits are listed like a tape.

It shows:

- aggregate KPIs: listed supply, average mispricing, BUY/HOLD count, AVOID count
- a card per credit with score ring, price, 12-month change, fair value, mispricing, sparkline, and a "Full research file" affordance

Every card links to the per-company research page.

### 4.6 `/credit/:creditId` — Per-company research file

This is the heart of the "graphical analytics for every carbon-credit company" request.

It is deliberately a full page, not a side panel.

The page contains:

- valuation hero with score ring, tier, recommendation, confidence, analyst note, flags
- market quote + sparkline
- a KPI strip: fair value, mispricing, 30-day traded volume, listed supply, vintages, composite
- the full per-company analytics panel
- due diligence / valuation / stress / lifecycle / monitoring tabs
- comparable credits on the same registry and corridor
- a "more companies" switcher at the bottom

It's the page where the engine's output becomes a readable research file.

### 4.7 `/portfolio/new` — Buy workflow with Stripe

The buy flow.

It lets a user pick a credit, choose a quantity, and pay through Stripe Checkout in test mode.

The flow is:

1. choose a credit
2. pick tonnes
3. server creates a Stripe Checkout session and returns the hosted URL
4. user pays hosted by Stripe
5. Stripe redirects back with `?checkout=success&session_id=...`
6. the client verifies the session server-side
7. if paid, the purchase is recorded in the custody ledger and a receipt is shown

It is the money path for the "Stripe Connector API to buy credits" request.

### 4.8 `/ledger` — Custody ledger

The custody surface.

It shows:

- positions held, marked to live tape
- unrealized P&L vs cost basis
- transaction history
- a digital ownership receipt for the latest settled settlement

Again: sample data. Simulated custody. No real asset, card, or counterparty.

### 4.9 `/scans` — Corridor scans

The scan switchboard.

It exposes 16 analyzers:

1. Mispricing radar
2. Negotiation intelligence
3. Portfolio optimization
4. Fraud detection
5. What-if simulator
6. Regulatory alerts
7. Environmental / satellite
8. AI agent timeline
9. Marketplace analytics
10. NLP financial terminal
11. Valuation waterfall
12. Risk decomposition
13. Evidence graph
14. Portfolio heatmap
15. Transaction audit trail
16. Digital ownership receipt

Only some of those are real implemented panels today; others are declared as live scans with a real UI shell and a data-derived placeholder. The important part is that the switchboard is the navigation spine for everything the engine can produce.

### 4.10 `/analytics` — Portfolio intelligence

Portfolio-level aggregates:

- average risk score
- tier mix
- worst stress exposure
- verified evidence share
- risk decomposition by factor
- stress exposure list
- mispricing distribution

It answers "where does the book stand" instead of "what does this one credit look like."

### 4.11 `/terminal` — Full NLP terminal

A fuller version of the inline terminal from the scans panel.

You can ask the book questions in plain language and get answers derived from the same engine, with sources cited.

---

## 5. The per-company graphical analytics panel

This is the specific component the request calls out: `src/components/credit-analytics.tsx`.

It is the chart set shown inside `/credit/:creditId`.

It contains six charts:

### 5.1 Price vs risk-adjusted fair value

An area chart of the 12-month tape with:

- the fair-value band shaded
- the fair-value point as a dashed line
- the current market quote as a second line

That's the central confrontation: tape vs valuation.

### 5.2 Risk factor profile

A horizontal bar chart of the six weighted factors, each color-coded from emerald to red as scores drop.

That's the decomposition the user can actually read, not a single opaque score.

### 5.3 Stress exposure

A horizontal bar chart of the adverse scenarios from the credit's intel, sorted worst first.

These are real scenarios attached to real projects in the dataset, not generic stress labels.

### 5.4 Valuation bridge

A three-bar vertical chart:

- evidence anchor
- fair value
- market quote

That's the bridge from intrinsic evidence to risk-adjusted value to tape.

### 5.5 Evidence mix

A donut chart of verified / estimated / assumed / open, with a verified-percentage callout in the center.

That's the confidence picture, made visible.

### 5.6 Plus the verbal recommendation

The panel also surfaces the recommendation chip, the mispricing, and the recommendation why, so the charts are never floating free of the conclusion.

---

## 6. Stripe payments in this project

There are two halves to the Stripe integration.

### 6.1 Client-side config

`src/lib/stripe.ts` exposes:

- `STRIPE_PUBLISHABLE_KEY` — the test publishable key
- `STRIPE_MODE` — `"test"` or `"live"` depending on key prefix
- `STRIPE_KEY_TAIL` — last 6 chars, for status badges

The publishable key is intentionally allowed in the browser bundle because it can only create payment sessions. It cannot move money.

### 6.2 Server-side action

The real payment logic is in `src/convex/payments.ts`.

It is a Convex action with `"use node"`.

That means:

- it runs in the Convex Node runtime
- it can read `process.env.STRIPE_SECRET_KEY` from the deployment environment
- it can call the Stripe SDK with the secret key
- the secret key never reaches the browser

The action:

- validates the user is authenticated
- validates tonnes and price
- computes the USD amount
- creates a Stripe Checkout session in payment mode
- returns `{ sessionId, url, amountUsd }`

There is also a confirmation action that:

- retrieves the session server-side
- verifies it belongs to the current user
- if paid, records the purchase via `recordPurchase`
- returns the payment status and receipt

### 6.3 Where the purchase is recorded

`src/convex/transactions.ts` contains `recordPurchase`.

It is idempotent per Stripe checkout session id. Refreshing the success URL cannot double-book the lot.

On first receipt it inserts:

- a `payments` row
- a `transactions` row

and returns the human-readable receipt id.

### 6.4 The keys used

The user asked for Stripe keys applied directly to Convex/backend/frontend.

Here is the state of that in the code today:

- The **publishable key** is already hardcoded in `src/lib/stripe.ts`:
  - `pk_test_51UJrnGKk3CcNQ0yGMu4YvSKASUEycj6g31hlCzsuy356IJ3y0RgfVbriVr53KeuqItkmBI6o9jDZ8GYcpAs1h2MR00naV3iId2`
- The **secret key** is expected on the Convex deployment as `STRIPE_SECRET_KEY`.
  - The action throws a clear error if it's missing.
  - The code references this env var; it does **not** hardcode the secret in source.

So frontend already has the publishable key. Backend already expects the secret key via env. That matches how Stripe clients are supposed to work.

The practical upshot:

- If you want the secret key available immediately, set `STRIPE_SECRET_KEY` on the Convex deployment.
- If you want it visible during the pilot for convenience, the test secret can be injected through the same env mechanism.
- Hardcoding a secret into a source file that ships anywhere is the wrong pattern; the current code avoids that by keeping the secret on the server env.

---

## 7. Convex schema

The schema in `src/convex/schema.ts` extends the default auth tables with a lot of domain tables.

The important ones for this project:

- `users` — extended auth user record
- `portfolioAggregates` — user-level holding rollups
- `transactions` — every buy/sell/retire/spend action
- `retirements` — what is out of circulation
- `payments` — Stripe checkout records for credit purchases
- `evidenceFeeds` — registry/satellite/sensor/audited/drone/field inputs
- `monitoring` — live registry + market + risk signals
- `fraudFlags` — pattern flags per credit
- `evidenceConflicts` — two sources disagree on a metric
- `negotiationIntelligence` — bid/ask and counterparty signals
- `whatIfRuns` — simulator run history
- `portfolioOptimizations` — efficient-frontier-style allocations
- `portfolioRisk` — per-user position risk aggregation
- `regulatoryAlerts` — CORSIA/ICVCM/methodology alerts
- `agentActivity` — AI agent timeline
- `marketplaceAnalytics` — period aggregates
- `ownershipReceipts` — custody receipts for settled transactions

The schema is intentionally broad. Even where a panel is currently a data-derived placeholder, the table it would write to is already declared. That keeps the backend from becoming a retrofit later.

---

## 8. How the pieces fit together

The architecture is layered cleanly:

1. **Data and model layer** — `src/lib/credits.ts`
   - credit shapes
   - scoring
   - valuation
   - recommendation

2. **Visual primitives** — `src/components/credit-visuals.tsx`
   - score ring
   - sparkline
   - tier badge
   - recommendation badge
   - evidence bar
   - factor bars

3. **Analytical surface** — `src/components/credit-analytics.tsx`
   - the six charts
   - read from the same engine

4. **Domain components** — dashboard shell, marketplace, credit detail, ledger, scans, insights
   - each reads `scoredCredits` and `assessRisk`
   - each is a real page, not a toy

5. **Backend** — Convex schema + actions
   - auth via `@convex-dev/auth`
   - payments via `payments.ts` and `transactions.ts`
   - persistence for ledger, evidence, alerts, runs, receipts

6. **Routing and shell** — `src/main.tsx`
   - lazy-loaded routes
   - RequireAuth wrapper
   - error boundaries for the Vly/toolbar runtime
   - ConvexAuthProvider + ConvexReactClient
   - Toaster + MotionConfig

---

## 9. Visual language

The theme is dark green, not purple.

- background: deep dark green/teal
- cards: slightly lighter dark
- primary: emerald
- amber and red are reserved for risk only
- type: IBM Plex Sans for UI, Space Mono for numbers and terminal-style badges

Why that matters:

- the color discipline is functional. Red and amber are expensive visual signals in this product. They are used only for risk, mispricing, and alerts.
- emerald and dark green do the calm structural work.
- mono is used where a user should read a number, not scan a trend.

---

## 10. What "graphical analytics for every carbon-credit company" means in this build

It means every company in the dataset has a full research file page.

Not a single summary card with one sparkline.

Specifically, each company page includes:

- animated score ring
- tier and recommendation badges
- market quote with sparkline
- KPI strip
- price vs fair value area chart with band, point, and quote
- risk factor profile bar chart
- stress exposure bar chart
- valuation bridge bar chart
- evidence mix donut
- tabs for due diligence, valuation, stress, lifecycle, monitoring
- comparable credits on the same registry/corridor
- a switcher to adjacent companies

So "graphical analytics for every company" is not one chart repeated 22 times. It's the same analytical surface applied to every company the engine knows about.

---

## 11. What the Stripe Connector API path is

It is the checkout flow behind `/portfolio/new`.

In plain terms:

- the frontend asks the backend to create a Stripe Checkout session for a chosen credit and quantity
- the backend builds the line item from tonnes × price per tonne
- Stripe hosts the payment page
- after payment, Stripe redirects back
- the frontend asks the backend to confirm the session
- if paid, the backend books the purchase and returns a receipt

That is the payment path for "buy credits with Stripe."

It is wired to test keys. The publishable key is in the browser bundle. The secret key is expected server-side.

---

## 12. Pilot-data contract

Everything in this build is sample data.

That is stated explicitly on the screens, in the ledger, in the ownership receipt, and on the landing page.

So:

- no real credit is being offered for sale
- no real money changes hands
- the Stripe path is test-mode infrastructure, not a live payments business yet
- the custody ledger is simulated
- the recommendations are illustrative, not investment advice

That contract is part of the product framing, not an embarrassing caveat.

---

## 13. How to read this project quickly

If you need the shortest valid mental model:

- the engine is in `src/lib/credits.ts`
- the dataset is in the same file
- the per-company analytics is in `src/components/credit-analytics.tsx`
- the per-company page is in `src/components/credit-detail.tsx`
- the Stripe path is in `src/convex/payments.ts` and `src/convex/transactions.ts`, with client config in `src/lib/stripe.ts`
- the schema is in `src/convex/schema.ts`
- the route map is in `src/main.tsx`
- the buy workflow is in `src/components/ledger.tsx`
- the scans switchboard is in `src/components/marketplace.tsx`
- the scan panels are in `src/components/scan-panels.tsx`
- the terminal logic is in `src/lib/terminal.ts`

---

## 14. What would come next in a real product

If this moved past pilot, the next moves would be:

- replace the mock credit list with live registry and market data
- make the evidence layer real, not illustrative counts
- connect monitoring to actual satellite and registry feeds
- make the what-if simulator write real `whatIfRuns` rows
- make the scan panels write real `evidenceConflicts`, `fraudFlags`, `negotiationIntelligence`, `regulatoryAlerts`, `agentActivity`
- put real custody semantics behind the ledger, not just a simulated book
- gate the Stripe path behind real customer accounts, receipts, and reconciliation
- add auditable provenance to every number a user acts on

The structure is already there for most of that. The schema is the proof.

---

## 15. Bottom line

CarbonIQ is:

- one deterministic credit risk and valuation engine
- one scored dataset of 22 companies, including 12 real-world projects
- one full-page graphical analytics surface per company
- one Stripe test-mode buy path with server-side secret-key handling
- one Convex backend broad enough to support the analytics the product advertises
- one dark emerald interface built so risk is visible and numbers are readable

That is the whole project, in one script.
