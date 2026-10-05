import { useId, useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { fmtMoney, fmtPct, type Credit, type RiskAssessment } from "@/lib/credits";
import { cn } from "@/lib/utils";
import { RecommendationBadge, TierBadge } from "@/components/credit-visuals";

const EMERALD = "#6ee7b7";
const LIME = "#bef264";
const AMBER = "#fcd34d";
const RED = "#f87171";
const MUTED = "rgba(255,255,255,0.38)";
const GRID = "rgba(255,255,255,0.07)";

const TOOLTIP_STYLE = {
  backgroundColor: "#0d1a15",
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: 12,
  fontSize: 12,
  color: "#e8f5ee",
} as const;

function monthLabels(count: number): string[] {
  const now = new Date();
  const out: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push(d.toLocaleString("en-US", { month: "short" }));
  }
  return out;
}

function factorColor(value: number) {
  if (value >= 75) return EMERALD;
  if (value >= 60) return LIME;
  if (value >= 45) return AMBER;
  return RED;
}

/**
 * Graphical analytics for a single carbon-offer company: price vs fair value,
 * the six-factor risk profile, stress scenarios, the valuation bridge from
 * evidence anchor to market quote, and the evidence mix behind the numbers.
 */
export function CreditAnalyticsPanel({
  credit,
  risk,
  className,
}: {
  credit: Credit;
  risk: RiskAssessment;
  className?: string;
}) {
  const rawId = useId();
  const gradientId = `fv-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const up = credit.priceChange >= 0;

  const priceData = useMemo(() => {
    const labels = monthLabels(credit.priceHistory.length);
    return credit.priceHistory.map((price, i) => ({ month: labels[i], price }));
  }, [credit.priceHistory]);

  const factorData = risk.breakdown.map((b) => ({
    key: b.key,
    label: b.label,
    value: b.value,
    weight: Math.round(b.weight * 100),
  }));

  const stressData = risk.stresses.map((s) => ({
    name: s.name,
    detail: s.detail,
    impactPct: s.impactPct,
  }));

  const evidenceData = [
    { key: "verified", label: "Verified", name: "Verified", value: risk.evidence.verified, color: EMERALD },
    { key: "estimated", label: "Estimated", name: "Estimated", value: risk.evidence.estimated, color: LIME },
    { key: "assumed", label: "Assumed", name: "Assumed", value: risk.evidence.assumed, color: AMBER },
    { key: "uncertain", label: "Open", name: "Open questions", value: risk.evidence.uncertain, color: RED },
  ];
  const evidenceTotal = evidenceData.reduce((a, e) => a + e.value, 0) || 1;
  const verifiedShare = Math.round((risk.evidence.verified / evidenceTotal) * 100);

  const riskFactor = 0.4 + 0.6 * (risk.score / 100);
  const anchor = risk.fairValue.point / riskFactor;
  const bridgeData = [
    { name: "Evidence anchor", value: Math.round(anchor * 100) / 100, color: "rgba(255,255,255,0.32)" },
    { name: "Fair value", value: Math.round(risk.fairValue.point * 100) / 100, color: EMERALD },
    { name: "Market quote", value: credit.price, color: AMBER },
  ];

  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="num text-[11px] font-medium uppercase tracking-[0.18em] text-primary">
            Company analytics
          </div>
          <h3 className="mt-1 font-display text-xl font-bold tracking-tight">
            {credit.name}
          </h3>
          <div className="num mt-0.5 text-[11px] text-muted-foreground/70">
            {credit.id} · {credit.registry} · {credit.country} · {credit.type}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TierBadge tier={risk.tier} />
          <RecommendationBadge rec={risk.recommendation} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glass lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              Price vs risk-adjusted fair value
            </CardTitle>
            <CardDescription>
              12-month tape against the engine's fair-value band ({fmtMoney(risk.fairValue.low)}{" "}
              – {fmtMoney(risk.fairValue.high)}/t) and its point estimate.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[230px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={priceData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={up ? EMERALD : RED} stopOpacity={0.32} />
                      <stop offset="100%" stopColor={up ? EMERALD : RED} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="month"
                    tick={{ fill: MUTED, fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: GRID }}
                  />
                  <YAxis
                    domain={["auto", "auto"]}
                    tick={{ fill: MUTED, fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    width={46}
                    tickFormatter={(v: number) => `$${v}`}
                  />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(value) => [`${fmtMoney(Number(value))} / t`, "Market"]}
                    labelFormatter={(label) => `Month · ${label}`}
                  />
                  <ReferenceArea
                    y1={risk.fairValue.low}
                    y2={risk.fairValue.high}
                    fill={EMERALD}
                    fillOpacity={0.08}
                    strokeOpacity={0}
                  />
                  <ReferenceLine
                    y={risk.fairValue.point}
                    stroke={EMERALD}
                    strokeDasharray="4 4"
                    strokeOpacity={0.85}
                  />
                  <ReferenceLine y={credit.price} stroke={AMBER} strokeOpacity={0.85} />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke={up ? EMERALD : RED}
                    strokeWidth={2}
                    fill={`url(#${gradientId})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-muted-foreground/70">
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block h-0.5 w-4 rounded-full"
                  style={{ backgroundColor: up ? EMERALD : RED }}
                />
                Market price ·{" "}
                <span className={cn("num font-semibold", up ? "text-emerald-300" : "text-red-400")}>
                  {fmtMoney(credit.price)}
                </span>{" "}
                ({fmtPct(credit.priceChange)} 12m)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-4 rounded-sm bg-emerald-400/15" />
                Fair-value band
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block h-0.5 w-4 rounded-full"
                  style={{ backgroundColor: EMERALD, opacity: 0.85 }}
                />
                FV point · <span className="num font-semibold text-emerald-300">{fmtMoney(risk.fairValue.point)}</span>
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Risk factor profile</CardTitle>
            <CardDescription>
              The six weighted factors (0–100) behind the composite score of {risk.score}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[224px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={factorData}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
                >
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={118}
                    tick={{ fill: MUTED, fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(value, _name, item) => [
                      `${value}/100 · ${(item?.payload as { weight?: number } | undefined)?.weight ?? 0}% weight`,
                      "Score",
                    ]}
                  />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={10}>
                    {factorData.map((f) => (
                      <Cell key={f.key} fill={factorColor(f.value)} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Stress exposure</CardTitle>
            <CardDescription>
              Adverse scenarios and their impact on fair value, worst first.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stressData.length === 0 ? (
              <p className="py-10 text-center text-xs text-muted-foreground/60">
                No stress scenarios on file for this company.
              </p>
            ) : (
              <div className="h-[224px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stressData}
                    layout="vertical"
                    margin={{ top: 4, right: 24, left: 0, bottom: 4 }}
                  >
                    <XAxis
                      type="number"
                      domain={[(dataMin: number) => Math.min(-10, Math.floor(dataMin * 1.2)), 0]}
                      tick={{ fill: MUTED, fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: number) => `${v}%`}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={118}
                      tick={{ fill: MUTED, fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(value, _name, item) => [
                        `${value}%`,
                        (item?.payload as { detail?: string } | undefined)?.detail ?? "Impact",
                      ]}
                    />
                    <Bar dataKey="impactPct" radius={[6, 0, 0, 6]} barSize={12}>
                      {stressData.map((s) => (
                        <Cell key={s.name} fill={RED} fillOpacity={0.75} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Valuation bridge</CardTitle>
            <CardDescription>
              Evidence anchor → risk discount ×{riskFactor.toFixed(2)} → fair value vs the market
              quote.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[150px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={bridgeData}
                  layout="vertical"
                  margin={{ top: 4, right: 24, left: 0, bottom: 4 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={118}
                    tick={{ fill: MUTED, fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(value) => [`${fmtMoney(Number(value))} / t`, "Value"]}
                  />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={14}>
                    {bridgeData.map((b) => (
                      <Cell key={b.name} fill={b.color} fillOpacity={0.9} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-[11px] leading-5 text-muted-foreground/70">
              Market quote is{" "}
              <span
                className={cn(
                  "num font-semibold",
                  risk.mispricingPct > 4
                    ? "text-amber-300"
                    : risk.mispricingPct < -8
                      ? "text-emerald-300"
                      : "text-foreground/80",
                )}
              >
                {fmtPct(risk.mispricingPct)}
              </span>{" "}
              versus fair value — {risk.recommendationWhy}
            </p>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Evidence mix</CardTitle>
            <CardDescription>
              Verified facts vs estimates, assumptions and open questions behind the numbers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative h-[170px] w-[170px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={evidenceData}
                      dataKey="value"
                      nameKey="label"
                      innerRadius={52}
                      outerRadius={78}
                      paddingAngle={3}
                      strokeWidth={0}
                    >
                      {evidenceData.map((e) => (
                        <Cell key={e.key} fill={e.color} fillOpacity={0.88} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="num text-xl font-bold text-emerald-300">{verifiedShare}%</span>
                  <span className="text-[10px] text-muted-foreground/70">verified</span>
                </div>
              </div>
              <div className="min-w-[140px] flex-1 space-y-2">
                {evidenceData.map((e) => (
                  <div key={e.key} className="flex items-center justify-between gap-3 text-xs">
                    <span className="flex items-center gap-2 text-muted-foreground/80">
                      <span
                        className="inline-block size-2 rounded-full"
                        style={{ backgroundColor: e.color }}
                      />
                      {e.name}
                    </span>
                    <span className="num font-semibold">{e.value}</span>
                  </div>
                ))}
                <p className="pt-1 text-[11px] leading-5 text-muted-foreground/60">
                  {evidenceTotal} evidence inputs on file · {risk.confidence} confidence
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
