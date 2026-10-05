import { Link, useParams } from "react-router";
import { motion } from "framer-motion";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  CreditCard,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ComparableCredits,
  CreditDetailCard,
  RiskFactorCard,
  WorkspaceNav,
} from "@/components/dashboard-shell";
import { CreditAnalyticsPanel } from "@/components/credit-analytics";
import {
  RecommendationBadge,
  ScoreRing,
  Sparkline,
  TierBadge,
} from "@/components/credit-visuals";
import { fmtMoney, fmtPct, fmtTonnes, scoredCredits } from "@/lib/credits";
import { cn } from "@/lib/utils";

/**
 * Full-page research file for a single carbon-offer company: valuation hero,
 * KPI strip, per-company graphical analytics, due-diligence tabs, risk factors
 * and comparable peers. Opened from any credit card or list row via
 * `/credit/:creditId` — deliberately a full page, not a dialog or side panel.
 */
export function CreditDetailScreen() {
  const { creditId } = useParams<{ creditId: string }>();
  const entry = scoredCredits.find((e) => e.credit.id === creditId);

  if (!entry) {
    return (
      <div className="relative min-h-screen overflow-x-clip">
        <div className="pointer-events-none fixed inset-0 bg-grid opacity-60 [mask-image:radial-gradient(70%_50%_at_50%_0%,black,transparent)]" />
        <WorkspaceNav />
        <main className="relative mx-auto flex w-full max-w-6xl flex-col items-center px-4 py-24 text-center sm:px-6">
          <div className="num text-[11px] font-medium uppercase tracking-[0.18em] text-primary">
            Research file
          </div>
          <h1 className="mt-3 font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Credit not found
          </h1>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            No credit with the id “{creditId}” is on the book. Browse the marketplace
            to open a company's full research file.
          </p>
          <Button asChild className="mt-6 gap-2">
            <Link to="/marketplace">
              <ArrowLeft className="size-4" /> Back to marketplace
            </Link>
          </Button>
        </main>
      </div>
    );
  }

  const { credit: c, risk } = entry;
  const up = c.priceChange >= 0;
  const over = risk.mispricingPct >= 0;
  const others = scoredCredits.filter((e) => e.credit.id !== c.id);

  const kpis = [
    {
      label: "Fair value (point)",
      value: fmtMoney(risk.fairValue.point),
      sub: `band ${fmtMoney(risk.fairValue.low)} – ${fmtMoney(risk.fairValue.high)}`,
      tone: "text-primary",
    },
    {
      label: "Mispricing",
      value: `${over ? "+" : ""}${risk.mispricingPct.toFixed(1)}%`,
      sub: over ? "above fair value" : "below fair value",
      tone: over ? "text-amber-300" : "text-emerald-400",
    },
    {
      label: "30-day traded",
      value: `${fmtTonnes(c.monthlyVolume)} t`,
      sub: "on marketplaces",
    },
    {
      label: "Listed supply",
      value: `${fmtTonnes(c.volumeAvailable)} t`,
      sub: "currently available",
    },
    {
      label: "Vintages",
      value: String(c.vintages.length),
      sub: c.vintages.join(" · "),
    },
    {
      label: "Composite",
      value: `${risk.score}/100`,
      sub: `${risk.tierLabel} · ${risk.confidence} confidence`,
    },
  ];

  return (
    <div className="relative min-h-screen overflow-x-clip">
      <div className="pointer-events-none fixed inset-0 bg-grid opacity-60 [mask-image:radial-gradient(70%_50%_at_50%_0%,black,transparent)]" />
      <div className="pointer-events-none fixed -left-44 top-1/3 size-[440px] rounded-full bg-primary/6 blur-[130px]" />
      <div className="pointer-events-none fixed -right-44 top-2/3 size-[440px] rounded-full bg-chart-2/5 blur-[130px]" />

      <WorkspaceNav />

      <main className="relative mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6">
        {/* breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="size-3.5" />
            All credits
          </Link>
          <div className="num text-[10px] uppercase tracking-[0.18em] text-muted-foreground/60">
            Research file · {c.id} · sample data
          </div>
        </div>

        {/* valuation hero */}
        <motion.section
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-4"
        >
          <div className="glass rounded-2xl p-5 sm:p-6">
            <div className="flex flex-wrap items-start gap-5">
              <ScoreRing
                score={risk.score}
                tier={risk.tier}
                size={96}
                strokeWidth={7}
                animateOnView={false}
              />
              <div className="min-w-[260px] flex-1">
                <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                  {c.name}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <TierBadge tier={risk.tier} />
                  <RecommendationBadge rec={risk.recommendation} />
                  <Badge
                    variant="outline"
                    className="border-border/60 text-[10px] uppercase tracking-wider"
                  >
                    {risk.confidence} confidence
                  </Badge>
                </div>
                <div className="num mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground/70">
                  <span>{c.id}</span>
                  <span className="text-muted-foreground/40">·</span>
                  <span>{c.registry}</span>
                  <span className="text-muted-foreground/40">·</span>
                  <span>{c.type}</span>
                  <span className="text-muted-foreground/40">·</span>
                  <span>{c.country}</span>
                  <span className="text-muted-foreground/40">·</span>
                  <span>{c.region}</span>
                </div>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                  {risk.recommendationWhy}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {c.flags.map((f) => (
                    <span
                      key={f}
                      className="rounded-full border border-border/70 bg-foreground/[0.03] px-2.5 py-0.5 text-[11px] text-muted-foreground"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex w-full shrink-0 flex-col gap-3 sm:w-56">
                <div className="rounded-xl border border-border/60 bg-foreground/[0.02] p-3">
                  <div className="num text-[10px] uppercase tracking-wider text-muted-foreground/60">
                    Market quote
                  </div>
                  <div className="num mt-1 flex flex-wrap items-center gap-2 text-2xl font-bold">
                    {fmtMoney(c.price)}
                    <span
                      className={cn(
                        "inline-flex items-center gap-0.5 text-xs font-semibold",
                        up ? "text-emerald-400" : "text-red-400",
                      )}
                    >
                      {up ? (
                        <ArrowUpRight className="size-3.5" />
                      ) : (
                        <ArrowDownRight className="size-3.5" />
                      )}
                      {fmtPct(c.priceChange)}
                    </span>
                  </div>
                  <div className="mt-1">
                    <Sparkline data={c.priceHistory} positive={up} width={200} height={36} />
                  </div>
                </div>
                <Button asChild className="w-full gap-2">
                  <Link to={`/portfolio/new?credit=${c.id}`}>
                    <CreditCard className="size-4" /> Trade this credit
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </motion.section>

        {/* KPI strip */}
        <section className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {kpis.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="glass rounded-xl p-3.5"
            >
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
                {s.label}
              </div>
              <div className={cn("num mt-1 text-lg font-bold tracking-tight", s.tone)}>
                {s.value}
              </div>
              <div className="num mt-0.5 truncate text-[10px] text-muted-foreground/70">
                {s.sub}
              </div>
            </motion.div>
          ))}
        </section>

        {/* per-company graphical analytics */}
        <section className="mt-8">
          <CreditAnalyticsPanel credit={c} risk={risk} />
        </section>

        {/* detail tabs + risk factors + peers */}
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <CreditDetailCard credit={c} risk={risk} />
          </div>
          <aside className="space-y-4">
            <RiskFactorCard credit={c} />
            <ComparableCredits credit={c} />
          </aside>
        </div>

        {/* switch companies without going back */}
        <section className="mt-10">
          <div className="flex flex-wrap items-center gap-2">
            <Layers className="size-4 text-primary" />
            <h2 className="font-display text-lg font-semibold tracking-tight">
              More companies
            </h2>
            <Link
              to="/marketplace"
              className="num ml-auto text-[11px] font-semibold text-primary hover:text-primary/80"
            >
              Marketplace →
            </Link>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {others.slice(0, 9).map((e) => (
              <Link
                key={e.credit.id}
                to={`/credit/${e.credit.id}`}
                className="glass flex items-center justify-between gap-3 rounded-xl px-3.5 py-3 transition-colors hover:border-primary/35"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{e.credit.name}</div>
                  <div className="num text-[10px] text-muted-foreground/60">
                    {e.credit.id} · {e.credit.registry}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="num text-xs font-bold">{e.risk.score}</span>
                  <RecommendationBadge rec={e.risk.recommendation} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <footer className="relative border-t border-border/60 py-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 text-xs text-muted-foreground/50 sm:flex-row sm:px-6">
          <span>CARBONIQ · financial intelligence, not investment advice</span>
          <span className="num">PILOT BUILD · SAMPLE DATA · RESEARCH FILE</span>
        </div>
      </footer>
    </div>
  );
}
