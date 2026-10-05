import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Landmark,
  Leaf,
  ListFilter,
  ScanSearch,
  ShieldCheck,
  SlidersHorizontal,
  TrendingUp,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  RecommendationBadge,
  ScoreRing,
  Sparkline,
  TierBadge,
} from "@/components/credit-visuals";
import {
  assessRisk,
  fmtMoney,
  fmtPct,
  fmtTonnes,
  scoredCredits,
  type Credit,
  type Region,
} from "@/lib/credits";
import { cn } from "@/lib/utils";
import { WorkspaceNav } from "@/components/dashboard-shell";

type SortMode = "score" | "price" | "liquidity";

const REGIONS: Region[] = [
  "Latin America",
  "Africa",
  "Southeast Asia",
  "North America",
  "Europe",
];

function KpiCard({
  label,
  value,
  sub,
  icon,
  delay,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className="glass relative overflow-hidden rounded-xl p-4"
    >
      <div className="pointer-events-none absolute -right-6 -top-8 size-24 rounded-full bg-primary/8 blur-2xl" />
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </span>
        <span className="text-primary/80">{icon}</span>
      </div>
      <div className="num mt-2 text-2xl font-semibold tracking-tight">{value}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>
    </motion.div>
  );
}

function CreditRow({
  entry,
  rank,
  onSelect,
}: {
  entry: { credit: Credit; risk: ReturnType<typeof assessRisk> };
  rank: number;
  onSelect: () => void;
}) {
  const { credit: c, risk } = entry;
  const up = c.priceChange >= 0;

  return (
    <motion.button
      layout
      type="button"
      onClick={onSelect}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.985 }}
      transition={{ duration: 0.35, delay: Math.min(rank * 0.04, 0.3), ease: [0.22, 1, 0.36, 1] }}
      className="group relative w-full overflow-hidden rounded-xl border border-border/70 bg-card/60 text-left backdrop-blur-sm transition-colors hover:border-primary/35 hover:bg-card"
    >
      {/* hover edge glow */}
      <span className="pointer-events-none absolute inset-y-0 left-0 w-[2px] scale-y-0 bg-gradient-to-b from-transparent via-primary to-transparent opacity-0 transition-all duration-300 group-hover:scale-y-100 group-hover:opacity-100" />

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3.5 sm:px-5">
        {/* rank */}
        <span className="num hidden w-7 shrink-0 text-sm text-muted-foreground/60 sm:block">
          {String(rank).padStart(2, "0")}
        </span>

        {/* score ring */}
        <ScoreRing score={risk.score} tier={risk.tier} size={58} strokeWidth={5} />

        {/* identity */}
        <div className="min-w-[170px] flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold tracking-tight">{c.name}</span>
            <span className="num rounded border border-border/80 bg-foreground/[0.03] px-1.5 py-px text-[10px] text-muted-foreground">
              {c.id}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Landmark className="size-3" /> {c.registry}
            </span>
            <span className="inline-flex items-center gap-1">
              <Leaf className="size-3" /> {c.type}
            </span>
            <span>{c.country}</span>
          </div>
        </div>

        {/* price vs fair value */}
        <div className="w-28 shrink-0">
          <div className="num text-sm font-semibold">{fmtMoney(c.price)}</div>
          <div
            className={cn(
              "num mt-0.5 inline-flex items-center gap-0.5 text-[11px]",
              up ? "text-emerald-400" : "text-red-400",
            )}
          >
            {up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
            {fmtPct(c.priceChange)}
          </div>
          <div className="num mt-0.5 text-[10px] text-muted-foreground/70">
            FV {fmtMoney(risk.fairValue.point)}
          </div>
        </div>

        {/* sparkline */}
        <div className="hidden w-28 shrink-0 md:block">
          <Sparkline data={c.priceHistory} positive={up} />
        </div>

        {/* liquidity */}
        <div className="hidden w-24 shrink-0 lg:block">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70">30d vol</div>
          <div className="num text-sm">{fmtTonnes(c.monthlyVolume)} t</div>
        </div>

        {/* tier */}
        <div className="ml-auto flex shrink-0 items-center gap-3">
          <RecommendationBadge rec={risk.recommendation} className="hidden md:inline-flex" />
          <TierBadge tier={risk.tier} className="hidden sm:inline-flex" />
          <ScanSearch className="size-4 text-muted-foreground/50 transition-colors group-hover:text-primary" />
        </div>
      </div>
    </motion.button>
  );
}

