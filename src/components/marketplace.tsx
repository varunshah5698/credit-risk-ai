import { useState } from "react";
import { Link } from "react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Code,
  FileSearch,
  Gauge,
  Globe,
  LayoutDashboard,
  PenLine,
  PlayCircle,
  Plus,
  Radar,
  ShieldCheck,
  Sparkles,
  Star,
  Terminal,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fmtMoney, fmtPct, fmtTonnes, scoredCredits } from "@/lib/credits";
import { cn } from "@/lib/utils";
import { RecommendationBadge, ScoreRing, Sparkline } from "@/components/credit-visuals";
import { WorkspaceNav } from "@/components/dashboard-shell";
import { ScanPanel } from "@/components/scan-panels";

const SCAN_KINDS = [
  { id: "mispricing", label: "Mispricing radar", icon: <Radar className="size-4" />, blurb: "Market quote vs risk-adjusted fair value across every listed credit." },
  { id: "negotiation", label: "Negotiation intelligence", icon: <PenLine className="size-4" />, blurb: "Turns each finding into a defensible purchase range you can take into the room." },
  { id: "portfolio", label: "Portfolio optimization", icon: <TrendingUp className="size-4" />, blurb: "Concentration, turnover and rebalancing suggestions for the current book." },
  { id: "fraud", label: "Fraud detection", icon: <ShieldCheck className="size-4" />, blurb: "Registry reconciliation, serialisation gaps and duplicate-issuance checks." },
  { id: "whatif", label: "What-if simulator", icon: <PlayCircle className="size-4" />, blurb: "Re-runs valuation under price, policy and liquidity shocks you choose." },
  { id: "alerts", label: "Regulatory alerts", icon: <Bell className="size-4" />, blurb: "CORSIA, ICVCM and methodology changes that affect eligibility overnight." },
  { id: "env", label: "Environmental / satellite", icon: <Globe className="size-4" />, blurb: "Canopy, fire and reversal indices correlated to each project claim." },
  { id: "activity", label: "AI agent timeline", icon: <Sparkles className="size-4" />, blurb: "Chronological log of every automated check the engine ran on your watchlist." },
  { id: "analytics", label: "Marketplace analytics", icon: <BarChart3 className="size-4" />, blurb: "Turnover, spread and depth statistics by registry, corridor and vintage." },
  { id: "nlp", label: "NLP financial terminal", icon: <Terminal className="size-4" />, blurb: "Ask the book a question in plain language, get an evidence-backed answer." },
  { id: "waterfall", label: "Valuation waterfall", icon: <Gauge className="size-4" />, blurb: "From evidence anchor to risk discount to final fair-value band, step by step." },
  { id: "decomposition", label: "Risk decomposition", icon: <ArrowRight className="size-4" />, blurb: "Six weighted factors, portfolio average, where the composite comes from." },
  { id: "graph", label: "Evidence graph", icon: <Code className="size-4" />, blurb: "Claims linked to sources, verification reports and open questions." },
  { id: "heatmap", label: "Portfolio heatmap", icon: <LayoutDashboard className="size-4" />, blurb: "Positions shaded by tier, mispricing and liquidity at a glance." },
  { id: "audit", label: "Transaction audit trail", icon: <FileSearch className="size-4" />, blurb: "Immutable chain of buys, sells and retirements with hashes and receipts." },
  { id: "receipt", label: "Digital ownership receipt", icon: <Star className="size-4" />, blurb: "Custody receipt for every simulated position in your wallet." },
];

function ScreenFooter() {
  return (
    <footer className="relative border-t border-border/60 py-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 text-xs text-muted-foreground/50 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-primary/40" />
          <span>CARBONIQ · financial intelligence, not investment advice</span>
        </div>
        <span className="num">PILOT BUILD · SAMPLE DATA · 68 SIGNAL TYPES</span>
      </div>
    </footer>
  );
}

/* ===================== /marketplace — buy-side listing board ===================== */

