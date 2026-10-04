import { useState } from "react";
import { Link } from "react-router";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  Compass,
  Copy,
  FileSearch,
  Gauge,
  Globe,
  Landmark,
  LineChart,
  Loader2,
  MapPin,
  Maximize2,
  MoveRight,
  Notification,
  Palette,
  PenLine,
  PlayCircle,
  Plus,
  Radar,
  RefreshCw,
  Save,
  ScanSearch,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Terminal,
  TrendingUp,
  Trophy,
  User,
  Users,
  Wallet,
  X,
  Zap,
  Traffic,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import {
  assessRisk,
  CREDITS,
  fmtMoney,
  fmtPct,
  fmtTonnes,
  scoredCredits,
  type Credit,
} from "@/lib/credits";
import { cn } from "@/lib/utils";
import { RiskFactorCard, ComparableCredits, CreditDetailCard } from "@/components/dashboard-shell";

const SCAN_KINDS = [
  { id: "mispricing", label: "Mispricing radar", icon: <Radar className="size-4" /> },
  { id: "negotiation", label: "Negotiation intelligence", icon: <PenLine className="size-4" /> },
  { id: "portfolio", label: "Portfolio optimization", icon: <TrendingUp className="size-4" /> },
  { id: "fraud", label: "Fraud detection", icon: <ShieldCheck className="size-4" /> },
  { id: "whatif", label: "What-if simulator", icon: <PlayCircle className="size-4" /> },
  { id: "alerts", label: "Regulatory alerts", icon: <Notification className="size-4" /> },
  { id: "env", label: "Environmental / satellite", icon: <Globe className="size-4" /> },
  { id: "activity", label: "AI agent timeline", icon: <Sparkles className="size-4" /> },
  { id: "analytics", label: "Marketplace analytics", icon: <BarChart3 className="size-4" /> },
  { id: "nlp", label: "NLP financial terminal", icon: <Terminal className="size-4" /> },
  { id: "waterfall", label: "Valuation waterfall", icon: <Gauge className="size-4" /> },
  { id: "decomposition", label: "Risk decomposition", icon: <ArrowRight className="size-4" /> },
  { id: "graph", label: "Evidence graph", icon: <Code className="size-4" /> },
  { id: "heatmap", label: "Portfolio heatmap", icon: <LayoutDashboard className="size-4" /> },
  { id: "audit", label: "Transaction audit trail", icon: <FileSearch className="size-4" /> },
  { id: "receipt", label: "Digital ownership receipt", icon: <Star className="size-4" /> },
];

