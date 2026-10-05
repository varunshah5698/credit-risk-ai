import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ChevronDown,
  DollarSign,
  FileSearch,
  Filter,
  Gauge,
  LayoutDashboard,
  LineChart,
  ListTodo,
  LogOut,
  Mail,
  Menu,
  Plus,
  Radar,
  Router,
  ScanSearch,
  Scale,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { EvidenceBar, ScoreRing, Sparkline } from "@/components/credit-visuals";
import {
  assessRisk,
  fmtMoney,
  fmtPct,
  scoredCredits,
  type Credit,
} from "@/lib/credits";
import { cn } from "@/lib/utils";

const NAV = [
  { name: "Portfolio", href: "/portfolio", icon: <Wallet className="size-4" /> },
  { name: "Marketplace", href: "/marketplace", icon: <LayoutDashboard className="size-4" /> },
  { name: "Scans", href: "/scans", icon: <Radar className="size-4" /> },
  { name: "Analytics", href: "/analytics", icon: <LineChart className="size-4" /> },
  { name: "Ledger", href: "/ledger", icon: <ListTodo className="size-4" /> },
  { name: "Terminal", href: "/terminal", icon: <Zap className="size-4" /> },
];

function NavItem({
  name,
  href,
  icon,
  active,
}: {
  name: string;
  href: string;
  icon: React.ReactNode;
  active: boolean;
}) {
  return (
    <Link
      to={href}
      className={cn(
        "flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm font-medium transition-colors",
        active
          ? "border-primary/35 bg-primary/10 text-primary"
          : "border-border/60 bg-card/40 text-muted-foreground hover:border-border/90 hover:text-foreground",
      )}
    >
      {icon}
      {name}
    </Link>
  );
}

const STATS = [
  { label: "Holdings", value: String(scoredCredits.length), sub: "credits across 4 registries" },
  { label: "Avg risk score", value: "71", sub: "weighted composite /100" },
  { label: "Listed value", value: "$384K", sub: "in the open market" },
  { label: "Watch list", value: "2", sub: "tier C or below" },
];

const RISK_MAP: Record<string, { title: string; subtitle: string }> = {
  carbonIntegrity: {
    title: "Carbon integrity",
    subtitle: "Project honesty, additionality, and claim credibility.",
  },
  deliveryConfidence: {
    title: "Delivery confidence",
    subtitle: "Likelihood the emission reduction is actually delivered.",
  },
  liquidity: {
    title: "Liquidity",
    subtitle: "Ease of buying and selling without moving the tape.",
  },
  regulatoryEligibility: {
    title: "Regulatory eligibility",
    subtitle: "CORSIA, ICVCM, and voluntary-market compliance.",
  },
  issuerCredibility: {
    title: "Issuer credibility",
    subtitle: "Track record of the developer and counterparty.",
  },
  mrv: {
    title: "MRV quality",
    subtitle: "Monitoring, reporting, and independent verification strength.",
  },
};

const SCAN_SECTIONS = [
  {
    title: "Dataset used",
    items: [
      { k: "Registry feeds", v: "42 active" },
      { k: "Registry types", v: "Verra, Gold Standard, ACR, CAR" },
      { k: "Project types", v: "7 methodologies" },
      { k: "Corridors", v: "5 regions" },
    ],
  },
  {
    title: "Confidence signals",
    items: [
      { k: "Primary evidence", v: "61" },
      { k: "Model estimates", v: "42" },
      { k: "Assumptions", v: "33" },
      { k: "Open questions", v: "28" },
    ],
  },
  {
    title: "Last compile",
    items: [{ k: "Timestamp", v: "2026-10-04 03:14 UTC" }],
  },
];

