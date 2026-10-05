# CarbonIQ — explainingfeatures.md

A full walkthrough of what this website is, why it exists, and every feature it exposes.
Written as a speech you can read from start to finish: from "what is a carbon credit?"
to "here is every screen and what it does."

---

## Part 1 — Start here: what is a carbon credit?

A carbon credit is a certificate that says one tonne of carbon dioxide equivalent was
avoided, reduced, or removed from the atmosphere by a specific project.

That sounds simple. It is not.

A credit is not a tonne of coal or a barrel of oil. There is no physical barrel with
a label on it. A credit is an attestation: a project did something — protected a forest,
built a cookstove programme, run a direct air capture plant — and a registry issued a
serialised certificate saying "this tonne is real, this tonne is additional, this tonne
is not double-counted."

That attestation is what people buy.

Companies buy credits for a few reasons:

- to offset emissions they cannot yet eliminate
- to meet voluntary climate claims
- to satisfy emerging compliance regimes where eligible credits are allowed
- to support projects they believe in

So a carbon credit market exists. It is global. It is fragmented. It is mostly a tape
market, meaning people buy and sell from each other through brokers, exchanges, and
direct negotiations.

And that is where the trouble starts.

---

## Part 2 — the problem this website exists to solve

The price you see on the tape is not the value you carry.

That sentence is the whole product.

Say you are looking at a credit on the market. It has a price. It has a name. It has a
registry. It has a project type. It has a country. It may even have a nice story attached
to it.

What it does not come with, by default, is:

- a defensible valuation
- a risk adjustment
- an evidence breakdown
- a stress test
- a recommendation you can defend in a meeting

A seller gives you a quote. A broker may give you a range. A consultant may give you a
slide deck. Very few of those answers are derived from the same question: what is this
credit actually worth after risk?

That gap costs money in four ways.

First, overpaying. A quote is not a valuation. Without a risk-adjusted reference, weak
credits can trade at premiums they have not earned. You pay the premium on day one and
the loss is booked immediately.

Second, regulatory surprises. Methodology revisions, eligibility rules, and policy shifts
can make a credit less usable overnight. Most buyers learn about the change after the
purchase settles.

Third, liquidity. Some credits have a thin float and slow turnover. That means the exit
you assumed when you bought may not exist at the price you underwrote. Illiquidity is a
risk you pay for but rarely see on the invoice.

Fourth, reputation. When a credit's claims are later challenged, the damage compounds.
There are write-downs, restated climate commitments, and the public scrutiny that follows
both.

So CarbonIQ exists as the financial intelligence layer that sits between the tape and the
purchase decision.

It is not another sustainability dashboard. It does not ask you to admire the planet.
It asks you to price risk before you commit capital.

---

## Part 3 — what CarbonIQ is

CarbonIQ is a dark green workspace for researching, assessing, and buying carbon credits
with evidence instead of instinct.

The product is built around one idea: every credit should have a transparent,
explainable, risk-adjusted fair value, and every conclusion should be traceable back to
the data behind it.

That is a stronger statement than "we show you a score."

A score is a number. A fair value is a number with a bridge. A recommendation is a
verdict with a reason. CarbonIQ tries to give you all three, from the same engine, with
the same evidence trail.

What that means in plain English:

- you can open any credit company on the site
- you can see the market price
- you can see what the engine thinks it is worth
- you can see why
- you can see the evidence behind the why
- you can see the downside scenarios
- you can see comparable companies nearby
- and if you decide to act, the site has a Stripe payment path to simulate buying

Everything is built on a single risk and valuation engine plus one dataset of scored
credit companies.

---

## Part 4 — how the engine thinks

The engine's job is to turn credit attributes into two things:

1. a composite risk score
2. a risk-adjusted fair value

It does both in a way you can follow line by line.

### The score

The score is a weighted sum of six factors:

- carbon integrity
- delivery confidence
- liquidity
- regulatory eligibility
- issuer credibility
- MRV quality

MRV means monitoring, reporting, and verification. It is the backbone of whether a credit
is believable in the first place.

Each factor is scored from 0 to 100. Each one has a fixed weight. The weights are:

- carbon integrity — the largest weight
- delivery confidence — next
- liquidity
- regulatory eligibility
- issuer credibility
- MRV quality

The exact weights are visible in the code. They are not hidden. They are not fitted to a
conclusion. They are the engine's stated view of what matters most when you are judging
whether a credit is worth owning.