/* Placeholder view for the corridor-scans screen */
export default function CorridorScans() {
  const [active, setActive] = useState<typeof SCAN_KINDS[number]["id"]>("mispricing");
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md">
          <Card>
            <CardContent className="flex flex-col items-center py-10 text-center">
              <ShieldCheck className="size-10 text-primary/30" />
              <p className="mt-4 font-display text-lg font-semibold">Sign in required</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Corridor scans are a workspace-experience. Sign in to continue.
              </p>
              <Button className="mt-6" asChild>
                <Link to="/auth?returnTo=/scans">Sign in</Link>
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

      <div className="relative mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="num text-[11px] font-medium uppercase tracking-[0.18em] text-primary">
              Corridor scans
            </div>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Automated due diligence
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Select any credit and CarbonIQ runs the full evidence pipeline: registry
              reconciliation, market tape read, integrity evidence correlation, and red
              flag surfacing.
            </p>
          </div>
          <Button asChild>
            <Link to="/dashboard">
              <RefreshCw className="size-4" /> Re-scan corridor
            </Link>
          </Button>
        </header>

        <div className="mt-6 grid gap-5 lg:grid-cols-4">
          <div className="lg:col-span-1 space-y-3">
            <div className="glass rounded-xl p-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground/70">Active credit</div>
              <div className="mt-2 flex items-center gap-3">
                <ScoreRing score={scoredCredits[0].risk.score} tier={scoredCredits[0].risk.tier} size={48} strokeWidth={4} />
                <div>
                  <div className="font-semibold">{scoredCredits[0].credit.name}</div>
                  <div className="num text-xs text-muted-foreground/70">
                    {scoredCredits[0].credit.id} · {scoredCredits[0].credit.registry}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                {CREDITS.slice(0, 5).map((c) => {
                  const risk = assessRisk(c);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setActive(c.id as typeof active)}
                      className={cn(
                        "flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors",
                        active === c.id
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-border/60 text-muted-foreground hover:border-border",
                      )}
                    >
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            {/* scan tabs */}
            <Tabs value={active} onValueChange={(v) => setActive(v as typeof active)} className="grid gap-5 lg:grid-cols-3">
              <TabsList>
                {SCAN_KINDS.map((k) => (
                  <TabsTrigger key={k.id} value={k.id} className="flex items-center gap-2">
                    {k.icon}
                    {k.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {SCAN_KINDS.map((tab) => (
                <TabsContent key={tab.id} value={tab.id} className="mt-0 lg:col-span-3">
                  <div className="glass rounded-xl p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="font-display text-xl font-bold">{tab.label}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {tab.label === "Mispricing radar" && (
                            <>Inspects for premium/discount vs. quality-matched peers</>
                          )}
                          {tab.label === "Negotiation intelligence" && (
                            <>Defensible purchase range for the room</>
                          )}
                          {tab.label === "Portfolio optimization" && (
                            <>Re-balanced risk budget across holdings</>
                          )}
                          {tab.label === "Fraud detection" && (
                            <>Audits issuance, capitalization, and audit trails</>
                          )}
                          {tab.label === "What-if simulator" && (
                            <>Scenario on/offtake choice and volume</>
                          )}
                          {tab.label === "Regulatory alerts" && (
                            <>Methodology and eligibility change radar</>
                          )}
                          {tab.label === "Environmental / satellite" && (
                            <>Canopy, fire, and land-cover indicators</>
                          )}
                          {tab.label === "AI agent timeline" && (
                            <>Every signal, model, and human step</>
                          )}
                          {tab.label === "Marketplace analytics" && (
                            <>Trader flows, volume, and spread</>
                          )}
                          {tab.label === "NLP financial terminal" && (
                            <>Ask a question in plain language</>
                          )}
                          {tab.label === "Valuation waterfall" && (
                            <>Anchor → discounts → final band</>
                          )}
                          {tab.label === "Risk decomposition" && (
                            <>Which factor moves the score most</>
                          )}
                          {tab.label === "Evidence graph" && (
                            <>Why → what it rests on → how sure</>
                          )}
                          {tab.label === "Portfolio heatmap" && (
                            <>Concentration and risk by corridor</>
                          )}
                          {tab.label === "Transaction audit trail" && (
                            <>Every custody movement, immutable</>
                          )}
                          {tab.label === "Digital ownership receipt" && (
                            <>A shareable, verifiable receipt</>
                          )}
                          {tab.label === "Portfolio optimization" && (
                            <>Optimize exposure across credits</>
                          )}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        <Save className="size-4" /> Export report
                      </Button>
                    </div>

                    {/* Mispricing radar body */}
                    {tab.id === "mispricing" && (
                      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {scoredCredits.slice(0, 6).map((entry) => {
                          const c = entry.credit;
                          const risk = entry.risk;
                          const over = risk.mispricingPct >= 0;
                          return (
                            <Card key={c.id} className="glass">
                              <CardContent className="flex items-center justify-between p-4">
                                <div className="min-w-0 flex-1">
                                  <div className="font-semibold">{c.name}</div>
                                  <div className="num text-xs text-muted-foreground/70">{c.id}</div>
                                  <div className={cn("num text-sm font-bold", over ? "text-red-300" : "text-emerald-300")}>
                                    {fmtPct(risk.mispricingPct)}
                                  </div>
                                </div>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "ml-2",
                                    over ? "border-red-400/30 text-red-300" : "border-emerald-300/30 text-emerald-300",
                                  )}
                                >
                                  {over ? "Overpriced" : "Cheap"}
                                </Badge>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}

                    {/* Negotiation intelligence body */}
                    {tab.id === "negotiation" && (
                      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                          { label: "Target price", value: "$12.30" },
                          { label: "Floor", value: "$9.80" },
                          { label: "Deck price", value: "$11.40" },
                          { label: "Strategy", value: "Floor +20%" },
                        ].map((s) => (
                          <Card key={s.label} className="glass"><CardContent className="flex flex-col items-start justify-between p-4">
                              <div className="num text-xs uppercase tracking-wider text-muted-foreground/60">{s.label}</div>
                              <div className="num text-xl font-bold">{s.value}</div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}

                    {/* Portfolio optimization body */}
                    {tab.id === "portfolio" && (
                      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {[
                          { label: "Score", value: "76", sub: "weighted composite" },
                          { label: "Optimal max", value: "18%", sub: "by exposure" },
                          { label: "Current max", value: "42%", sub: "Delta Biochar" },
                          { label: "Drift", value: "24%" },
                        ].map((s) => (
                          <Card key={s.label} className="glass">
                            <CardContent className="p-4">
                              <div className="font-medium">{s.label}</div>
                              <div className="num mt-1 text-xl font-bold">{s.value}</div>
                              <div className="num text-xs text-muted-foreground/60">{s.sub}</div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}

                    {/* Fraud detection body */}
                    {tab.id === "fraud" && (
                      <div className="mt-4 space-y-3">
                        {[
                          { title: "Issuance check", result: "PASS", detail: "Ledger reconciles" },
                          { title: "Capitalization", result: "WARN", detail: "Outsized illiquid bucket" },
                          { title: "Audit trail", result: "FAIL", detail: "Gaps in developer logs" },
                          { title: "Record fixation", result: "PASS", detail: "Vintage set intact" },
                        ].map((s) => (
                          <div key={s.title} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-foreground/[0.02] px-4 py-3">
                            <div>
                              <div className="text-sm font-medium">{s.title}</div>
                              <div className="num text-xs text-muted-foreground/60">{s.detail}</div>
                            </div>
                            <Badge
                              variant={s.result === "PASS" ? "default" : "secondary"}
                              className={
                                s.result === "PASS"
                                  ? "border-emerald-300/35 text-emerald-300 bg-emerald-400/10"
                                  : "border-amber-300/30 text-amber-300 bg-amber-400/8"
                              }
                            >
                              {s.result}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* What-if simulator body */}
                    {tab.id === "whatif" && (
                      <div className="mt-4 space-y-4">
                        <div className="glass rounded-xl p-4">

                          <h4 className="text-sm font-semibold mb-3">Counterfactual sliders</h4>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                              <div className="num text-xs uppercase tracking-wider text-muted-foreground/60">Price shock</div>
                              <input type="range" className="mt-2 h-1 w-full cursor-pointer appearance-none rounded-full bg-foreground/15 accent-emerald-400" />
                            </div>
                            <div>
                              <div className="num text-xs uppercase tracking-wider text-muted-foreground/60">Offtake renewal</div>
                              <input type="range" className="mt-2 h-1 w-full cursor-pointer appearance-none rounded-full bg-foreground/15 accent-emerald-400" />
                            </div>
                            <div>
                              <div className="num text-xs uppercase tracking-wider text-muted-foreground/60">Volume taper</div>
                              <input type="range" className="mt-2 h-1 w-full cursor-pointer appearance-none rounded-full bg-foreground/15 accent-emerald-400" />
                            </div>
                            <div>
                              <div className="num text-xs uppercase tracking-wider text-muted-foreground/60">Methodology luck</div>
                              <input type="range" className="mt-2 h-1 w-full cursor-pointer appearance-none rounded-full bg-foreground/15 accent-emerald-400" />
                            </div>
                          </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3">
                          {["Base", "Worst", "Optimized"].map((s) => (
                            <Card key={s} className="glass">
                              <CardContent className="p-4">
                                <div className="num text-xs uppercase tracking-wider text-muted-foreground/60">{s}</div>
                                <div className="num mt-1 text-lg font-bold">{fmtMoney(12.40)}</div>
                                <div className="num text-xs text-muted-foreground/60">band {fmtMoney(10.60)} – {fmtMoney(14.90)}</div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Regulatory alerts body */}
                    {tab.id === "alerts" && (
                      <div className="mt-4 space-y-3">
                        {[
                          { level: "WARN", title: "VCS methodology development", detail: "Draft revision moves reference rate", time: "12 min ago" },
                          { level: "INFO", title: "ICVCM benchmarks", detail: "New core carbon principles public" },
                          { level: "CRITICAL", title: "Eligibility reconfiguration", detail: "Cookstove additionality criteria tightening", time: "1 h ago" },
                        ].map((s) => (
                          <div key={s.title} className="flex items-start gap-3 rounded-xl border border-border/60 bg-foreground/[0.02] px-4 py-3">
                            <Badge
                              variant={s.level === "CRITICAL" ? "destructive" : s.level === "WARN" ? "default" : "outline"}
                              className={cn(
                                "mt-0.5",
                                s.level === "CRITICAL" && "border-red-400/35 text-red-300 bg-red-400/10",
                                s.level === "WARN" && "border-amber-300/30 text-amber-300 bg-amber-400/8",
                              )}
                            >
                              {s.level}
                            </Badge>
                            <div>
                              <div className="text-sm font-medium">{s.title}</div>
                              <div className="num text-xs text-muted-foreground/60">{s.detail}</div>
                              <div className="num text-[10px] text-muted-foreground/50">{s.time}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Environmental / satellite body */}
                    {tab.id === "env" && (
                      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {[
                          { label: "Canopy", value: "87%", sub: "stable" },
                          { label: "Fire alerts", value: "2", sub: "ytd" },
                          { label: "Land cover", value: "142" },
                        ].map((s) => (
                          <Card key={s.label} className="glass">
                            <CardContent className="p-4">
                              <div className="font-medium">{s.label}</div>
                              <div className="num mt-1 text-xl font-bold">{s.value}</div>
                              <div className="num text-xs text-muted-foreground/60">{s.sub}</div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}

                    {/* AI agent timeline body */}
                    {tab.id === "activity" && (
                      <ScrollArea className="max-h-[320px]">
                        <div className="space-y-4">
                          {[
                            { time: "03:10:02", label: "Pipeline run", detail: "All 18 signals processed" },
                            { time: "03:09:58", label: "Evidence extraction", detail: "61 verified, 42 estimated" },
                            { time: "03:09:51", label: "Model inference", detail: "Fair value + stress ensemble" },
                            { time: "03:09:44", label: "Human review", detail: "Analyst sign-off queued" },
                          ].map((s) => (
                            <div key={s.time} className="flex gap-3">
                              <span className="num shrink-0 text-[10px] text-muted-foreground/50">{s.time}</span>
                              <div>
                                <div className="text-sm font-medium">{s.label}</div>
                                <div className="num text-xs text-muted-foreground/60">{s.detail}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}

                    {/* Marketplace analytics body */}
                    {tab.id === "analytics" && (
                      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {[
                          { label: "30d volume", value: "412K" },
                          { label: "Avg spread", value: "2.6%" },
                          { label: "Active traders", value: "18" },
                        ].map((s) => (
                          <Card key={s.label} className="glass">
                            <CardContent className="p-4">
                              <div className="font-medium">{s.label}</div>
                              <div className="num mt-1 text-xl font-bold">{s.value}</div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}

                    {/* NLP terminal body */}
                    {tab.id === "nlp" && (
                      <div className="mt-4 space-y-3">
                        <div className="glass rounded-xl p-4">
                          <Input
                            placeholder="Ask a question, e.g. which credit has the strongest integrity evidence?"
                            className="border-border/70 bg-foreground/[0.03] font-mono text-sm"
                          />
                          <Button variant="ghost" size="icon" className="mt-2">
                            <Send className="size-4" />
                          </Button>
                        </div>
                        <div className="glass rounded-xl p-4">
                          <p className="text-sm text-muted-foreground">
                            LLM response here: Muscogee project trades at a discount of 9.4% to the evidence
                            anchor, with verified delivery history and deep float. Recommend a target deck of
                            $11.40 against an asking of $12.30.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Valuation waterfall body */}
                    {tab.id === "waterfall" && (
                      <div className="mt-4 space-y-3">
                        {[
                          { label: "Market quote", value: "$12.40" },
                          { label: "Integrity haircut", value: "−6.1%" },
                          { label: "Liquidity haircut", value: "−3.2%" },
                          { label: "Regulatory haircut", value: "−1.8%" },
                          { label: "MRV haircut", value: "−2.3%" },
                          { label: "Fair value (point)", value: "$9.80" },
                          { label: "Fair value band", value: "$8.30 – $11.60" },
                        ].map((s, i) => (
                          <div key={s.label} className="flex items-center gap-3">
                            <span className="num shrink-0 w-32 text-sm">{s.label}</span>
                            <div className="grow">
                              <div className="num text-lg font-bold">{s.value}</div>
                              {i < 5 && <ChevronDown className="size-3 shrink-0 text-muted-foreground/40" />}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Risk decomposition body */}
                    {tab.id === "decomposition" && <RiskFactorCard credit={scoredCredits[0].credit} />}

                    {/* Evidence graph body */}
                    {tab.id === "graph" && (
                      <div className="mt-4 space-y-3">
                        {[
                          { label: "Reliability", value: 78, sub: "verified inputs" },
                          { label: "Independence", value: 71, sub: "alignment score" },
                          { label: "Transparency", value: 83, sub: "open by default" },
                          { label: "Provenance", value: 69, sub: "live feed" },
                        ].map((s) => (
                          <Card key={s.label} className="glass">
                            <CardContent className="p-4">
                              <div className="font-medium">{s.label}</div>
                              <Progress value={s.value} className="mt-2 h-2" />
                              <div className="num text-xs text-muted-foreground/60">{s.sub}</div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}

                    {/* Portfolio heatmap body */}
                    {tab.id === "heatmap" && (
                      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {[
                          { label: "Southeast Asia", exposure: 24, risk: 66 },
                          { label: "Latin America", exposure: 18, risk: 54 },
                          { label: "North America", exposure: 38, risk: 82 },
                          { label: "Africa", exposure: 12, risk: 61 },
                          { label: "Europe", exposure: 8, risk: 94 },
                        ].map((s) => (
                          <Card key={s.label} className="glass">
                            <CardContent className="p-4">
                              <div className="font-medium">{s.label}</div>
                              <div className="num mt-1 text-lg font-bold">{s.exposure}%</div>
                              <div className="num text-xs text-muted-foreground/60">risk {s.risk}</div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}

                    {/* Transaction audit trail body */}
                    {tab.id === "audit" && (
                      <ScrollArea className="max-h-[320px]">
                        <div className="space-y-2">
                          {[
                            { time: "03:14:01", label: "Delta Biochar", action: "Deposit +96.500 t", status: "settled" },
                            { time: "03:13:22", label: "Katingan Peatland", action: "Withdrawal −12.000 t", status: "pending" },
                            { time: "03:12:44", label: "Mekong Mangrove", action: "Deposit +22.300 t", status: "settled" },
                          ].map((s) => (
                            <div key={s.time} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-foreground/[0.02] px-4 py-3">
                              <div>
                                <div className="text-sm font-medium">{s.label}</div>
                                <div className="num text-xs text-muted-foreground/60">{s.action}</div>
                              </div>
                              <Badge
                                variant={s.status === "settled" ? "default" : "secondary"}
                                className={cn(
                                  s.status === "settled"
                                    ? "border-emerald-300/35 text-emerald-300 bg-emerald-400/10"
                                    : "border-amber-300/25 text-amber-300 bg-amber-400/8",
                                )}
                              >
                                {s.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}

                    {/* Digital ownership receipt body */}
                    {tab.id === "receipt" && (
                      <div className="glass rounded-xl p-5 space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Star className="size-5" />
                          </div>
                          <div>
                            <div className="font-semibold">Receipt — instant settlement</div>
                            <div className="num text-xs text-muted-foreground/70">ERC-721 style custody voucher</div>
                          </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {[
                            { label: "TXN ID", value: "0x9f2c…" },
                            { label: "Custody", value: "CarbonLedger" },
                            { label: "Beneficiary", value: "Mikael Reyes" },
                            { label: "Total", value: "$1,216.10" },
                          ].map((s) => (
                            <div key={s.label} className="rounded-xl border border-border/60 bg-foreground/[0.02] p-3">
                              <div className="num text-[10px] uppercase tracking-wider text-muted-foreground/60">{s.label}</div>
                              <div className="num mt-1 text-sm font-bold">{s.value}</div>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground/60">Verify on-chain · 3 encoders · 41 confirmations</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>
      </div>

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

/* Placeholder view for a transaction history / ledger screen */
export function LedgerScreen() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md">
          <Card>
            <CardContent className="flex flex-col items-center py-10 text-center">
              <ShieldCheck className="size-10 text-primary/30" />
              <p className="mt-4 font-display text-lg font-semibold">Sign in required</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Your verified ledger is a workspace feature. Sign in to continue.
              </p>
              <Button className="mt-6" asChild>
                <Link to="/auth?returnTo=/ledger">Sign in</Link>
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

      <div className="relative mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="num text-[11px] font-medium uppercase tracking-[0.18em] text-primary">Ledger</div>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">Credit custody ledger</h1>
            <p className="mt-2 text-sm text-muted-foreground">Every position, movement, and settlement in one immutable, auditable trail.</p>
          </div>
          <Button asChild>
            <Link to="/portfolio"><Plus className="size-4" /> Add credit</Link>
          </Button>
        </header>

        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <div className="glass rounded-xl p-4">
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="relative">
                  <ScanSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
                  <Input placeholder="Filter transaction…" className="border-border/70 bg-foreground/[0.03] pl-9 text-sm" />
                </div>
                <Button variant="outline" size="sm"><RefreshCw className="size-3.5" /> Refresh</Button>
                <Button variant="outline" size="sm"><MoveRight className="size-3.5" /> Export</Button>
                <Button variant="outline" size="sm"><Settings className="size-3.5" /> Settings</Button>
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground/60">
                      <th className="pb-3 font-medium">Txn</th>
                      <th className="pb-3 font-medium">Credit</th>
                      <th className="pb-3 font-medium">Amount</th>
                      <th className="pb-3 font-medium">Price</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { txn: "0x9f2c…", credit: "Delta Biochar", amount: "+96.500 t", price: "$96.50", status: "settled", time: "2026-10-04 03:14:01" },
                      { txn: "0x8b1a…", credit: "Katingan Peatland", amount: "−12.000 t", price: "$12.40", status: "pending", time: "2026-10-04 01:02:33" },
                      { txn: "0x7c3d…", credit: "Mekong Mangrove", amount: "+22.300 t", price: "$22.30", status: "settled", time: "2026-10-03 22:41:12" },
                      { txn: "0x6a4e…", credit: "Delta Biochar", amount: "+8.200 t", price: "$96.50", status: "settled", time: "2026-10-02 10:00:00" },
                    ].map((r) => (
                      <tr key={r.txn} className="border-t border-border/60 transition-colors hover:bg-foreground/[0.02]">
                        <td className="py-3 text-xs font-mono text-muted-foreground/70">{r.txn}</td>
                        <td className="py-3 font-medium">{r.credit}</td>
                        <td className={cn("py-3 num font-semibold", r.amount.startsWith("−") ? "text-red-300" : "text-emerald-300")}>{r.amount}</td>
                        <td className="py-3 num">{r.price}</td>
                        <td className="py-3">
                          <Badge
                            variant={r.status === "settled" ? "default" : "secondary"}
                            className={cn(
                              r.status === "settled"
                                ? "border-emerald-300/35 text-emerald-300 bg-emerald-400/10"
                                : "border-amber-300/25 text-amber-300 bg-amber-400/8",
                            )}
                          >
                            {r.status}
                          </Badge>
                        </td>
                        <td className="py-3 num text-xs text-muted-foreground/60">{r.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <Card className="glass">
              <CardHeader><CardTitle className="text-sm font-semibold">Portfolio value</CardTitle></CardHeader>
              <CardContent>
                <div className="num text-2xl font-bold">$384.1K</div>
                <div className="num text-xs text-muted-foreground/60">net exposure</div>
              </CardContent>
            </Card>
            <Card className="glass">
              <CardHeader><CardTitle className="text-sm font-semibold">Avg holding</CardTitle></CardHeader>
              <CardContent>
                <div className="num text-2xl font-bold">$32.0K</div>
                <div className="num text-xs text-muted-foreground/60">per position</div>
              </CardContent>
            </Card>
            <Card className="glass">
              <CardHeader><CardTitle className="text-sm font-semibold">Active</CardTitle></CardHeader>
              <CardContent>
                <div className="num text-2xl font-bold text-emerald-300">3</div>
                <div className="num text-xs text-muted-foreground/60">positions settling</div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>

      <footer className="relative border-t border-border/60 py-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 text-xs text-muted-foreground/50 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2"><ShieldCheck className="size-4 text-primary/40" /><span>CARBONIQ · financial intelligence, not investment advice</span></div>
          <span className="num">PILOT BUILD · SAMPLE DATA · 68 SIGNAL TYPES</span>
        </div>
      </footer>
    </div>
  );
}

/* Buy/sell wallet tile + lifecycle workspaces */
export function BuySellWorkspace() {
  const { isAuthenticated } = useAuth();
  const [phase, setPhase] = useState<"idle" | "chosen" | "execute" | "ledger">("idle");
  const [selected, setSelected] = useState<Credit | null>(null);

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md">
          <Card>
            <CardContent className="flex flex-col items-center py-10 text-center">
              <ShieldCheck className="size-10 text-primary/30" />
              <p className="mt-4 font-display text-lg font-semibold">Sign in required</p>
              <p className="mt-1 text-sm text-muted-foreground">Transfer simulation stays inside your workspace.</p>
              <Button className="mt-6" asChild><Link to="/auth?returnTo=/portfolio/new">Sign in</Link></Button>
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

      <div className="relative mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="num text-[11px] font-medium uppercase tracking-[0.18em] text-primary">{phase === "idle" ? "Buy" : phase === "execute" ? "Execute" : phase === "ledger" ? "Ledger" : "Three-step workflow"}</div>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {phase === "idle" ? "Buy" : phase === "execute" ? "Execute trade" : phase === "ledger" ? "Ledger" : "Lifecycle workflow"}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Simulated wallet and payment. No real money, real card, or real counterparty — the trade lands in your custody ledger the moment it clears.
            </p>
          </div>
          <Button
            onClick={() => {
              if (phase === "idle") { setSelected(scoredCredits[0].credit); setPhase("chosen"); }
              if (phase === "chosen") setPhase("execute");
              if (phase === "execute") setPhase("ledger");
            }}
            disabled={phase === "ledger"}
            className="gap-2"
          >
            {phase === "idle" && <Plus className="size-4" />}
            {phase === "chosen" && <Zap className="size-4" />}
            {phase === "execute" && <ShieldCheck className="size-4" />}
            {phase === "ledger" && <ListTodo className="size-4" />}
            {phase === "idle" ? "Open workflow" : phase === "chosen" ? "Confirm credit" : phase === "execute" ? "Sign simulated deal" : "View ledger"}
          </Button>

          {phase === "idle" && (
            <Card className="glass w-full max-w-md">
              <CardHeader><CardTitle className="text-sm font-semibold">Which credit?</CardTitle></CardHeader>
              <CardContent>
                <div className="mt-3 grid gap-2">
                  {scoredCredits.slice(0, 6).map((entry, i) => {
                    const c = entry.credit;
                    const risk = entry.risk;
                    const up = c.priceChange >= 0;
                    const rec = risk.recommendation;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => { setSelected(c); setPhase("chosen"); }}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                          rec === "AVOID" && "border-red-400/25 bg-red-500/5",
                          rec === "BUY" && "border-emerald-300/25 bg-emerald-400/5",
                          rec === "NEGOTIATE" && "border-amber-300/25 bg-amber-400/5",
                          "hover:border-primary/30",
                        )}
                      >
                        <ScoreRing score={risk.score} tier={risk.tier} size={36} strokeWidth={4} />
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold">{c.name}</div>
                          <div className="num text-xs text-muted-foreground/70">{c.id} · {c.registry}</div>
                        </div>
                        <RecommendationBadge rec={rec} size="sm" />
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {phase === "chosen" && (
            <div className="space-y-4">
              {selected && <CreditDetailCard credit={selected} risk={assessRisk(selected)} />}
              <div className="glass rounded-xl p-5">
                <h4 className="text-sm font-semibold mb-3">Wallet / payment simulation</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <div className="num text-xs uppercase tracking-wider text-muted-foreground/60">Available balance</div>
                    <div className="num mt-1 text-lg font-bold">$410.00</div>
                  </div>
                  <div>
                    <div className="num text-xs uppercase tracking-wider text-muted-foreground/60">Expected cost</div>
                    <div className="num mt-1 text-lg font-bold">{fmtMoney(selected?.price ?? 0)}</div>
                    <div className="num text-xs text-muted-foreground/60">per tonne</div>
                  </div>
                  <div className="sm:col-span-2">
                    <div className="num text-xs uppercase tracking-wider text-muted-foreground/60">Position</div>
                    <div className="num mt-1 text-lg font-bold">{selected ? fmtTonnes(selected.volumeAvailable) : "—"} t</div>
                  </div>
                </div>
                <div className="mt-4 flex gap-3">
                  <Button className="flex-1 gap-2" onClick={() => setPhase("execute")}>
                    <Zap className="size-4" /> Simulate transfer
                  </Button>
                  <Button variant="outline" onClick={() => setPhase("idle")}>
                    <X className="size-4" /> Change
                  </Button>
                </div>
              </div>
            </div>
          )}

          {phase === "execute" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Live ledger confirmation, then the position is hosted in your custody ledger with an immutable receipt.
              </p>
              <div className="glass rounded-xl p-5 space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  {["0.4s remaining", "0.8s", "1.0s"].map((s) => (
                    <div key={s} className="text-center">
                      <div className="num text-3xl font-bold text-primary">{s}</div>
                      <div className="num text-xs text-muted-foreground/60">clearing</div>
                    </div>
                  ))}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { label: "Txn hash", value: "0x9f2c…" },
                    { label: "Credit", value: selected?.id ?? "—" },
                    { label: "Amount", value: fmtTonnes(selected?.volumeAvailable ?? 0) },
                    { label: "Total", value: fmtMoney((selected?.price ?? 0) * (selected?.volumeAvailable ?? 0)) },
                    { label: "Fee", value: "0.00%" },
                    { label: "Suite", value: "CarbonLedger" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl border border-border/60 bg-foreground/[0.02] p-3">
                      <div className="num text-[10px] uppercase tracking-wider text-muted-foreground/60">{s.label}</div>
                      <div className="num mt-1 text-sm font-bold">{s.value}</div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <Button className="flex-1 gap-2" onClick={() => setPhase("ledger")}>
                    <ListTodo className="size-4" /> Open lifecycle
                  </Button>
                  <Button variant="outline" onClick={() => setPhase("chosen")}>
                    <RefreshCw className="size-4" /> Retry
                  </Button>
                </div>
              </div>
            </div>
          )}            {phase === "ledger" && (
              <div className="space-y-4">
                <LedgerScreen />
              </div>
            )}
          </header>
        </div>
      </div>

      <footer className="relative border-t border-border/60 py-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 text-xs text-muted-foreground/50 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2"><ShieldCheck className="size-4 text-primary/40" /><span>CARBONIQ · financial intelligence, not investment advice</span></div>
          <span className="num">PILOT BUILD · SAMPLE DATA · 68 SIGNAL TYPES</span>
        </div>
      </footer>
    </div>
  );
}