export function MarketplaceScreen() {
  const accum = scoredCredits.filter(
    (e) => e.risk.recommendation === "BUY" || e.risk.recommendation === "HOLD",
  ).length;
  const avoids = scoredCredits.filter((e) => e.risk.recommendation === "AVOID").length;
  const avgMis =
    scoredCredits.reduce((a, e) => a + e.risk.mispricingPct, 0) / scoredCredits.length;
  const supply = scoredCredits.reduce((a, e) => a + e.credit.volumeAvailable, 0);

  const kpis = [
    {
      label: "Listed supply",
      value: `${fmtTonnes(supply)} t`,
      sub: `across ${scoredCredits.length} companies`,
    },
    { label: "Avg mispricing", value: `${avgMis >= 0 ? "+" : ""}${avgMis.toFixed(1)}%`, sub: "market vs fair value" },
    { label: "BUY · HOLD", value: String(accum), sub: "accumulate or hold calls" },
    { label: "AVOID flags", value: String(avoids), sub: "priced above the band" },
  ];

  return (
    <div className="relative min-h-screen overflow-x-clip">
      <div className="pointer-events-none fixed inset-0 bg-grid opacity-60 [mask-image:radial-gradient(70%_50%_at_50%_0%,black,transparent)]" />
      <div className="pointer-events-none fixed -left-44 top-1/3 size-[440px] rounded-full bg-primary/6 blur-[130px]" />
      <div className="pointer-events-none fixed -right-44 top-2/3 size-[440px] rounded-full bg-chart-2/5 blur-[130px]" />

      <WorkspaceNav />

      <main className="relative mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6">
        <motion.section
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-wrap items-start justify-between gap-4"
        >
          <div>
            <div className="num text-[11px] font-medium uppercase tracking-[0.18em] text-primary">
              Marketplace · live tape
            </div>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Buy the evidence, not the quote
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Every listing carries a risk-adjusted fair value, an explainable
              recommendation and the evidence behind it — so the tape never gets the
              last word. Open any company for its full research file: price vs fair
              value, risk profile, stress tests and the evidence mix.
            </p>
          </div>
          <Button asChild className="gap-2">
            <Link to="/portfolio/new">
              <Plus className="size-4" /> Open buy workflow
            </Link>
          </Button>
        </motion.section>

        <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {kpis.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="glass rounded-xl p-4"
            >
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground/70">
                {s.label}
              </div>
              <div className="num mt-1 text-xl font-bold tracking-tight">{s.value}</div>
              <div className="num mt-0.5 text-[11px] text-muted-foreground/70">{s.sub}</div>
            </motion.div>
          ))}
        </section>

        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {scoredCredits.map((entry, i) => {
            const c = entry.credit;
            const r = entry.risk;
            const up = c.priceChange >= 0;
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.4) }}
              >
                <Link
                  to={`/credit/${c.id}`}
                  className={cn(
                    "glass group flex h-full flex-col rounded-xl p-4 transition-colors hover:border-primary/40",
                    r.recommendation === "AVOID" && "border-red-400/25",
                    r.recommendation === "BUY" && "border-emerald-300/25",
                    r.recommendation === "NEGOTIATE" && "border-amber-300/25",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <ScoreRing score={r.score} tier={r.tier} size={44} strokeWidth={4} />
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold tracking-tight">{c.name}</div>
                      <div className="num text-[11px] text-muted-foreground/70">
                        {c.id} · {c.registry}
                      </div>
                    </div>
                    <RecommendationBadge rec={r.recommendation} />
                  </div>
                  <div className="mt-3 flex items-end justify-between gap-3">
                    <div>
                      <div className="num text-lg font-bold">{fmtMoney(c.price)}</div>
                      <div className={cn("num text-[11px]", up ? "text-emerald-400" : "text-red-400")}>
                        {fmtPct(c.priceChange)} · 12m
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="num text-[11px] text-muted-foreground/70">
                        FV {fmtMoney(r.fairValue.point)}
                      </div>
                      <div
                        className={cn(
                          "num text-xs font-bold",
                          r.mispricingPct > 4
                            ? "text-amber-300"
                            : r.mispricingPct < -8
                              ? "text-emerald-300"
                              : "text-muted-foreground",
                        )}
                      >
                        {r.mispricingPct >= 0 ? "+" : ""}
                        {r.mispricingPct.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <div className="mt-2">
                    <Sparkline data={c.priceHistory} positive={up} width={240} height={32} />
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 border-t border-border/50 pt-2.5">
                    <span className="num truncate text-[10px] uppercase tracking-[0.14em] text-muted-foreground/60">
                      {c.type} · {c.country}
                    </span>
                    <span className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors group-hover:text-primary">
                      Full research file
                      <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </section>
      </main>
      <ScreenFooter />
    </div>
  );
}

/* ===================== /scans — corridor scan switchboard ===================== */

export function CorridorScans() {
  const [active, setActive] = useState("mispricing");
  const kind = SCAN_KINDS.find((k) => k.id === active) ?? SCAN_KINDS[0];

  return (
    <div className="relative min-h-screen overflow-x-clip">
      <div className="pointer-events-none fixed inset-0 bg-grid opacity-60 [mask-image:radial-gradient(70%_50%_at_50%_0%,black,transparent)]" />
      <div className="pointer-events-none fixed -left-44 top-1/3 size-[440px] rounded-full bg-primary/6 blur-[130px]" />

      <WorkspaceNav />

      <main className="relative mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6">
        <motion.section
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="num text-[11px] font-medium uppercase tracking-[0.18em] text-primary">
            Scans · 16 analyzers · 68 signal types
          </div>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Corridor scans
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Point any analyzer at the book: each scan reconciles registry feeds,
            market tape and evidence files, then returns findings you can audit.
          </p>
        </motion.section>

        <div className="mt-6 flex flex-wrap gap-1.5">
          {SCAN_KINDS.map((k) => (
            <button
              key={k.id}
              type="button"
              onClick={() => setActive(k.id)}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-colors",
                active === k.id
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border/60 bg-card/40 text-muted-foreground hover:border-border/90 hover:text-foreground",
              )}
            >
              {k.icon}
              {k.label}
            </button>
          ))}
        </div>

        <motion.section
          key={active}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="glass mt-5 rounded-xl p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/60 pb-4">
            <div className="flex items-start gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
                {kind.icon}
              </span>
              <div>
                <h2 className="font-display text-lg font-semibold tracking-tight">
                  {kind.label}
                </h2>
                <p className="mt-0.5 max-w-2xl text-xs leading-5 text-muted-foreground">
                  {kind.blurb}
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="border-emerald-300/30 text-[10px] text-emerald-300">
              <span className="relative flex size-1.5 mr-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-300 opacity-70" />
                <span className="relative inline-flex size-1.5 rounded-full bg-emerald-300" />
              </span>
              LIVE
            </Badge>
          </div>

          <div className="mt-4" key={active}>
            <ScanPanel id={active} />
          </div>
        </motion.section>
      </main>
      <ScreenFooter />
    </div>
  );
}