The composite comes out as a number from 0 to 100, where higher means safer.

That number maps to a tier:

- the strongest credits are Prime
- the next band is Investment Grade
- then Watch
- then High Risk

Confidence falls automatically as the tier drops. The engine does not invent a separate
confidence model. It lets the tier do the work.

### The fair value

Fair value is the more important output, because it is the number a buyer actually compares
against the tape.

The engine does not say "this credit is worth the current market price." It says "this
credit is worth this much per tonne, after risk, with this much error around it."

Here is the shape of the thinking:

- each credit has an evidence-anchored value, which is the intrinsic worth before risk
- that anchor is discounted by the composite risk score
- the discount is not a haircut invented by a person; it is the risk factor in the model
- around the point estimate sits a band, which is the estimation error
- the market quote is then compared to the point estimate
- the gap between them is mispricing

Mispricing is what the engine talks about most, because mispricing is where money is left
on the table.

If the market quote is above fair value, the credit is overpriced relative to what the
evidence supports.

If the market quote is below fair value, the credit looks cheap relative to risk-adjusted
worth.

The recommendation then follows from that gap.

---

## Part 5 — the recommendation language

CarbonIQ does not use a thousand subtle shades of opinion. It speaks in four calls:

- BUY
- HOLD
- NEGOTIATE
- AVOID

Those are not feelings. They are derived.

The default rule is based on mispricing:

- if the quote is far above fair value, the call is AVOID
- if it is somewhat above, the call is NEGOTIATE
- if it is below fair value by enough, the call is BUY
- otherwise, HOLD

Then some credits get an explicit override where the analyst story demands it. That is
not a secret model. It is a documented exception attached to that credit, with a written
reason.

So every recommendation has a reason attached. You do not just see "AVOID." You see
"AVOID because..." and the reasons are concrete: an open investigation, a methodology
revision, a thin float, a litigation risk, an overpriced quote, a delivery concern.

That matters because a recommendation with no explanation is just an opinion. A
recommendation with a reason is something you can take into a meeting.

---

## Part 6 — the dataset

CarbonIQ is not built on a single example. It is built on a board of credit companies.

There are two cohorts.

The first cohort is the original ten. These are grounded in real project types, real
registries, real countries, and real methodologies. They include peatland restoration,
Amazon REDD+, cookstoves, afforestation, biochar, improved forest management, geothermal
offsets, mangrove blue carbon, direct air capture, and highland reforestation.

The registries in the dataset are the ones that actually matter in this market:

- Verra
- Gold Standard
- ACR
- CAR

The project types include:

- REDD+
- afforestation and reforestation
- cookstoves
- biochar
- improved forest management
- direct air capture
- wind

The regions include Latin America, Africa, Southeast Asia, North America, and Europe.

That first cohort already gives you a credible cross-section of the market.

The second cohort adds twelve more real-world projects and programmes. These are named after
real projects and grounded in real registries, real corridors, and real event history.

They include things like:

- a major Indonesian biodiversity reserve
- a Kenyan wildlife corridor REDD+ project
- a Zimbabwean REDD+ programme with an open investigation history
- a Cambodian REDD+ project under safeguards review
- a DR Congo REDD+ project with legacy vintage issues
- a large Peruvian national park buffer
- a Peruvian forest protected with coffee cooperative agreements
- a massive mangrove restoration in Pakistan
- a Kenyan community-led REDD+ project with Maasai landowner agreements
- a First Nations-led forest carbon project in British Columbia
- a Brazilian Pará REDD+ project with carbon-rights litigation
- a Nicaraguan smallholder teak reforestation project

The point of adding those twelve is not to pad the list. It is to make sure the dataset
contains the real pathologies the engine is supposed to surface.

You need credits that are clean. You need credits that are cheap but troubled. You need
credits with open investigations. You need credits with methodology revisions pending.
You need credits with litigation. You need credits with distressed sellers. You need
credits with strong endorsements that still deserve a discount.

If your dataset only contains clean names, your engine looks better than it is.

---

## Part 7 — how the website opens

The first public page is the landing page.

It does not open with a generic hero and a subscribe form. It opens like the front page of
a risk desk.

At the top, there is the CarbonIQ mark and a status line that says registry feeds are live.

