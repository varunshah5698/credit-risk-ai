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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { fmtMoney, fmtPct, fmtTonnes, scoredCredits } from "@/lib/credits";
import { cn } from "@/lib/utils";
import {
  EvidenceBar,
  RecommendationBadge,
  ScoreRing,
  Sparkline,
  TierBadge,
} from "@/components/credit-visuals";
import {
  ComparableCredits,
  RiskFactorCard,
  WorkspaceNav,
} from "@/components/dashboard-shell";

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
  const [selectedId, setSelectedId] = useState(scoredCredits[0].credit.id);
  const selected = scoredCredits.find((e) => e.credit.id === selectedId) ?? scoredCredits[0];
  const risk = selected.risk;

  const accum = scoredCredits.filter(
    (e) => e.risk.recommendation === "BUY" || e.risk.recommendation === "HOLD",
  ).length;
  const avoids = scoredCredits.filter((e) => e.risk.recommendation === "AVOID").length;
  const avgMis =
    scoredCredits.reduce((a, e) => a + e.risk.mispricingPct, 0) / scoredCredits.length;
  const supply = scoredCredits.reduce((a, e) => a + e.credit.volumeAvailable, 0);

  const kpis = [
    { label: "Listed supply", value: `${fmtTonnes(supply)} t`, sub: "across 10 credits" },
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
              last word.
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

        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          <section className="grid gap-3 sm:grid-cols-2 lg:col-span-2">
            {scoredCredits.map((entry, i) => {
              const c = entry.credit;
              const r = entry.risk;
              const up = c.priceChange >= 0;
              const isSel = c.id === selectedId;
              return (
                <motion.button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedId(c.id)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.3) }}
                  className={cn(
                    "glass rounded-xl p-4 text-left transition-colors hover:border-primary/30",
                    isSel && "border-primary/50 bg-primary/5",
                    !isSel && r.recommendation === "AVOID" && "border-red-400/25",
                    !isSel && r.recommendation === "BUY" && "border-emerald-300/25",
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
                </motion.button>
              );
            })}
          </section>

          <aside className="space-y-4">
            <Card className="glass">
              <CardHeader className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-bold tracking-tight">
                    {selected.credit.name}
                  </CardTitle>
                  <CardDescription>
                    {selected.credit.id} · {selected.credit.registry} · {selected.credit.country}
                  </CardDescription>
                </div>
                <TierBadge tier={risk.tier} />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-border/70 bg-foreground/[0.02] p-3">
                    <div className="num text-[10px] uppercase tracking-wider text-muted-foreground/60">
                      Market
                    </div>
                    <div className="num mt-1 text-lg font-bold">
                      {fmtMoney(selected.credit.price)}
                    </div>
                  </div>
                  <div className="rounded-lg border border-primary/25 bg-primary/5 p-3">
                    <div className="num text-[10px] uppercase tracking-wider text-primary/80">
                      Fair value
                    </div>
                    <div className="num mt-1 text-lg font-bold text-primary">
                      {fmtMoney(risk.fairValue.point)}
                    </div>
                  </div>
                </div>
                <p className="text-xs leading-5 text-muted-foreground">
                  {risk.recommendationWhy}
                </p>
                <Button asChild className="w-full gap-2">
                  <Link to={`/portfolio/new?credit=${selected.credit.id}`}>
                    Trade this credit <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
            <RiskFactorCard credit={selected.credit} />
            <ComparableCredits credit={selected.credit} />
          </aside>
        </div>
      </main>
      <ScreenFooter />
    </div>
  );
}

/* ===================== /scans — corridor scan switchboard ===================== */