const SIGNALS = [
  {
    icon: <TrendingUp className="size-4 text-emerald-300" />,
    title: "Volume up 9%",
    subtitle: "Delta Biochar float deepening on the tape.",
    time: "2 min ago",
  },
  {
    icon: <AlertTriangle className="size-4 text-amber-300" />,
    title: "Methodology revision",
    subtitle: "VCS REDD+ draft is moving the reference rate.",
    time: "14 min ago",
  },
  {
    icon: <ShieldCheck className="size-4 text-emerald-300" />,
    title: "Offtake locked",
    subtitle: "Municipal buyer pre-committed 12k t for 2027.",
    time: "1 h ago",
  },
];

export default function DashboardShell() {
  const { isAuthenticated, user } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const active =
    NAV.find(
      (n) =>
        location.pathname === n.href || location.pathname.startsWith(`${n.href}/`),
    )?.name ?? "Portfolio";

  if (!isAuthenticated) {
    return (
      <div className="relative flex min-h-screen flex-col">
        <div className="pointer-events-none fixed inset-0 bg-grid opacity-40 [mask-image:radial-gradient(65%_55%_at_50%_35%,black,transparent)]" />
        <div className="pointer-events-none fixed left-1/2 top-1/4 size-[380px] -translate-x-1/2 rounded-full bg-primary/8 blur-[110px]" />
        <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-10">
          <Card className="w-full max-w-md border-border/80 bg-card/80 shadow-[0_20px_60px_-20px_oklch(0.8_0.2_155/0.2)] backdrop-blur-xl">
            <CardHeader className="text-center">
              <div className="flex justify-center">
                <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
                  <ShieldCheck className="size-5 text-muted-foreground" />
                </div>
              </div>
              <CardTitle className="text-xl">Sign in to continue</CardTitle>
              <CardDescription>This workspace only exposes the CarbonIQ portal to signed-in users.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Button className="w-full gap-2" asChild>
                <Link to="/auth?returnTo=/dashboard">
                  <Mail className="size-4" />
                  Sign in
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/auth?returnTo=/dashboard">
                  <Users className="size-4" />
                  Load demo workspace
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-clip">
      <div className="pointer-events-none fixed inset-0 bg-grid opacity-60 [mask-image:radial-gradient(70%_50%_at_50%_0%,black,transparent)]" />
      <div className="pointer-events-none fixed -left-44 top-1/3 size-[440px] rounded-full bg-primary/6 blur-[130px]" />
      <div className="pointer-events-none fixed -right-44 top-2/3 size-[440px] rounded-full bg-chart-2/5 blur-[130px]" />

      {/* mobile shell */}
      <div className="flex flex-col border-b border-border/60">
        <header className="flex items-center justify-between border-b border-border/60 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-3">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                  <Menu className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="top" className="flex flex-col h-full">
                <SheetHeader className="sr-only">
                  <SheetTitle>CarbonIQ navigation</SheetTitle>
                  <SheetDescription>Filter your workspace.</SheetDescription>
                </SheetHeader>
                <div className="flex flex-col gap-1">
                  {NAV.map((n) => (
                    <Link
                      key={n.name}
                      to={n.href}
                      className={cn(
                        "flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                        active === n.name
                          ? "border-primary/35 bg-primary/10 text-primary"
                          : "border-border/60 text-muted-foreground hover:border-border/90 hover:text-foreground",
                      )}
                    >
                      {n.icon}
                      {n.name}
                    </Link>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
            <Link to="/dashboard" className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-lg border border-primary/30 bg-primary/10">
                <ShieldCheck className="size-5 text-primary" />
              </div>
              <div>
                <div className="font-display text-lg font-bold tracking-tight">
                  Carbon<span className="text-primary">IQ</span>
                </div>
                <div className="num mt-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
                  Credit terminal
                </div>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <span className="num hidden text-xs text-muted-foreground sm:block">
              {user?.name ?? user?.email ?? "analyst"}
            </span>
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link to="/scans">
                <ScanSearch className="size-3.5" />
                Monitor
              </Link>
            </Button>
          </div>
        </header>
        <nav className="flex gap-1 overflow-x-auto px-4 py-2 sm:px-5">
          {NAV.map((n) => (
            <NavItem
              key={n.name}
              name={n.name}
              href={n.href}
              icon={n.icon}
              active={active === n.name}
            />
          ))}
        </nav>
      </div>

      <main className="relative mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        {/* page header */}
        <motion.section
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-wrap items-start justify-between gap-4"
        >
          <div>
            <div className="num text-[11px] font-medium uppercase tracking-[0.18em] text-primary">
              {active} · portfolio terminal
            </div>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Your carbon wallet
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              A live view of every position you own — valuation band, exposure, risk
              concentration, and the current threat picture across your ledger.
            </p>
          </div>
          <Button asChild>
            <Link to="/portfolio/new">
              <Plus className="size-4" /> Add credit
            </Link>
          </Button>
        </motion.section>

        {/* KPI strip */}
        <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="glass rounded-xl p-4"
            >
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground/70">{s.label}</div>
              <div className="num mt-1 text-xl font-bold tracking-tight">{s.value}</div>
              <div className="num mt-0.5 text-[11px] text-muted-foreground/70">{s.sub}</div>
            </motion.div>
          ))}
        </section>

        {/* two column: left portfolio, right live monitor */}
        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          {/* portfolio list */}
          <section className="lg:col-span-2 space-y-4">
            <div className="glass rounded-xl p-4">
              <div className="flex flex-wrap items-center gap-2">
                <ScanSearch className="size-4 text-muted-foreground/60" />
                <Input
                  placeholder="Search credits, ticker, country…"
                  className="border-border/70 bg-foreground/[0.03] pl-9 text-sm"
                />
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="size-3.5" /> Filter
                </Button>
              </div>

              <div className="mt-4 space-y-2">
                {scoredCredits.slice(0, 6).map((entry, rank) => {
                  const c = entry.credit;
                  const risk = entry.risk;
                  const up = c.priceChange >= 0;
                  const rec = risk.recommendation;
                  return (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: rank * 0.04 }}
                      className={cn(
                        "flex flex-wrap items-center gap-x-5 gap-y-3 rounded-xl border p-3.5 transition-colors hover:border-primary/30",
                        rec === "AVOID" && "border-red-400/25 bg-red-500/5",
                        rec === "BUY" && "border-emerald-300/25 bg-emerald-400/5",
                        rec === "NEGOTIATE" && "border-amber-300/25 bg-amber-400/5",
                      )}
                    >
                      <span className="num w-6 shrink-0 text-sm text-muted-foreground/60">
                        {String(rank + 1).padStart(2, "0")}
                      </span>
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <ScoreRing score={risk.score} tier={risk.tier} size={44} strokeWidth={4} />
                        <div className="min-w-0 flex-1">
                          <Link
                          to={`/credit/${c.id}`}
                          className="font-semibold tracking-tight transition-colors hover:text-primary"
                        >
                          {c.name}
                        </Link>
                          <div className="num text-[11px] text-muted-foreground/70">{c.id} · {c.registry}</div>
                        </div>
                      </div>
                      <div className="hidden w-28 shrink-0 md:block">
                        <div className="text-xs font-semibold text-foreground/90">{fmtMoney(c.price)}</div>
                        <div className={cn("num text-[11px]", up ? "text-emerald-400" : "text-red-400")}>
                          {fmtPct(c.priceChange)}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <RecommendationBadge rec={rec} size="sm" />
                        <Badge variant="outline" className="border-border/60 text-[10px]">
                          {risk.tier} · {risk.confidence}
                        </Badge>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* live monitor sidebar */}
          <aside className="space-y-4">
            <Card className="glass">
              <CardHeader className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-sm font-semibold">Live threat feed</CardTitle>
                <Badge variant="secondary" className="text-[10px] border-emerald-300/30 text-emerald-300">
                  <span className="relative flex size-1.5">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-300 opacity-70" />
                    <span className="relative inline-flex size-1.5 rounded-full bg-emerald-300" />
                  </span>
                  Live
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                {SIGNALS.map((s) => (
                  <div key={s.title} className="flex gap-3">
                    <div className={cn("shrink-0", s.icon.props.className)} />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-foreground/90">{s.title}</div>
                      <div className="num text-[11px] text-muted-foreground/70">{s.subtitle}</div>
                      <div className="num text-[10px] text-muted-foreground/50">{s.time}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-sm font-semibold">Risk decomposition</CardTitle>
                <Button variant="ghost" size="icon" className="text-muted-foreground">
                  <ChevronDown className="size-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {RISK_MAP &&
                  Object.entries(RISK_MAP).map(([key, map]) => {
                    const entry = scoredCredits[0].risk.breakdown.find((b) => b.key === key);
                    const value = entry?.value ?? 0;
                    return (
                      <div key={key} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground/80">{map.title}</span>
                          <span className={cn("num font-semibold", entry?.value && entry.value >= 70 ? "text-emerald-300" : "text-foreground/80")}>
                            {entry?.value ?? 0}
                          </span>
                        </div>
                        <Progress value={Math.min(value, 100)} className="h-1.5" />
                      </div>
                    );
                  })}
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-sm font-semibold">Portfolio scan</CardTitle>
                <Link to="/scans" className="num text-[11px] font-semibold text-primary hover:text-primary/80">
                  View all
                </Link>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground/70">
                {SCAN_SECTIONS.map((section) => (
                  <div key={section.title}>
                    <div className="font-medium text-foreground/60 uppercase tracking-wider">{section.title}</div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                      {section.items.map((item) => (
                        <div key={item.k} className="flex items-center gap-1.5">
                          <span className="num">{item.k}</span>
                          <span className="font-medium text-foreground/90">{item.v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </aside>
        </div>

        <Separator className="mt-8" />

        {/* scan detail summary */}
        <section className="grid gap-4 lg:grid-cols-3">
          {[
            { icon: <DollarSign className="size-4" />, label: "Net exposure", value: "$218.4K" },
            { icon: <ShieldCheck className="size-4" />, label: "Worst-case drawdown", value: "12.4%" },
            { icon: <Activity className="size-4" />, label: "30-day change", value: "+2.1%" },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.12 + i * 0.06 }}
              className="glass rounded-xl p-4"
            >
              <div className="flex items-center gap-2 text-muted-foreground/70">
                {s.icon}
                <span className="num text-xs uppercase tracking-wider">{s.label}</span>
              </div>
              <div className="num mt-1 text-xl font-bold tracking-tight">{s.value}</div>
            </motion.div>
          ))}
        </section>
      </main>

      <footer className="relative border-t border-border/60 py-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 text-xs text-muted-foreground/50 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary/40" />
            <span>CARBONIQ · financial intelligence, not investment advice</span>
          </div>
          <span className="num">PILOT BUILD · SAMPLE DATA · 68 SIGNAL TYPES</span>
        </div>
      </footer>
    </div>
  );
}

/* ------------------ recommendation badge (compact) ------------------ */

function RecommendationBadge({
  rec,
  size = "md",
}: {
  rec: "BUY" | "HOLD" | "NEGOTIATE" | "AVOID";
  size?: "sm" | "md";
}) {
  const styles: Record<string, string> = {
    BUY: "border-emerald-300/35 bg-emerald-400/12 text-emerald-300",
    HOLD: "border-lime-300/25 bg-lime-400/8 text-lime-300",
    NEGOTIATE: "border-amber-300/35 bg-amber-400/10 text-amber-300",
    AVOID: "border-red-400/35 bg-red-500/10 text-red-400",
  };
  const px = size === "sm" ? "px-1.5" : "px-2";
  const py = size === "sm" ? "py-0.5" : "py-0.5";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-bold tracking-[0.08em]",
        styles[rec],
        px,
        py,
      )}
    >
      {rec}
    </span>
  );
}

/* ------------------ risk factor card (granular attribute display) ------------------ */

export function RiskFactorCard({ credit }: { credit: Credit }) {
  const { breakdown } = assessRisk(credit);
  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <ShieldCheck className="size-4 text-primary" />
          Attribute profile
        </CardTitle>
        <CardDescription>Granular 0–100 scores across the six weighted factors.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {breakdown.map((b) => (
          <div key={b.key} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground/80">{b.label}</span>
              <span className="num font-semibold">{b.value}</span>
            </div>
            <Progress value={b.value} className="h-1.5" />
            <div className="num text-[10px] text-muted-foreground/50">
              ×{Math.round(b.weight * 100)}% of composite
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/* ------------------ comparable credits (same registry + vintage corridor) ------------------ */

export function ComparableCredits({ credit }: { credit: Credit }) {
  const comparable =
    scoredCredits.filter(
      (e) =>
        e.credit.registry === credit.registry &&
        e.credit.region === credit.region &&
        e.credit.id !== credit.id,
    ) || [];

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Radar className="size-4 text-primary" />
          Comparable credits
        </CardTitle>
        <CardDescription>
          Matched on registry, corridor, and vintage band against {comparable.length} peers.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {comparable.map((entry) => {
          const c = entry.credit;
          const risk = entry.risk;
          const up = c.priceChange >= 0;
          return (
            <div
              key={c.id}
              className="flex items-center justify-between gap-3 rounded-xl border p-3 transition-colors hover:border-primary/30"
            >
              <div className="min-w-0 flex-1">
                <Link
                          to={`/credit/${c.id}`}
                          className="font-semibold tracking-tight transition-colors hover:text-primary"
                        >
                          {c.name}
                        </Link>
                <div className="num text-[11px] text-muted-foreground/70">{c.id} · {c.type}</div>
                <div className="num text-xs text-muted-foreground/70">{fmtMoney(c.price)}</div>
              </div>
              <div className="text-right shrink-0">
                <div className={cn("num text-sm font-bold", up ? "text-emerald-400" : "text-red-400")}>
                  {fmtPct(c.priceChange)}
                </div>
                <div className="num text-[10px] text-muted-foreground/60">
                  FV {fmtMoney(risk.fairValue.point)}
                </div>
                <RecommendationBadge rec={risk.recommendation} size="sm" />
              </div>
            </div>
          );
        })}
        {comparable.length === 0 && (
          <div className="text-sm text-muted-foreground">No peers on file for this corridor.</div>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------ credit detail card (completeness + lifetime chain) ------------------ */

export function CreditDetailCard({ credit, risk }: { credit: Credit; risk: ReturnType<typeof assessRisk> }) {
  const [state, setState] = useState<
    "due diligence" | "valuation" | "stress" | "lifecycle" | "monitoring"
  >("due diligence");
  const { evidence, stresses, recommendation, recommendationWhy, sources, confidence } = risk;

  const dueDiligenceSteps = [
    { n: "01", title: "Registry reconciliation", body: "Issued volume, vintage set, and provider metadata are reconciled against the source ledger." },
    { n: "02", title: "Market tape read", body: "Recent trades, listed volume, and 30-day turnover are scanned for liquidity and price drift." },
    { n: "03", title: "Integrity evidence", body: "Project documents, verification reports, and satellite indices are correlated to the claim." },
    { n: "04", title: "Red flags", body: "Developer audit trails, eligibility drafts, and reversal buffers are checked for material gaps." },
  ];

  const lifecycleSteps = [
    { n: "01", title: "Due diligence", status: "Complete", note: "Evidence stack reviewed" },
    { n: "02", title: "Purchase", status: "Open", note: "Simulated — $0 commitment" },
    { n: "03", title: "Ledger entry", status: "Pending", note: "Awaiting confirmation" },
    { n: "04", title: "Monitoring", status: "Persistent", note: "Interval materializer" },
  ];

  return (
    <Card className="glass">
      <CardHeader className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle className="text-base font-bold tracking-tight">{credit.name}</CardTitle>
          <CardDescription>
            {credit.id} · {credit.registry} · {credit.type} · {credit.country}
          </CardDescription>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <RecommendationBadge rec={recommendation} />
          <Badge variant="outline" className="border-border/60 text-[10px] uppercase tracking-wider">
            {confidence} confidence
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* tab navigation */}
        <div className="flex flex-wrap gap-1 border-b border-border/60 pb-3">
          {[
            { id: "due diligence", label: "Due diligence", icon: <FileSearch className="size-4" /> },
            { id: "valuation", label: "Valuation", icon: <Scale className="size-4" /> },
            { id: "stress", label: "Stress tests", icon: <Gauge className="size-4" /> },
            { id: "lifecycle", label: "Lifecycle", icon: <Router className="size-4" /> },
            { id: "monitoring", label: "Monitoring", icon: <Activity className="size-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setState(tab.id as typeof state)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                state === tab.id
                  ? "border-primary/35 bg-primary/10 text-primary"
                  : "text-muted-foreground hover:border-border/90 hover:text-foreground",
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {state === "due diligence" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{recommendationWhy}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {dueDiligenceSteps.map((step) => (
                <div key={step.n} className="glass rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <span className="num text-xl font-bold text-primary/40">{step.n}</span>
                    <div>
                      <div className="font-medium text-sm text-foreground/90">{step.title}</div>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{step.body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="glass rounded-xl p-4">
              <h4 className="text-sm font-semibold mb-3">Evidence layer</h4>
              <EvidenceBar evidence={evidence} />
              <div className="mt-3 flex flex-wrap gap-1.5">
                {sources.map((s) => (
                  <span key={s} className="num rounded border border-border/70 bg-foreground/[0.03] px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {state === "valuation" && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="glass rounded-xl p-4">
                <div className="num text-[10px] uppercase tracking-wider text-muted-foreground/60">Market price</div>
                <div className="num mt-1 text-lg font-bold">{fmtMoney(credit.price)}</div>
              </div>
              <div className="glass rounded-xl p-4 border border-primary/25 bg-primary/5">
                <div className="num text-[10px] uppercase tracking-wider text-primary/80">Fair value (point)</div>
                <div className="num mt-1 text-lg font-bold text-primary">{fmtMoney(risk.fairValue.point)}</div>
                <div className="num text-xs text-muted-foreground/70">
                  band {fmtMoney(risk.fairValue.low)} – {fmtMoney(risk.fairValue.high)}
                </div>
              </div>
              <div className="glass rounded-xl p-4">
                <div className="num text-[10px] uppercase tracking-wider text-muted-foreground/60">Mispricing</div>
                <div className={cn("num mt-1 text-lg font-bold", recommendation === "AVOID" ? "text-amber-300" : "text-emerald-400")}>
                  {recommendation === "AVOID" ? "+" : ""}
                  {risk.mispricingPct.toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">
                  {risk.mispricingPct >= 0 ? "above fair value" : "below fair value"}
                </div>
              </div>
            </div>
            <div className="glass rounded-xl p-4">
              <h4 className="text-sm font-semibold mb-3">12-month price history</h4>
              <Sparkline data={credit.priceHistory} positive={credit.priceChange >= 0} width={560} height={110} />
            </div>
          </div>
        )}

        {state === "stress" && (
          <div className="space-y-3">
            {stresses.map((s, i) => (
              <motion.div
                key={s.name}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="flex items-center justify-between gap-3 rounded-xl border border-red-400/15 bg-red-500/[0.03] px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium">{s.name}</div>
                  <div className="num text-xs text-muted-foreground/70">{s.detail}</div>
                </div>
                <span className="num shrink-0 rounded-lg bg-red-400/10 px-3 py-1 text-xs font-bold text-red-300">
                  {s.impactPct}% impact
                </span>
              </motion.div>
            ))}
          </div>
        )}

        {state === "lifecycle" && (
          <div className="space-y-3">
            {lifecycleSteps.map((step) => (
              <div key={step.n} className="flex items-center gap-3 rounded-xl border border-border/60 bg-foreground/[0.02] px-4 py-3">
                <div className="flex shrink-0 items-center gap-2">
                  <span className="num text-sm font-bold">{step.n}</span>
                  <span
                    className={cn(
                      "rounded-lg px-2 py-0.5 text-[10px] font-bold",
                      step.status === "Complete"
                        ? "bg-emerald-400/15 text-emerald-300"
                        : step.status === "Open"
                        ? "bg-amber-400/15 text-amber-300"
                        : step.status === "Pending"
                        ? "bg-primary/15 text-primary"
                        : "bg-emerald-400/15 text-emerald-300",
                    )}
                  >
                    {step.status}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{step.title}</div>
                  <div className="num text-xs text-muted-foreground/60">{step.note}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {state === "monitoring" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              A periodic materiality checker pings the ledger every {2} seconds across price,
              volume, and monthly traded volume, and flags any drift beyond the tolerance.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: "Interval", value: "2.0s", sub: "deferred run" },
                { label: "Checks performed", value: "8", sub: "this round" },
                { label: "Alerts", value: "1", sub: "minimum severity" },
                { label: "Next run", value: "03:14:21", sub: "UTC" },
              ].map((s) => (
                <div key={s.label} className="glass rounded-xl p-4">
                  <div className="num text-[10px] uppercase tracking-wider text-muted-foreground/60">{s.label}</div>
                  <div className="num mt-1 text-lg font-bold">{s.value}</div>
                  <div className="num text-xs text-muted-foreground/60">{s.sub}</div>
                </div>
              ))}
            </div>
            <div className="glass rounded-xl p-4">
              <h4 className="text-sm font-semibold mb-2">Live activity feed</h4>
              <div className="space-y-2">
                {[
                  { time: "03:14:21", label: "Delta Biochar — volume +9%", detail: "30d turnover expanding; exit risk dropping." },
                  { time: "03:14:18", label: "Mekong Mangrove — price drift", detail: "Premium over fair value widening; NEGOTIATE flag." },
                  { time: "03:14:15", label: "Guatemala Highland — alert", detail: "Open audit finding; review status updated." },
                ].map((item) => (
                  <div key={item.time} className="flex gap-3">
                    <span className="num shrink-0 text-[10px] text-muted-foreground/50">{item.time}</span>
                    <div>
                      <div className="text-sm font-medium">{item.label}</div>
                      <div className="num text-xs text-muted-foreground/60">{item.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------ shared workspace navigation (all authenticated screens) ------------------ */

export function WorkspaceNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/75 backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link to="/dashboard" className="flex shrink-0 items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
            <ShieldCheck className="size-4" />
          </span>
          <span className="font-display text-base font-bold tracking-[0.08em]">
            CARBON<span className="text-primary">IQ</span>
          </span>
        </Link>

        <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {NAV.map((n) => {
            const active =
              location.pathname === n.href ||
              location.pathname.startsWith(`${n.href}/`);
            return (
              <Link
                key={n.name}
                to={n.href}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {n.icon}
                {n.name}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <span className="num hidden text-xs text-muted-foreground lg:block">
            {user?.name ?? user?.email ?? "analyst"}
          </span>
          <Button asChild size="sm" className="gap-1.5">
            <Link to="/portfolio/new">
              <Plus className="size-3.5" /> New trade
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={handleSignOut}
          >
            <LogOut className="size-3.5" />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