Below that, the headline makes the whole value proposition in one sentence: the price you
see is not the risk you carry.

Beside the headline, there is a hero terminal card. That card is a sample risk assessment.
It shows:

- the asset line
- market price versus risk-adjusted price
- the mispricing
- the composite risk score
- a few risk marker rows

It is a worked example, not a decoration. It is the product teaching you what it does
before you even sign in.

Under the hero, there is a live counter of tonnes scored, a registry ticker scrolling
sample credit names with their prices and fair values, and a section explaining the four
ways the information gap costs money.

After that comes the platform capabilities section, then the method section, then the final
pilot call to action.

The landing page has one job: get a visitor who cares about carbon credit quality into the
authenticated workspace with enough context to know why they should care.

---

## Part 8 — sign in and the gate

To use the workspace, you sign in through the auth page.

The site uses email OTP authentication with anonymous user support. The auth system is
already wired through the Convex auth layer.

The important thing is not the auth flavour. The important thing is the gate.

Every authenticated route is protected by a require-authentication wrapper. If you try to
open a protected page while signed out, you are sent to the auth page with your intended
destination saved. When you sign in, you are sent back to the page you wanted.

That means the product does not feel like a wall. It feels like a door that remembers where
you were going.

The default authenticated landing is the dashboard.

---

## Part 9 — the dashboard

The dashboard is the first thing you see after sign-in.

It is not a blank starter screen. It is a workspace home.

It shows:

- a small portfolio summary
- a live threat feed
- a risk decomposition by factor
- a scan summary section

It is intentionally compact. Its job is to orient you and get you into the real surfaces:
the portfolio, the marketplace, the scans, the analytics, the ledger, and the terminal.

From here, everything else is one click away.

---

## Part 10 — the portfolio terminal

The portfolio terminal is the main workspace view.

It is a list of credits with enough information to work from:

- a score ring for each credit
- a recommendation badge
- the current price
- the fair value
- the mispricing
- a price sparkline
- the registry and identity of each credit

It is the working surface for browsing the book. If you want to go deeper on any company,
you open its full research file from here.

---

## Part 11 — the marketplace

The marketplace is the buy-side listing board.

It presents credits as a tape. You see them as a buyer would see a market.

At the top, there are aggregate KPIs:

- listed supply across all companies
- average mispricing
- the count of BUY and HOLD calls
- the count of AVOID flags

Below that, there is a card for every credit.

Each card shows:

- the credit name
- its identity line
- a score ring
- a recommendation badge
- the current price
- the twelve-month change
- the fair value
- the mispricing
- a price sparkline
- the project type and country
- a link into the full research file

The cards are colored by recommendation so you can scan the board and see where the
engineer agrees with the tape and where it does not.

Every card links to the per-company research page.

---

## Part 12 — the per-company research file

This is the center of the whole product.

When you open a credit company, you do not get a small card. You get a full research file.

That page is deliberately a full page, not a side panel or a popover.

Here is what it contains.

At the top, there is a valuation hero:

- an animated score ring
- the tier badge
- the recommendation badge
- a confidence badge
- the credit identity
- the analyst's written reason for the recommendation
- the flags attached to the credit
- the market quote with a sparkline
- a button to trade the credit

Below the hero, there is a KPI strip with the key numbers:

- fair value
- mispricing
- thirty-day traded volume
- listed supply
- number of vintages
- the composite score and tier

After that comes the main event: the full graphical analytics panel for that company.

Then come the detail tabs, which let you move through:

- due diligence
- valuation
- stress tests
- lifecycle
- monitoring

Next to those tabs, there is a risk factor card and a comparable credits panel.

At the bottom of the page, there is a "more companies" section so you can move to another
research file without going back to the marketplace.

So the research file is not one chart and a paragraph. It is a complete page for one
company.

---

## Part 13 — the graphical analytics panel

This is the specific feature the product is most proud of.

Every company on the site has a full graphical analytics panel, and every panel contains
the same set of charts.

The first chart is price versus risk-adjusted fair value.

It shows the twelve-month price tape as an area chart, with three things overlaid:

- the fair-value band, shaded
- the fair-value point estimate, as a dashed line
- the current market quote, as another line

That chart is the central confrontation of the whole product: the tape against the
valuation.

The second chart is the risk factor profile.

It shows the six weighted factors as a horizontal bar chart, color-coded from green to
amber to red as the scores drop.