export default function Dashboard() {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("score");
  const [region, setRegion] = useState<Region | "All">("All");
  const [minScore, setMinScore] = useState(0);
  const navigate = useNavigate();

  const rows = useMemo(() => {
    let list = scoredCredits.filter(({ credit: c, risk }) => {
      const q = query.trim().toLowerCase();
      if (
        q &&
        !c.name.toLowerCase().includes(q) &&
        !c.id.toLowerCase().includes(q) &&
        !c.type.toLowerCase().includes(q) &&
        !c.country.toLowerCase().includes(q)
      )
        return false;
      if (region !== "All" && c.region !== region) return false;
      if (risk.score < minScore) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sort === "price") return b.credit.price - a.credit.price;
      if (sort === "liquidity") return b.credit.liquidity - a.credit.liquidity;
      return b.risk.score - a.risk.score;
    });
    return list;
  }, [query, sort, region, minScore]);

  const avg = Math.round(
    scoredCredits.reduce((a, e) => a + e.risk.score, 0) / scoredCredits.length,
  );
  const tracked = scoredCredits.length;
  const flagged = scoredCredits.filter((e) => e.risk.tier === "C" || e.risk.tier === "D").length;
  const totalVol = scoredCredits.reduce((a, e) => a + e.credit.volumeAvailable, 0);

  return (
    <main className="relative min-h-screen">
      {/* ambient background */}
      <div className="pointer-events-none fixed inset-0 bg-grid opacity-60 [mask-image:radial-gradient(70%_50%_at_50%_0%,black,transparent)]" />

      <WorkspaceNav />

      <div className="relative mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6">

        {/* page title */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08 }}
          className="mt-8"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-3 py-1 text-[11px] font-medium text-primary">
            <span className="animate-pulse-dot size-1.5 rounded-full bg-primary" />
            Live scoring · sample data
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Credit <span className="gradient-text">Intelligence Terminal</span>
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Every listed credit is scored across six weighted factors, valued on a
            risk-adjusted fair-value band, and tested against adverse scenarios — so you
            know what you are buying, what it is worth, and what could make you regret it.
          </p>
        </motion.section>

        {/* KPI row */}
        <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard label="Credits tracked" value={String(tracked)} sub="across 4 registries" icon={<Activity className="size-4" />} delay={0.12} />
          <KpiCard label="Avg risk score" value={`${avg}`} sub="weighted composite /100" icon={<ShieldCheck className="size-4" />} delay={0.18} />
          <KpiCard label="Watch & high risk" value={String(flagged)} sub="tier C or below" icon={<SlidersHorizontal className="size-4" />} delay={0.24} />
          <KpiCard label="Listed volume" value={`${fmtTonnes(totalVol)} t`} sub="currently on market" icon={<TrendingUp className="size-4" />} delay={0.3} />
        </section>

        {/* filter bar */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="glass mt-6 flex flex-wrap items-center gap-3 rounded-xl p-3"
        >
          <div className="relative min-w-[200px] flex-1">
            <ScanSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search project, ID, type, country…"
              className="border-border/70 bg-foreground/[0.03] pl-9 text-sm"
            />
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-border/70 bg-foreground/[0.03] p-1">
            <ListFilter className="mx-1.5 size-3.5 text-muted-foreground/60" />
            {(
              [
                ["score", "Risk score"],
                ["price", "Price"],
                ["liquidity", "Liquidity"],
              ] as [SortMode, string][]
            ).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setSort(mode)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  sort === mode
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-border/70 bg-foreground/[0.03] p-1">
            {(["All", ...REGIONS] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRegion(r)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  region === r
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {r === "Southeast Asia" ? "SE Asia" : r === "North America" ? "N. America" : r}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="num text-xs text-muted-foreground">min {minScore}</span>
            <input
              type="range"
              min={0}
              max={90}
              step={5}
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="h-1 w-28 cursor-pointer appearance-none rounded-full bg-foreground/15 accent-emerald-400"
            />
          </div>
        </motion.section>

        {/* ranked list */}
        <section className="mt-5">
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold tracking-tight text-foreground/90">
              Ranked by {sort === "score" ? "risk score" : sort === "price" ? "price" : "liquidity"}
            </h2>
            <span className="num text-xs text-muted-foreground/60">
              {rows.length} / {tracked} credits
            </span>
          </div>

          <div className="space-y-2.5">
            <AnimatePresence mode="popLayout">
              {rows.map((entry, i) => (
                <CreditRow
                  key={entry.credit.id}
                  entry={entry}
                  rank={i + 1}
                  onSelect={() => navigate(`/credit/${entry.credit.id}`)}
                />
              ))}
            </AnimatePresence>
          </div>

          {rows.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-xl border border-dashed border-border/80 py-16 text-center text-sm text-muted-foreground"
            >
              No credits match the current filters.
            </motion.div>
          )}
        </section>

        <p className="mt-10 text-center text-[11px] leading-5 text-muted-foreground/50">
          CarbonIQ · Illustrative sample data · Risk-adjusted valuations are model estimates, not investment advice.
        </p>
      </div>

    </main>
  );
}