export function CorridorScans() {
  const [active, setActive] = useState("mispricing");
  const kind = SCAN_KINDS.find((k) => k.id === active) ?? SCAN_KINDS[0];

  const rows = [...scoredCredits].sort(
    (a, b) => b.risk.mispricingPct - a.risk.mispricingPct,
  );

  const factorAvgs = scoredCredits[0].risk.breakdown.map((b) => {
    const avg = Math.round(
      scoredCredits.reduce((a, e) => {
        const f = e.risk.breakdown.find((x) => x.key === b.key);
        return a + (f?.value ?? 0);
      }, 0) / scoredCredits.length,
    );
    return { ...b, avg };
  });

  const evidenceTotal = scoredCredits.reduce(
    (a, e) => ({
      verified: a.verified + e.risk.evidence.verified,
      estimated: a.estimated + e.risk.evidence.estimated,
      assumed: a.assumed + e.risk.evidence.assumed,
      uncertain: a.uncertain + e.risk.evidence.uncertain,
    }),
    { verified: 0, estimated: 0, assumed: 0, uncertain: 0 },
  );

  const worstStresses = scoredCredits
    .flatMap((e) => e.risk.stresses.map((s) => ({ ...s, credit: e.credit })))
    .sort((a, b) => a.impactPct - b.impactPct)
    .slice(0, 6);

  const top = scoredCredits[0];
  const riskFactor = 0.4 + 0.6 * (top.risk.score / 100);
  const anchor = top.risk.fairValue.point / riskFactor;
  const waterfallSteps = [
    { label: "Evidence anchor", value: fmtMoney(anchor), note: "intrinsic value before risk" },
    { label: "× risk factor", value: `×${riskFactor.toFixed(2)}`, note: `composite score ${top.risk.score}/100` },
    { label: "Fair value (point)", value: fmtMoney(top.risk.fairValue.point), note: `band ${fmtMoney(top.risk.fairValue.low)} – ${fmtMoney(top.risk.fairValue.high)}` },
    { label: "Market quote", value: fmtMoney(top.credit.price), note: `${top.risk.mispricingPct >= 0 ? "+" : ""}${top.risk.mispricingPct.toFixed(1)}% vs fair value` },
  ];

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

          <div className="mt-4 space-y-4">
            {active === "mispricing" && (
              <div className="space-y-2">
                {rows.map((e, i) => {
                  const c = e.credit;
                  const r = e.risk;
                  const over = r.mispricingPct >= 0;
                  return (
                    <div
                      key={c.id}
                      className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-border/60 bg-foreground/[0.02] px-3 py-2.5"
                    >
                      <span className="num w-6 shrink-0 text-xs text-muted-foreground/60">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-[150px] flex-1">
                        <div className="text-sm font-medium">{c.name}</div>
                        <div className="num text-[11px] text-muted-foreground/70">
                          {c.id} · {c.registry}
                        </div>
                      </div>
                      <div className="num w-20 text-right text-xs">
                        {fmtMoney(c.price)}
                      </div>
                      <div className="num w-24 text-right text-xs text-primary">
                        FV {fmtMoney(r.fairValue.point)}
                      </div>
                      <div
                        className={cn(
                          "num w-20 text-right text-xs font-bold",
                          over ? "text-amber-300" : "text-emerald-400",
                        )}
                      >
                        {over ? "+" : ""}
                        {r.mispricingPct.toFixed(1)}%
                      </div>
                      <RecommendationBadge rec={r.recommendation} />
                    </div>
                  );
                })}
              </div>
            )}

            {active === "decomposition" && (
              <div className="space-y-3">
                {factorAvgs.map((b) => (
                  <div key={b.key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground/80">
                        {b.label}
                        <span className="num ml-2 text-[10px] text-muted-foreground/50">
                          ×{Math.round(b.weight * 100)}% weight
                        </span>
                      </span>
                      <span className="num font-semibold">{b.avg}</span>
                    </div>
                    <Progress value={b.avg} className="h-1.5" />
                  </div>
                ))}
                <p className="text-xs leading-5 text-muted-foreground">
                  Portfolio average across {scoredCredits.length} credits. The composite
                  is the weighted sum of these six factors — no black box.
                </p>
              </div>
            )}

            {active === "waterfall" && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Valuation walkthrough for {top.credit.name} ({top.credit.id}).
                </p>
                {waterfallSteps.map((s, i) => (
                  <div
                    key={s.label}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-lg border px-4 py-3",
                      i === 2
                        ? "border-primary/30 bg-primary/5"
                        : "border-border/60 bg-foreground/[0.02]",
                    )}
                  >
                    <div>
                      <div className="text-sm font-medium">{s.label}</div>
                      <div className="num text-[11px] text-muted-foreground/70">{s.note}</div>
                    </div>
                    <span
                      className={cn(
                        "num text-sm font-bold",
                        i === 2 ? "text-primary" : "text-foreground/90",
                      )}
                    >
                      {s.value}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {active !== "mispricing" &&
              active !== "decomposition" &&
              active !== "waterfall" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">Top findings</h3>
                    {worstStresses.map((s) => (
                      <div
                        key={`${s.credit.id}-${s.name}`}
                        className="flex items-center justify-between gap-3 rounded-lg border border-red-400/15 bg-red-500/[0.03] px-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-medium">{s.name}</div>
                          <div className="num text-[11px] text-muted-foreground/70">
                            {s.credit.id} · {s.detail}
                          </div>
                        </div>
                        <span className="num shrink-0 rounded bg-red-400/10 px-2 py-1 text-xs font-bold text-red-300">
                          {s.impactPct}%
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-lg border border-border/60 bg-foreground/[0.02] p-4">
                    <h3 className="text-sm font-semibold">Evidence mix feeding this scan</h3>
                    <div className="mt-3">
                      <EvidenceBar evidence={evidenceTotal} />
                    </div>
                  </div>
                </div>
              )}
          </div>
        </motion.section>
      </main>
      <ScreenFooter />
    </div>
  );
}