That chart is what makes the composite readable. You do not have to trust a single number.
You can see which factors are strong and which are weak.

The third chart is stress exposure.

It shows the adverse scenarios attached to that credit, sorted worst first, as a horizontal
bar chart.

These are not generic labels. They are the actual scenarios the engine has on file for that
credit: methodology revisions, leakage events, demand shifts, buffer pool contributions,
buyer exits, audit findings, fire exposure, and so on.

The fourth chart is the valuation bridge.

It shows three bars:

- the evidence anchor
- the fair value
- the market quote

That bridge is the explanation in visual form. It shows how the engine gets from evidence
to risk-adjusted value to market comparison.

The fifth chart is the evidence mix.

It is a donut chart of four categories:

- verified
- estimated
- assumed
- open questions

The center of the donut shows the verified percentage.

That chart is the confidence picture. It tells you how much of the assessment rests on facts
versus estimates versus assumptions versus unresolved questions.

The sixth element is not a chart. It is the verbal recommendation, the mispricing, and the
recommendation reason, all displayed together so the charts are never floating free of the
conclusion.

So the analytics panel is the same analytical surface applied to every company on the board.

---

## Part 14 — the tabs inside the research file

The research file does not stop at the charts.

Inside the detail tabs, you can work through the credit in layers.

In the due diligence tab, you see:

- the recommendation reason
- four due diligence steps
- the evidence layer
- the sources behind the assessment

The due diligence steps walk through:

- registry reconciliation
- market tape read
- integrity evidence
- red flags

In the valuation tab, you see:

- market price
- fair value and its band
- mispricing and whether it is above or below fair value
- the twelve-month price history

In the stress tab, you see the stress scenarios again, each with its impact on fair value.

In the lifecycle tab, you see the lifecycle stages:

- due diligence
- purchase
- ledger entry
- monitoring

Each with a status and a note.

In the monitoring tab, you see the live activity feed concept: a periodic checker that pings
the ledger, runs checks, and flags drift.

So the research file is not just a static report. It is a workspace for one company.

---

## Part 15 — comparable credits

On the right side of the research file, there is a comparable credits panel.

It shows credits that match on:

- registry
- region
- corridor

Each comparable shows:

- the name
- the identity
- the price
- the twelve-month change
- the fair value
- the recommendation badge

That panel is the peer context. It answers "what else looks like this credit, and how does
this one compare?"

Comparables matter because no credit should be judged in isolation. A price only means
something when you know what similar credits are doing.

---

## Part 16 — the buy workflow

If you decide you want to act, the site has a buy workflow.

It lives on a dedicated page reachable from the portfolio and the marketplace.

The workflow lets you:

- pick a credit
- choose a quantity in tonnes
- pay through Stripe Checkout in test mode

Here is the flow.

First you choose a credit.

Then you pick how many tonnes you want.

Then the backend creates a Stripe Checkout session for that credit and quantity.

The backend computes the amount from tonnes times price per tonne.

Stripe hosts the payment page.

The buyer completes the payment on Stripe's page, not on CarbonIQ.

After payment, Stripe redirects back to the site with the session id.

The site then verifies the session server-side.

If the payment is confirmed, the purchase is recorded in the custody ledger and a receipt is
shown.

If the payment is not confirmed, the site tells you that no charge was captured.

That is the Stripe Connector API path. It is a real checkout flow, but it runs in test mode
so no real money moves.

---

## Part 17 — how the Stripe side is built

The Stripe integration has two halves.

The client side lives in the Stripe configuration file. It exposes the publishable key,
the mode, and a short key tail used for badges.

The publishable key is allowed in the browser bundle because it can only create payment
sessions. It cannot move money by itself.

The server side lives in the Convex payments file. It is a server action that runs in the
Convex environment and uses the secret key from the server environment.

That means the secret key never goes to the browser.

The server action:

- checks that the user is signed in
- validates the quantity and the price
- computes the USD amount
- creates a Stripe Checkout session
- returns the session id, the checkout URL, and the amount

There is also a confirmation action that:

- retrieves the session server-side
- checks that the session belongs to the current user
- if paid, records the purchase
- returns the payment status and the receipt

The purchase itself is recorded in the Convex transactions file.

That recording is idempotent per Stripe session id. Refreshing the success page cannot
double-book the same purchase.

On first receipt, the system inserts a payment record and a transaction record, then
returns a human-readable receipt id.

