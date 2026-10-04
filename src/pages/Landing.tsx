import { motion } from "framer-motion";
import { Link } from "react-router";
import {
  ArrowRight,
  BarChart3,
  CircleDot,
  FileSearch,
  Landmark,
  Leaf,
  Radar,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScoreRing, Sparkline, TierBadge } from "@/components/credit-visuals";
import {
  assessRisk,
  CREDITS,
  fmtMoney,
  fmtPct,
  fmtTonnes,
  RISK_WEIGHTS_SUMMARY,
  scoredCredits,
  type Credit,
} from "@/lib/credits";
import { cn } from "@/lib/utils";

/* ---------- brand mark (inline SVG, no dependency) ---------- */
function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} fill="none" aria-hidden>
      <circle cx="20" cy="20" r="17" stroke="currentColor" strokeOpacity="0.35" strokeWidth="2" />
      <path
        d="M20 5 a15 15 0 0 1 13 7.5"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path d="M13 24c2.5-6 5-9 7-9s4.5 3 7 9" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M15.5 24h9" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="33" cy="12.5" r="2.4" fill="currentColor" />
    </svg>
  );
}

/* ---------- ticker ---------- */
function TickerItem({ c }: { c: Credit }) {
  const up = c.priceChange >= 0;
  const risk = assessRisk(c);
  return (
    <span className="mx-5 inline-flex items-center gap-2 text-xs">
      <span className="num text-muted-foreground">{c.id}</span>
      <span className="font-medium">{c.name}</span>
      <span className="num">{fmtMoney(c.price)}</span>
      <span className={cn("num inline-flex items-center gap-0.5", up ? "text-emerald-400" : "text-red-400")}>
        {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
        {fmtPct(c.priceChange)}
      </span>
      <span
        className={cn(
          "num rounded px-1.5 py-px text-[10px] font-semibold",
          risk.tier === "A" && "bg-emerald-400/15 text-emerald-300",
          risk.tier === "B" && "bg-lime-400/10 text-lime-300",
          risk.tier === "C" && "bg-amber-400/10 text-amber-300",
          risk.tier === "D" && "bg-red-500/10 text-red-400",
        )}
      >
        {risk.score} {risk.tier}
      </span>
    </span>
  );
}

function Ticker() {
  const items = [...CREDITS, ...CREDITS];
  return (
    <div className="relative w-full overflow-hidden border-y border-border/70 bg-card/40 py-2.5 backdrop-blur-sm">
      <div className="marquee-track flex w-max whitespace-nowrap">
        {items.map((c, i) => (
          <TickerItem key={`${c.id}-${i}`} c={c} />
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent" />
    </div>
  );
}

/* ---------- hero sample card ---------- */
function HeroCreditCard() {
  const credit = CREDITS[3]; // Mississippi Valley Afforestation
  const risk = assessRisk(credit);
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, rotate: 1.5 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="glass relative mx-auto w-full max-w-md rounded-2xl p-5 shadow-[0_20px_60px_-20px_oklch(0.8_0.2_155/0.25)]"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
      {/* scanning sweep */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
        <div className="scan-sweep absolute inset-x-6 h-16 bg-gradient-to-b from-transparent via-primary/8 to-transparent" />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Risk snapshot · live sample
        </span>
        <span className="animate-pulse-dot size-1.5 rounded-full bg-primary" />
      </div>

      <div className="mt-4 flex items-center gap-4">
        <ScoreRing score={risk.score} tier={risk.tier} size={84} strokeWidth={6} />
        <div className="min-w-0">
          <div className="num text-[11px] text-muted-foreground">{credit.id} · {credit.registry}</div>
          <div className="mt-0.5 truncate font-display text-lg font-bold tracking-tight">
            {credit.name}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <TierBadge tier={risk.tier} />
            <span className="num rounded-md border border-border/70 px-2 py-0.5 text-xs font-semibold">
              {fmtMoney(credit.price)} / t
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {risk.breakdown.slice(0, 3).map((b) => (
          <div key={b.key} className="rounded-lg border border-border/60 bg-foreground/[0.02] p-2.5">
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground/70">{b.label}</div>
            <div className="num mt-1 text-sm font-semibold">{b.value}</div>
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-foreground/8">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${b.value}%` }}
                transition={{ duration: 0.9, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-end justify-between border-t border-border/60 pt-3">
        <div>
          <div className="text-[9px] uppercase tracking-wider text-muted-foreground/70">12-month price</div>
          <div className="num text-sm font-semibold">
            {fmtMoney(credit.price)}{" "}
            <span className="text-emerald-400">{fmtPct(credit.priceChange)}</span>
          </div>
        </div>
        <Sparkline data={credit.priceHistory} positive width={150} height={40} />
      </div>
    </motion.div>
  );
}

/* ---------- section helpers ---------- */
function SectionHeading({
  kicker,
  title,
  sub,
}: {
  kicker: string;
  title: React.ReactNode;
  sub?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto max-w-2xl text-center"
    >
      <span className="num text-[11px] font-medium uppercase tracking-[0.22em] text-primary">
        {kicker}
      </span>
      <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      {sub && <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">{sub}</p>}
    </motion.div>
  );
}

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
};

/* ---------- page ---------- */
export default function Landing() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="relative min-h-screen overflow-x-clip"
    >
      {/* ambient background */}
      <div className="pointer-events-none fixed inset-0 bg-grid opacity-50 [mask-image:radial-gradient(75%_60%_at_50%_0%,black,transparent)]" />
      <div className="pointer-events-none fixed -left-40 top-1/3 size-[420px] rounded-full bg-primary/6 blur-[120px]" />
      <div className="pointer-events-none fixed -right-40 top-2/3 size-[420px] rounded-full bg-chart-2/5 blur-[120px]" />

      <div className="relative">
        {/* ============ NAV ============ */}
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl"
        >
          <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
            <Link to="/" className="flex items-center gap-2.5">
              <LogoMark className="size-8 text-primary" />
              <span className="font-display text-lg font-bold tracking-tight">
                Carbon<span className="text-primary">Lens</span>
              </span>
            </Link>
            <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
              <a href="#problem" className="transition-colors hover:text-foreground">The gap</a>
              <a href="#scoring" className="transition-colors hover:text-foreground">Scoring</a>
              <a href="#terminal" className="transition-colors hover:text-foreground">Terminal</a>
            </nav>
            <Button asChild className="gap-2 rounded-lg">
              <Link to="/dashboard">
                Open terminal <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </motion.header>

        {/* ============ HERO ============ */}
        <section className="relative">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 pb-16 pt-16 sm:px-6 lg:grid-cols-2 lg:pb-24 lg:pt-24">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.1 }}
                className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-3 py-1 text-xs font-medium text-primary"
              >
                <Radar className="size-3.5" />
                Carbon credit risk intelligence
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="mt-5 font-display text-4xl font-bold leading-[1.06] tracking-tight sm:text-5xl lg:text-[3.4rem]"
              >
                See the risk <br />
                behind the <span className="gradient-text text-glow">price</span>.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.32, ease: [0.22, 1, 0.36, 1] }}
                className="mt-5 max-w-xl text-base leading-7 text-muted-foreground"
              >
                Carbon credits quote a market price — but their real financial risk hides in
                project performance, carbon integrity, liquidity, regulatory eligibility and
                issuer credibility. CarbonLens fuses the fragmented signals into one
                transparent 0–100 risk score for every credit.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.44 }}
                className="mt-8 flex flex-wrap items-center gap-3"
              >
                <Button asChild size="lg" className="gap-2 rounded-lg px-6 text-[15px]">
                  <Link to="/dashboard">
                    Launch Risk Terminal <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-lg px-6 text-[15px]">
                  <a href="#scoring">How scoring works</a>
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground"
              >
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5 text-primary" /> Explainable, weighted model
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Landmark className="size-3.5 text-primary" /> Verra · Gold Standard · ACR · CAR
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Leaf className="size-3.5 text-primary" /> 10 sample projects
                </span>
              </motion.div>
            </div>

            <div className="animate-float-y">
              <HeroCreditCard />
            </div>
          </div>

          <Ticker />
        </section>

        {/* ============ PROBLEM ============ */}
        <section id="problem" className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
          <SectionHeading
            kicker="The information gap"
            title={
              <>
                A visible price. <span className="gradient-text">An invisible risk.</span>
              </>
            }
            sub="Critical facts are scattered across registries, project documents, reports and external sources. Buyers do weeks of manual diligence — and still buy blind."
          />

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {[
              {
                icon: <FileSearch className="size-5" />,
                title: "Weeks of manual diligence",
                body: "Project documents, registry listings, issuer reports and market chatter live in different places. Every purchase restarts the hunt.",
              },
              {
                icon: <TrendingDown className="size-5" />,
                title: "Mispriced exposure",
                body: "Low-quality or high-risk credits can look cheap. Regulatory shifts, project failures and illiquidity turn small misjudgments into large losses.",
              },
              {
                icon: <CircleDot className="size-5" />,
                title: "Reputational fallout",
                body: "When underlying claims are challenged, the financial hit is only half the damage — challenged offsets become public headlines.",
              },
            ].map((p, i) => (
              <motion.div
                key={p.title}
                {...fadeUp}
                transition={{ duration: 0.55, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="group glass relative overflow-hidden rounded-2xl p-6 transition-colors hover:border-primary/30"
              >
                <div className="pointer-events-none absolute -right-8 -top-10 size-28 rounded-full bg-primary/8 blur-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="flex size-11 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary">
                  {p.icon}
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold tracking-tight">{p.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{p.body}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ============ SCORING MODEL ============ */}
        <section id="scoring" className="relative border-y border-border/60 bg-card/30 py-20 lg:py-28">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <SectionHeading
              kicker="The model"
              title={
                <>
                  One score. <span className="gradient-text">Six weighted factors.</span>
                </>
              }
              sub="Every credit is scored 0–100 across the dimensions that actually drive financial risk. No black box — every factor and weight is shown."
            />

            <div className="mt-12 grid gap-8 lg:grid-cols-5">
              {/* weights */}
              <motion.div
                {...fadeUp}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="glass rounded-2xl p-6 lg:col-span-3"
              >
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="font-display text-base font-semibold tracking-tight">
                    Composite weights
                  </h3>
                  <span className="num text-[10px] uppercase tracking-widest text-muted-foreground/60">
                    Σ = 100%
                  </span>
                </div>
                <div className="space-y-4">
                  {RISK_WEIGHTS_SUMMARY.map((w, i) => (
                    <div key={w.key}>
                      <div className="mb-1.5 flex items-baseline justify-between">
                        <span className="text-sm font-medium">{w.label}</span>
                        <span className="num text-sm text-primary">{(w.weight * 100).toFixed(0)}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-foreground/8">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-chart-2 to-primary"
                          initial={{ width: 0 }}
                          whileInView={{ width: `${w.value * 5}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.9, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                          style={{ filter: "drop-shadow(0 0 6px oklch(0.8 0.2 155 / 0.5))" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* tiers */}
              <motion.div
                {...fadeUp}
                transition={{ duration: 0.6, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
                className="glass rounded-2xl p-6 lg:col-span-2"
              >
                <h3 className="font-display text-base font-semibold tracking-tight">Risk tiers</h3>
                <div className="mt-5 space-y-3">
                  {[
                    { tier: "A" as const, range: "78–100", desc: "Prime — institutional quality" },
                    { tier: "B" as const, range: "62–77", desc: "Investment grade — solid with watch items" },
                    { tier: "C" as const, range: "45–61", desc: "Watch — elevated risk, price in the caveats" },
                    { tier: "D" as const, range: "0–44", desc: "High risk — avoid without deep diligence" },
                  ].map((t, i) => (
                    <motion.div
                      key={t.tier}
                      initial={{ opacity: 0, x: 16 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.45, delay: 0.15 + i * 0.08 }}
                      className="flex items-center gap-3 rounded-xl border border-border/60 bg-foreground/[0.02] p-3"
                    >
                      <TierBadge tier={t.tier} />
                      <div className="min-w-0 flex-1">
                        <div className="num text-[11px] text-muted-foreground/70">score {t.range}</div>
                        <div className="truncate text-xs text-muted-foreground">{t.desc}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-5 rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-xs leading-5 text-muted-foreground">
                  <span className="font-medium text-foreground">Confidence is earned, not claimed.</span>{" "}
                  Tier A scores require strong MRV and issuer track record; thin data downgrades the label.
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ============ TERMINAL PREVIEW ============ */}
        <section id="terminal" className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
          <SectionHeading
            kicker="The terminal"
            title={
              <>
                A ranked book of <span className="gradient-text">scored credits</span>
              </>
            }
            sub="The Risk Terminal ranks every credit, surfaces the factors behind each score, and lets you drill into price history, volume, vintages and analyst flags."
          />

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative mt-12"
          >
            {/* mock window */}
            <div className="glass overflow-hidden rounded-2xl shadow-[0_30px_80px_-30px_oklch(0.8_0.2_155/0.2)]">
              <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
                <span className="size-2.5 rounded-full bg-red-400/60" />
                <span className="size-2.5 rounded-full bg-amber-400/60" />
                <span className="size-2.5 rounded-full bg-emerald-400/60" />
                <span className="num ml-3 text-[11px] text-muted-foreground/60">
                  carbonlens · /dashboard
                </span>
              </div>
              <div className="divide-y divide-border/40">
                {scoredCredits.slice(0, 4).map((entry, i) => {
                  const up = entry.credit.priceChange >= 0;
                  return (
                    <motion.div
                      key={entry.credit.id}
                      initial={{ opacity: 0, x: -14 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.45, delay: 0.2 + i * 0.1 }}
                      className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-foreground/[0.02]"
                    >
                      <span className="num w-6 text-xs text-muted-foreground/50">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <ScoreRing score={entry.risk.score} tier={entry.risk.tier} size={46} strokeWidth={4} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{entry.credit.name}</div>
                        <div className="num text-[11px] text-muted-foreground/70">
                          {entry.credit.id} · {entry.credit.type} · {entry.credit.country}
                        </div>
                      </div>
                      <div className="hidden sm:block">
                        <Sparkline data={entry.credit.priceHistory} positive={up} width={90} height={28} />
                      </div>
                      <div className="num w-20 text-right text-sm font-semibold">
                        {fmtMoney(entry.credit.price)}
                      </div>
                      <span className="num hidden w-16 text-right text-xs text-muted-foreground md:block">
                        {fmtTonnes(entry.credit.monthlyVolume)} t
                      </span>
                      <TierBadge tier={entry.risk.tier} />
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* caption */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground"
            >
              <span className="inline-flex items-center gap-1.5">
                <BarChart3 className="size-3.5 text-primary" /> Weighted factor breakdown per credit
              </span>
              <span className="inline-flex items-center gap-1.5">
                <TrendingUp className="size-3.5 text-primary" /> 12-month price history
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-primary" /> Analyst flags &amp; confidence
              </span>
            </motion.div>
          </motion.div>
        </section>

        {/* ============ CTA ============ */}
        <section className="relative border-t border-border/60 py-20 lg:py-24">
          <div className="mx-auto w-full max-w-3xl px-4 text-center sm:px-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="glass relative overflow-hidden rounded-3xl px-6 py-14 sm:px-12"
            >
              <div className="pointer-events-none absolute inset-0 bg-grid-static opacity-40 [mask-image:radial-gradient(60%_60%_at_50%_40%,black,transparent)]" />
              <div className="pointer-events-none absolute -top-24 left-1/2 size-64 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
              <div className="relative">
                <LogoMark className="animate-float-y mx-auto size-12 text-primary" />
                <h2 className="mt-6 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                  Stop buying carbon <span className="gradient-text">blind</span>.
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                  Open the Risk Terminal and see every credit the way a risk desk would —
                  scored, ranked and explained.
                </p>
                <Button asChild size="lg" className="mt-8 gap-2 rounded-lg px-8 text-[15px]">
                  <Link to="/dashboard">
                    Launch Risk Terminal <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <p className="num mt-4 text-[11px] text-muted-foreground/50">
                  v1 · sample data · no card required
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ============ FOOTER ============ */}
        <footer className="border-t border-border/60 py-8">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 text-xs text-muted-foreground/60 sm:flex-row sm:px-6">
            <div className="flex items-center gap-2">
              <LogoMark className="size-5 text-primary/70" />
              <span>CarbonLens — carbon credit risk intelligence</span>
            </div>
            <span className="num">Hackathon build · v1 · illustrative data only</span>
          </div>
        </footer>
      </div>
    </motion.div>
  );
}