So the Stripe path is not a toy button. It is a real hosted checkout flow with server-side
verification and idempotent booking.

---

## Part 18 — the custody ledger

The ledger is the custody surface.

It shows:

- the positions held
- the tonnes held
- the market value marked to live tape
- the unrealized profit and loss versus cost basis
- the retired tonnes
- the transaction history
- a digital ownership receipt for the latest settled settlement

Each position shows:

- the credit name
- the recommendation badge
- the identity and registry
- the tonnes
- the cost basis
- the mark
- the market value
- the unrealized P and L
- a retire button or a retired badge

The transaction history is shown as an immutable chain of buys, sells, and retirements with
hashes, ids, tonnes, amounts, dates, and statuses.

The ownership receipt shows the latest settled settlement in your custody, with fields like:

- receipt id
- transaction hash
- credit
- amount
- total
- custody system

Again, everything in the pilot is sample data. The custody is simulated. There is no real
asset, card, or counterparty involved.

But the structure is real. The ledger has the shape of a real custody system, not a mockup.

---

## Part 19 — the scans

The scans page is a switchboard for every analyzer the engine can run.

It exposes sixteen scan kinds.

One is the mispricing radar. It ranks every credit by how far the tape sits from fair value.

One is negotiation intelligence. It turns each credit's findings into a defensible purchase
range: an open, a target, and a walk-away, with leverage bullets drawn from that credit's
own evidence gaps and stress file.

One is portfolio optimization. It looks at concentration, turnover, and rebalancing
suggestions for the current book.

One is fraud detection. It runs five integrity checks per credit: serialisation, duplicate
issuance, registry reconciliation, buffer pool, and additionality.

One is the what-if simulator. It re-runs the book under shocks you choose: a market selloff,
a CORSIA eligibility change, a liquidity drought, or a REDD+ methodology revision.

One is regulatory alerts. It maps policy events to the credits they actually move.

One is environmental and satellite watch. It tracks canopy, fire, and reversal signals for
land-use projects.

One is the AI agent timeline. It logs what each engine agent did on the watchlist.

One is marketplace analytics. It shows turnover, spread, and depth by registry and vintage.

One is the NLP financial terminal inline. You can ask the book a question and get an
evidence-backed answer.

One is the valuation waterfall. It walks through the bridge from evidence anchor to risk
discount to fair value to tape for the most mispriced name.

One is risk decomposition. It shows the six weighted factors at portfolio average, with the
strongest and weakest holder named for each.

One is the evidence graph. It traces which primary sources feed which credit's assessment.

One is the portfolio heatmap concept.

One is the transaction audit trail.

One is the digital ownership receipt.

Not every scan is a full implementation today. Some are real panels computed from the
dataset. Others are real UI shells with data-derived content.

But the switchboard itself is the spine. It says: here is everything the engine can
produce, and here is where each piece lives.

---

## Part 20 — the analytics page

The analytics page is the portfolio intelligence surface.

It answers the question: where does the book stand?

It shows:

- the average risk score
- the tier mix across all credits
- the worst stress exposure across the book
- the verified evidence share
- the risk decomposition by factor
- the stress exposure list
- the mispricing distribution

It is not about one credit. It is about the whole portfolio.

That matters because a single credit can look fine while the book is quietly concentrated in
one registry, one corridor, or one risk factor. The analytics page exists to catch that.

---

## Part 21 — the terminal

The terminal is the plain-language interface to the book.

You can ask it questions like:

- where should I buy
- what is overpriced
- what is the biggest downside
- how solid is the evidence
- what is fair value

The terminal replies using the same engine that prices the credits. Every answer comes with
sources cited.

It is not a chatbot pretending to know things. It is a query interface over the dataset,
with the same evidence trail as the rest of the product.

There is an inline version of the terminal in the scans panel, and a full version on the
terminal page.

---

## Part 22 — the visual language

The site uses a dark green theme, not a generic purple or pink gradient.

The background is deep dark green. The cards are slightly lighter. The primary color is
emerald.

Amber and red are reserved for risk and alerts only.

That color discipline is functional. In this product, red and amber are expensive visual
signals. They mean risk, mispricing, and alerts. They are not decoration.

The typography uses two families:

- a humanist sans for body and interface text
- a monospace for numbers and terminal-style badges

That split is deliberate. Sans is for reading. Mono is for comparing numbers.

The site also uses motion everywhere: fade-ins, slide-ins, animated score rings, animated
sparklines, animated bars, animated donuts, a radar sweep in the hero terminal, and a live
counter that ticks as you watch.

The motion is not noise. It is pacing. It makes the dashboards feel like instruments rather
than slides.

---

## Part 23 — the behind-the-scenes shape

Under the hood, the project is built as:

- a Vite and React frontend
- TypeScript throughout
- React Router for navigation
- Tailwind for styling
- shadcn/ui components for the interface primitives
- Framer Motion for animation
- Recharts for the charts
- Lucide icons for the icon set
- Sonner for toasts
- a Convex backend for data and server actions
- Convex auth for authentication

The backend schema is broad. It includes tables for:

- users
- portfolio aggregates
- transactions
- retirements
- payments
- evidence feeds
- monitoring
- fraud flags
- evidence conflicts
- negotiation intelligence
- what-if runs
- portfolio optimizations
- portfolio risk
- regulatory alerts
- agent activity
- marketplace analytics
- ownership receipts

That schema is the proof that the product is not just a pretty dashboard. The tables are
already there for the analytics the site advertises.

---

## Part 24 — what every major file contributes

If you want the shortest map of the codebase, here it is.

The engine and dataset live in the credits library file.

The visual primitives live in the credit visuals component: the score ring, the sparkline,
the tier badge, the recommendation badge, the evidence bar, and the factor bars.

The per-company analytics panel lives in its own component.

The per-company research page lives in the credit detail component.

The Stripe client configuration lives in the Stripe library file.

The Stripe server actions live in the Convex payments file.

The purchase recording lives in the Convex transactions file.

The schema lives in the Convex schema file.

The route map and app shell live in the main file.

The buy workflow lives in the ledger component.

The marketplace and scans switchboard live together in the marketplace component.

The scan panels live in their own component.

The analytics and terminal screens live together in the insights component.

The terminal logic lives in the terminal library file.

The landing page lives in its own page file.

---

## Part 25 — what the product is not

CarbonIQ is not:

- a sustainability dashboard for admiring projects
- a carbon marketplace where real credits are listed for sale today
- a live trading exchange
- an investment adviser
- a replacement for doing your own diligence

It is:

- a risk and valuation layer for carbon credits
- a research surface for one company or a whole book
- a Stripe test-mode buy path for the pilot
- a Convex-backed workspace with a broad schema ready for the analytics it advertises

Everything in the build is sample data. That is stated on the screens, in the ledger, in
the ownership receipt, and on the landing page.

That is not a weakness. It is the honest framing for a pilot.

---

## Part 26 — the whole story in one arc

If you want the whole website explained as a single story, here it is.

A carbon credit is an attestation, not a physical thing. That makes it hard to price.

The tape gives you a price. It does not give you a valuation.

People buy on quotes, broker language, and instinct. That gap costs money through
overpaying, regulatory surprises, illiquidity, and reputation damage.

CarbonIQ exists to close that gap before the purchase settles.

It has one engine that turns credit attributes into a composite risk score and a
risk-adjusted fair value.

It has one dataset of twenty-two credit companies, including twelve real-world projects,
spanning the full range of verdicts from clean BUY names to AVOID names.

It has a landing page that teaches the story before asking you to sign in.

It has an auth gate that remembers where you were going.

It has a dashboard that orients you.

It has a portfolio terminal for browsing the book.

It has a marketplace that lists credits like a tape.

It has a full research file page for every company, with a valuation hero, KPI strip,
six-chart analytics panel, due diligence and valuation and stress and lifecycle and
monitoring tabs, comparable credits, and a switcher to adjacent companies.

It has a Stripe checkout flow for buying credits in test mode, with server-side secret-key
handling, session verification, and idempotent purchase recording.

It has a custody ledger with positions, market marks, P and L, transaction history, and a
digital ownership receipt.

It has a scans switchboard with sixteen analyzers.

It has an analytics page for the whole book.

It has a terminal that answers plain-language questions with sources.

It has a dark emerald interface where amber and red mean risk, and numbers live in mono.

And it has a backend schema broad enough that most of the analytics the product advertises
are already declared, not retrofitted.

That is the whole website. That is what this file is for: to explain it in one place, from
carbon credit one-zero-one to every feature on the site.
