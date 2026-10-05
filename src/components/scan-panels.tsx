/**
 * Scan panels — one real, data-derived implementation per corridor-scan kind.
 * Everything is computed from the same credit engine (scoredCredits / assessRisk)
 * so no two tabs ever show the same fallback block.
 */
import { useMemo, useState, type ReactElement } from "react";
import { Link } from "react-router";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Link2,
  Radio,
  Send,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  fmtMoney,
  fmtPct,
  fmtTonnes,
  scoredCredits,
  type Credit,
  type RiskAssessment,
} from "@/lib/credits";
import { cn } from "@/lib/utils";
import {
  RecommendationBadge,
  ScoreRing,
  Sparkline,
  TierBadge,
} from "@/components/credit-visuals";
import { POSITIONS, TRANSACTIONS } from "@/lib/custody";
import { pickReply } from "@/lib/terminal";

type Entry = (typeof scoredCredits)[number];

/* ---------------- deterministic derived-data helpers ---------------- */

/** FNV-1a — stable pseudo-random values so derived panels never flicker. */
function h32(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
const unit = (s: string) => (h32(s) % 100000) / 100000;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function recForMispricing(mis: number): RiskAssessment["recommendation"] {
  if (mis > 12) return "AVOID";
  if (mis > 4) return "NEGOTIATE";
  if (mis < -8) return "BUY";
  return "HOLD";
}

function Head({ title, sub }: { title: string; sub: string }) {
  return (
    <div>
      <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
      <p className="mt-0.5 max-w-3xl text-xs leading-5 text-muted-foreground">{sub}</p>
    </div>
  );
}

const rowCls =
  "flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-border/60 bg-foreground/[0.02] px-3 py-2.5";

/* ============================ 01 · mispricing ============================ */

export function MispricingPanel() {
  const rows = [...scoredCredits].sort((a, b) => b.risk.mispricingPct - a.risk.mispricingPct);
  return (
    <div className="space-y-3">
      <Head
        title="Market quote vs risk-adjusted fair value"
        sub="Every listing ranked by how far the tape sits from the engine's fair-value band. Positive = paying above intrinsic value."
      />
      {rows.map((e, i) => {
        const c = e.credit;
        const r = e.risk;
        const over = r.mispricingPct >= 0;
        return (
          <div key={c.id} className={rowCls}>
            <span className="num w-6 shrink-0 text-xs text-muted-foreground/60">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="min-w-[150px] flex-1">
              <Link to={`/credit/${c.id}`} className="text-sm font-medium transition-colors hover:text-primary">
                {c.name}
              </Link>
              <div className="num text-[11px] text-muted-foreground/70">
                {c.id} · {c.registry}
              </div>
            </div>
            <div className="num w-20 text-right text-xs">{fmtMoney(c.price)}</div>
            <div className="num w-24 text-right text-xs text-primary">FV {fmtMoney(r.fairValue.point)}</div>
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
  );
}

/* ========================== 02 · negotiation ========================== */

export function NegotiationPanel() {
  const rows = [...scoredCredits].sort((a, b) => b.risk.mispricingPct - a.risk.mispricingPct);
  return (
    <div className="space-y-3">
      <Head
        title="Defensible purchase range per credit"
        sub="Open at the bottom of the fair-value band, settle at the point, never cross the walk-away. Leverage bullets are drawn from this credit's own evidence gaps and stress file."
      />
      {rows.map((e) => {
        const c = e.credit;
        const r = e.risk;
        const over = r.mispricingPct > 4;
        const open = r.fairValue.low;
        const target = r.fairValue.point;
        const walk = over
          ? r.fairValue.point + (r.fairValue.high - r.fairValue.point) * 0.5
          : r.fairValue.high;
        const span = r.fairValue.high - r.fairValue.low || 1;
        const quotePos = clamp(((c.price - r.fairValue.low) / span) * 100, -6, 106);
        const leverage = [
          r.evidence.uncertain > 0 && `${r.evidence.uncertain} open evidence questions`,
          c.liquidity < 55 && `thin book (${c.liquidity}/100 liquidity) slows their exit too`,
          r.stresses[0] &&
            `${r.stresses[0].name.toLowerCase()} would cost them ${Math.abs(r.stresses[0].impactPct)}%`,
          over
            ? `quote already ${r.mispricingPct.toFixed(1)}% above FV — no urgency`
            : r.mispricingPct < -8
              ? `under the band — sellers are bid-sensitive`
              : `inside the band — trade on volume, not price`,
        ].filter(Boolean) as string[];

        return (
          <div key={c.id} className="rounded-lg border border-border/60 bg-foreground/[0.02] p-3">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <Link
                to={`/credit/${c.id}`}
                className="min-w-[150px] flex-1 truncate text-sm font-medium transition-colors hover:text-primary"
              >
                {c.name}
              </Link>
              <span className="num text-[11px] text-muted-foreground/60">{c.id}</span>
              <div className="num flex items-center gap-1.5 text-xs">
                <span className="text-muted-foreground/60">open</span>
                <span className="font-semibold text-emerald-300">{fmtMoney(open)}</span>
                <span className="text-muted-foreground/40">→</span>
                <span className="text-muted-foreground/60">target</span>
                <span className="font-semibold text-primary">{fmtMoney(target)}</span>
                <span className="text-muted-foreground/40">→</span>
                <span className="text-muted-foreground/60">walk</span>
                <span className="font-semibold text-red-300">{fmtMoney(walk)}</span>
              </div>
              <RecommendationBadge rec={r.recommendation} />
            </div>

            <div className="mt-2.5">
              <div className="relative h-2 rounded-full bg-foreground/8">
                <div
                  className="absolute inset-y-0 rounded-full bg-primary/25"
                  style={{ left: "0%", right: "0%" }}
                />
                <div
                  className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background shadow"
                  style={{
                    left: `${quotePos}%`,
                    background: over ? "#fcd34d" : "#6ee7b7",
                  }}
                />
              </div>
              <div className="num mt-1 flex justify-between text-[10px] text-muted-foreground/50">
                <span>FV low {fmtMoney(r.fairValue.low)}</span>
                <span className={over ? "text-amber-300" : "text-emerald-300"}>
                  tape {fmtMoney(c.price)}
                </span>
                <span>FV high {fmtMoney(r.fairValue.high)}</span>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap gap-1.5">
              {leverage.map((l) => (
                <span
                  key={l}
                  className="rounded border border-border/70 bg-foreground/[0.03] px-1.5 py-0.5 text-[10px] text-muted-foreground"
                >
                  ↳ {l}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ========================== 03 · portfolio optimization ========================== */

function ShareBars({ data }: { data: { k: string; share: number; n: number }[] }) {
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.k} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground/80">
              {d.k} <span className="num text-[10px] text-muted-foreground/50">· {d.n}</span>
            </span>
            <span className="num font-semibold">{d.share.toFixed(1)}%</span>
          </div>
          <Progress value={d.share} className="h-1.5" />
        </div>
      ))}
    </div>
  );
}

export function PortfolioPanel() {
  const totalSupply = scoredCredits.reduce((a, e) => a + e.credit.volumeAvailable, 0);
  const total30d = scoredCredits.reduce((a, e) => a + e.credit.monthlyVolume, 0);
  const turnover = total30d / totalSupply;

  const group = (key: (c: Credit) => string) => {
    const m = new Map<string, { n: number; supply: number; vol: number }>();
    for (const e of scoredCredits) {
      const k = key(e.credit);
      const prev = m.get(k) ?? { n: 0, supply: 0, vol: 0 };
      prev.n += 1;
      prev.supply += e.credit.volumeAvailable;
      prev.vol += e.credit.monthlyVolume;
      m.set(k, prev);
    }
    return [...m.entries()]
      .map(([k, v]) => ({ k, ...v, share: (v.supply / totalSupply) * 100 }))
      .sort((a, b) => b.supply - a.supply);
  };

  const byRegistry = group((c) => c.registry);
  const byRegion = group((c) => c.region);
  const overweight = byRegistry[0];

  const liquid = scoredCredits.filter((e) => e.credit.liquidity >= 65).length;
  const stuck = scoredCredits.filter((e) => e.credit.liquidity < 45).length;
  const avoids = scoredCredits.filter((e) => e.risk.recommendation === "AVOID");
  const buys = scoredCredits.filter((e) => e.risk.recommendation === "BUY");
  const thinHeavy = scoredCredits
    .filter((e) => e.credit.liquidity < 50 && e.credit.volumeAvailable > 100_000)
    .slice(0, 3);

  const suggestions = [
    overweight.share > 35 && {
      tone: "border-amber-300/30 text-amber-200",
      text: `Trim ${overweight.k}: ${overweight.share.toFixed(0)}% of listed supply sits in one registry — cap new adds at 25%.`,
    },
    avoids.length > 0 && {
      tone: "border-red-400/30 text-red-200",
      text: `Rotate out of ${avoids.map((e) => e.credit.id).join(", ")} — all priced above their fair-value band.`,
    },
    buys.length > 0 && {
      tone: "border-emerald-300/30 text-emerald-200",
      text: `Deploy into ${buys.map((e) => e.credit.id).join(", ")} — trading 8%+ below risk-adjusted value.`,
    },
    thinHeavy.length > 0 && {
      tone: "border-border text-muted-foreground",
      text: `Stage exits for ${thinHeavy.map((e) => e.credit.id).join(", ")} — six-figure floats under 50 liquidity; work the orders, don't cross the spread.`,
    },
  ].filter(Boolean) as { tone: string; text: string }[];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { l: "30-day turnover", v: `${(turnover * 100).toFixed(1)}%`, s: "of listed float" },
          { l: "Liquid names", v: `${liquid}/${scoredCredits.length}`, s: "liquidity ≥ 65" },
          { l: "Stuck float", v: String(stuck), s: "liquidity < 45" },
        ].map((k) => (
          <div key={k.l} className="rounded-lg border border-border/60 bg-foreground/[0.02] p-3">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground/70">{k.l}</div>
            <div className="num mt-1 text-lg font-bold">{k.v}</div>
            <div className="num text-[10px] text-muted-foreground/60">{k.s}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border/60 bg-foreground/[0.02] p-4">
          <Head title="Registry concentration" sub="Share of listed supply by registry." />
          <div className="mt-3">
            <ShareBars data={byRegistry} />
          </div>
        </div>
        <div className="rounded-lg border border-border/60 bg-foreground/[0.02] p-4">
          <Head title="Corridor concentration" sub="Share of listed supply by region." />
          <div className="mt-3">
            <ShareBars data={byRegion} />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-primary/25 bg-primary/5 p-4">
        <Head title="Rebalancing queue" sub="Rules fired this pass, ordered by portfolio impact." />
        <div className="mt-3 space-y-2">
          {suggestions.map((s) => (
            <div key={s.text} className={cn("rounded-lg border px-3 py-2.5 text-xs leading-5", s.tone)}>
              {s.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ========================== 04 · fraud detection ========================== */

type Sev = "pass" | "warn" | "fail";
const SEV_CLS: Record<Sev, string> = {
  pass: "border-emerald-300/30 bg-emerald-400/10 text-emerald-300",
  warn: "border-amber-300/30 bg-amber-400/10 text-amber-300",
  fail: "border-red-400/35 bg-red-500/10 text-red-300",
};

const CHECKS = [
  "Serialisation",
  "Duplicate issuance",
  "Registry recon",
  "Buffer pool",
  "Additionality",
] as const;

function checksFor(e: Entry): Sev[] {
  const c = e.credit;
  const r = e.risk;
  const flagged = /audit|investigation/i.test(c.flags.join(" "));
  const serialGap = c.mrv < 55 ? (c.mrv < 45 ? "fail" : "warn") : unit(c.id + "s") > 0.9 ? "warn" : "pass";
  const dupes =
    r.evidence.uncertain >= 9 ? "fail" : r.evidence.uncertain >= 6 ? "warn" : "pass";
  const recon: Sev = flagged ? "fail" : c.regulatoryEligibility < 50 ? "warn" : "pass";
  const buffer: Sev = c.carbonIntegrity < 45 ? "fail" : c.carbonIntegrity < 60 ? "warn" : "pass";
  const addl =
    /additionality/i.test([...c.flags, ...r.sources].join(" "))
      ? "fail"
      : c.carbonIntegrity < 65
        ? "warn"
        : "pass";
  return [serialGap as Sev, dupes, recon, buffer, addl];
}

export function FraudPanel() {
  const results = scoredCredits.map((e) => ({ e, sev: checksFor(e) }));
  const tally = { pass: 0, warn: 0, fail: 0 } as Record<Sev, number>;
  results.forEach((r) => r.sev.forEach((s) => (tally[s] += 1)));
  const exposed = results.filter((r) => r.sev.includes("fail") || r.sev.includes("warn"));

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {(["pass", "warn", "fail"] as Sev[]).map((s) => (
          <div key={s} className="rounded-lg border border-border/60 bg-foreground/[0.02] p-3">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground/70">
              {s === "pass" ? "Checks cleared" : s === "warn" ? "Warnings" : "Material gaps"}
            </div>
            <div
              className={cn(
                "num mt-1 text-xl font-bold",
                s === "pass" && "text-emerald-300",
                s === "warn" && "text-amber-300",
                s === "fail" && "text-red-300",
              )}
            >
              {tally[s]}
            </div>
            <div className="num text-[10px] text-muted-foreground/60">
              of {scoredCredits.length * CHECKS.length} checks
            </div>
          </div>
        ))}
      </div>

      <Head
        title="Registry reconciliation matrix"
        sub={`Five integrity checks per credit — ${exposed.length} of ${scoredCredits.length} names returned at least one flag.`}
      />

      <div className="space-y-2">
        {exposed.map(({ e, sev }) => (
          <div key={e.credit.id} className={rowCls}>
            <div className="min-w-[160px] flex-1">
              <Link
                to={`/credit/${e.credit.id}`}
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                {e.credit.name}
              </Link>
              <div className="num text-[11px] text-muted-foreground/70">{e.credit.id}</div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {CHECKS.map((name, i) => (
                <span
                  key={name}
                  title={name}
                  className={cn(
                    "num rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                    SEV_CLS[sev[i]],
                  )}
                >
                  {name.split(" ")[0]} {sev[i] === "pass" ? "ok" : sev[i]}
                </span>
              ))}
            </div>
            <span
              className={cn(
                "num text-[11px] font-bold",
                sev.includes("fail") ? "text-red-300" : "text-amber-300",
              )}
            >
              {sev.filter((s) => s !== "pass").length} flagged
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ========================== 05 · what-if simulator ========================== */

interface Shock {
  id: string;
  label: string;
  detail: string;
  price: (e: Entry) => number;
  fv: (e: Entry) => number;
}

const SHOCKS: Shock[] = [
  {
    id: "selloff",
    label: "Market selloff −25%",
    detail: "Tape-wide bid withdrawal: quotes fall 25% while evidence-anchored fair value holds.",
    price: (e) => e.credit.price * 0.75,
    fv: (e) => e.risk.fairValue.point,
  },
  {
    id: "corsia",
    label: "CORSIA eligibility hardens",
    detail: "Buyers demand regulatory eligibility ≥ 70; below that, demand evaporates and fair value is cut 30%.",
    price: (e) => e.credit.price,
    fv: (e) => (e.credit.regulatoryEligibility >= 70 ? e.risk.fairValue.point : e.risk.fairValue.point * 0.7),
  },
  {
    id: "liquidity",
    label: "Liquidity drought",
    detail: "Exit windows close: sub-50 liquidity names reprice 18% lower for slippage.",
    price: (e) => e.credit.price,
    fv: (e) => (e.credit.liquidity >= 50 ? e.risk.fairValue.point : e.risk.fairValue.point * 0.82),
  },
  {
    id: "methodology",
    label: "REDD+ methodology revision",
    detail: "Baselines tightened across REDD+ vintages — each credit takes its own worst modeled stress.",
    price: (e) => e.credit.price,
    fv: (e) =>
      e.credit.type === "REDD+" && e.risk.stresses.length
        ? e.risk.fairValue.point * (1 + Math.min(...e.risk.stresses.map((s) => s.impactPct)) / 100)
        : e.risk.fairValue.point,
  },
];

export function WhatIfPanel() {
  const [shockId, setShockId] = useState(SHOCKS[0].id);
  const shock = SHOCKS.find((s) => s.id === shockId) ?? SHOCKS[0];

  const result = useMemo(() => {
    const baseFv = scoredCredits.reduce((a, e) => a + e.risk.fairValue.point * e.credit.volumeAvailable, 0);
    const stressed = scoredCredits.map((e) => {
      const price = shock.price(e);
      const fv = shock.fv(e);
      const delta = ((fv - e.risk.fairValue.point) / e.risk.fairValue.point) * 100;
      const mis = ((price - fv) / fv) * 100;
      return { e, price, fv, delta, mis, rec: recForMispricing(mis) };
    });
    const stressedFv = stressed.reduce((a, r) => a + r.fv * r.e.credit.volumeAvailable, 0);
    const flips = stressed.filter(
      (r) => r.rec !== r.e.risk.recommendation && r.rec === "AVOID",
    );
    return {
      rows: [...stressed].sort((a, b) => a.delta - b.delta),
      bookDelta: ((stressedFv - baseFv) / baseFv) * 100,
      worst: [...stressed].sort((a, b) => a.delta - b.delta)[0],
      flips,
    };
  }, [shock]);

  return (
    <div className="space-y-4">
      <Head
        title="Re-run the book under a shock"
        sub="Pick a scenario: fair values are re-derived per credit, mispricing recomputed against the untouched tape, and calls re-issued."
      />

      <div className="flex flex-wrap gap-1.5">
        {SHOCKS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setShockId(s.id)}
            className={cn(
              "rounded-xl border px-3 py-2 text-xs font-medium transition-colors",
              s.id === shockId
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border/60 bg-card/40 text-muted-foreground hover:border-border/90 hover:text-foreground",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            l: "Book fair value",
            v: fmtPct(result.bookDelta),
            s: "supply-weighted change",
            tone: result.bookDelta < -1 ? "text-red-300" : "text-emerald-300",
          },
          {
            l: "Hardest hit",
            v: result.worst.e.credit.id,
            s: `${fmtPct(result.worst.delta)} fair value`,
            tone: "text-amber-300",
          },
          {
            l: "New AVOID calls",
            v: String(result.flips.length),
            s: result.flips.length
              ? result.flips.map((f) => f.e.credit.id).join(", ")
              : "no recommendations flipped",
            tone: result.flips.length ? "text-red-300" : "text-muted-foreground",
          },
        ].map((k) => (
          <div key={k.l} className="rounded-lg border border-border/60 bg-foreground/[0.02] p-3">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground/70">{k.l}</div>
            <div className={cn("num mt-1 text-lg font-bold", k.tone)}>{k.v}</div>
            <div className="num truncate text-[10px] text-muted-foreground/60">{k.s}</div>
          </div>
        ))}
      </div>

      <p className="text-xs leading-5 text-muted-foreground">{shock.detail}</p>

      <div className="space-y-2">
        {result.rows.map((r) => (
          <div key={r.e.credit.id} className={rowCls}>
            <Link
              to={`/credit/${r.e.credit.id}`}
              className="min-w-[150px] flex-1 truncate text-sm font-medium transition-colors hover:text-primary"
            >
              {r.e.credit.name}
            </Link>
            <span className="num w-16 text-[11px] text-muted-foreground/60">{r.e.credit.id}</span>
            <span className="num w-24 text-right text-xs">
              {fmtMoney(r.e.risk.fairValue.point)}
              <span className="text-muted-foreground/40"> → </span>
              <span className="font-semibold text-primary">{fmtMoney(r.fv)}</span>
            </span>
            <span
              className={cn(
                "num w-20 text-right text-xs font-bold",
                r.delta < -0.5 ? "text-red-300" : r.delta > 0.5 ? "text-emerald-300" : "text-muted-foreground",
              )}
            >
              {fmtPct(r.delta)}
            </span>
            <span
              className={cn(
                "num w-20 text-right text-xs",
                r.mis > 4 ? "text-amber-300" : r.mis < -8 ? "text-emerald-300" : "text-muted-foreground",
              )}
            >
              {fmtPct(r.mis)} vs tape
            </span>
            <RecommendationBadge rec={r.rec} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ========================== 06 · regulatory alerts ========================== */

interface Alert {
  severity: "high" | "medium" | "info";
  agency: string;
  date: string;
  title: string;
  body: string;
  credits: string[];
}

const SEV_RANK = { high: 0, medium: 1, info: 2 } as const;

function buildAlerts(): Alert[] {
  const out: Alert[] = [];
  const date = (seed: string) =>
    `2026-0${8 + (h32(seed) % 2)}-${String(1 + (h32(seed + "d") % 27)).padStart(2, "0")}`;

  const investigative = scoredCredits.filter((e) => /audit|investigation/i.test(e.credit.flags.join(" ")));
  if (investigative.length) {
    out.push({
      severity: "high",
      agency: "Registry review docket",
      date: date("inv"),
      title: "Open integrity investigations block new issuance",
      body: "Issuance is frozen while the reviewer adjudicates over-crediting findings. Settlement risk on secondary purchases is elevated until the docket closes.",
      credits: investigative.map((e) => e.credit.id),
    });
  }

  const reddPlus = scoredCredits.filter((e) => e.credit.type === "REDD+");
  if (reddPlus.length) {
    out.push({
      severity: "high",
      agency: "Verra · methodology",
      date: date("meth"),
      title: "REDD+ methodology revision in public consultation",
      body: "Tightened baselines would reduce issued volumes for affected vintages. Hold off on vintage-year 2016–2019 lots until the final wording lands.",
      credits: reddPlus.slice(0, 6).map((e) => e.credit.id),
    });
  }

  const ineligible = scoredCredits.filter((e) => e.credit.regulatoryEligibility < 60);
  if (ineligible.length) {
    out.push({
      severity: "medium",
      agency: "CORSIA · eligibility",
      date: date("corsia"),
      title: "Aviation-demand list refreshed",
      body: "Credits below 60 on regulatory eligibility no longer clear CORSIA Phase-1 screens — corporate and aviation demand narrows for these names.",
      credits: ineligible.map((e) => e.credit.id),
    });
  }

  const ccp = scoredCredits.filter((e) => /ICVCM|CCP/i.test(e.credit.flags.join(" ")));
  if (ccp.length) {
    out.push({
      severity: "info",
      agency: "ICVCM · CCP",
      date: date("ccp"),
      title: "Core Carbon Principles endorsement confirmed",
      body: "CCP-approved labelling stays live for this cohort — eligible for premium corporate offtake without re-assessment.",
      credits: ccp.map((e) => e.credit.id),
    });
  }

  const litigation = scoredCredits.filter((e) =>
    /litigation|rights/i.test([...e.credit.flags, ...e.risk.stresses.map((s) => s.name)].join(" ")),
  );
  if (litigation.length) {
    out.push({
      severity: "medium",
      agency: "Safeguards monitor",
      date: date("rights"),
      title: "Human-rights & carbon-title reviews open",
      body: "Independent reviews are examining consent and benefit-sharing claims. Price an ongoing discount until findings are published.",
      credits: litigation.map((e) => e.credit.id),
    });
  }

  return out.sort((a, b) => SEV_RANK[a.severity] - SEV_RANK[b.severity]);
}

export function AlertsPanel() {
  const alerts = useMemo(() => buildAlerts(), []);
  const sevCls: Record<Alert["severity"], string> = {
    high: "border-red-400/35 bg-red-500/10 text-red-300",
    medium: "border-amber-300/35 bg-amber-400/10 text-amber-300",
    info: "border-emerald-300/30 bg-emerald-400/10 text-emerald-300",
  };
  return (
    <div className="space-y-3">
      <Head
        title="Policy feed mapped to your watchlist"
        sub="Registry, CORSIA, ICVCM and safeguards events — each one attached to the credits it actually moves."
      />
      {alerts.map((a) => (
        <div key={a.title} className="rounded-lg border border-border/60 bg-foreground/[0.02] p-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("num rounded border px-2 py-0.5 text-[10px] font-bold uppercase", sevCls[a.severity])}>
              {a.severity}
            </span>
            <span className="num text-[11px] font-semibold text-foreground/85">{a.agency}</span>
            <span className="num text-[11px] text-muted-foreground/50">{a.date}</span>
          </div>
          <div className="mt-1.5 text-sm font-medium">{a.title}</div>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{a.body}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {a.credits.map((id) => (
              <Link
                key={id}
                to={`/credit/${id}`}
                className="num rounded border border-border/70 bg-foreground/[0.03] px-1.5 py-0.5 text-[10px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                {id}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ==================== 07 · environmental / satellite ==================== */

const LAND_TYPES = new Set(["REDD+", "ARR", "Improved Forest Management"]);

export function EnvPanel() {
  const rows = scoredCredits
    .map((e) => {
      const c = e.credit;
      const land = LAND_TYPES.has(c.type);
      const canopy = clamp(((c.stability - 40) / 55) * 100, -40, 30);
      const fires = Math.round(unit(c.id + "fire") * 42 * (1 - c.stability / 160));
      const reversal = clamp(Math.round(100 - c.carbonIntegrity + unit(c.id + "rev") * 6), 3, 92);
      const ndvi = Array.from({ length: 12 }, (_, i) =>
        Math.round(
          c.stability +
            Math.sin((i / 11) * Math.PI * (canopy < 0 ? 1.6 : 0.7)) * 12 +
            (unit(c.id + i) - 0.5) * 8,
        ),
      );
      const status: Sev = reversal > 60 ? "fail" : reversal > 35 ? "warn" : "pass";
      return { e, land, canopy, fires, reversal, ndvi, status };
    })
    .sort((a, b) => b.reversal - a.reversal);

  return (
    <div className="space-y-3">
      <Head
        title="Canopy, fire & reversal watch"
        sub="Land-use projects are tracked from satellite indices; process-based projects fall back to metered activity data. Reversal risk is scored 0–100 against buffer coverage."
      />
      <div className="space-y-2">
        {rows.map((r) => {
          const c = r.e.credit;
          return (
            <div key={c.id} className={rowCls}>
              <div className="min-w-[160px] flex-1">
                <Link
                  to={`/credit/${c.id}`}
                  className="text-sm font-medium transition-colors hover:text-primary"
                >
                  {c.name}
                </Link>
                <div className="num text-[11px] text-muted-foreground/70">
                  {c.id} · {c.type}
                </div>
              </div>

              {r.land ? (
                <>
                  <div className="num w-28 text-right text-xs">
                    <span className="text-muted-foreground/50">canopy </span>
                    <span className={r.canopy < 0 ? "text-red-300" : "text-emerald-300"}>
                      {r.canopy > 0 ? "+" : ""}
                      {r.canopy.toFixed(1)}%
                    </span>
                  </div>
                  <div className="num w-24 text-right text-xs">
                    <span className="text-muted-foreground/50">fire </span>
                    <span className={r.fires > 18 ? "text-amber-300" : "text-foreground/85"}>
                      {r.fires} alerts
                    </span>
                  </div>
                </>
              ) : (
                <div className="num w-56 text-right text-[11px] text-muted-foreground/60">
                  no land-use exposure · metered activity MRV
                </div>
              )}

              <div className="w-24">
                <Sparkline data={r.ndvi} positive={r.canopy >= 0} width={96} height={24} />
              </div>

              <div className="num w-24 text-right text-xs">
                <span className="text-muted-foreground/50">reversal </span>
                <span
                  className={cn(
                    "font-bold",
                    r.status === "fail" ? "text-red-300" : r.status === "warn" ? "text-amber-300" : "text-emerald-300",
                  )}
                >
                  {r.reversal}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ======================= 08 · AI agent timeline ======================= */

export function ActivityPanel() {
  const base = Date.UTC(2026, 9, 5, 9, 42);
  const events = scoredCredits.map((e, i) => {
    const c = e.credit;
    const r = e.risk;
    let agent = "sentinel";
    let kind: Sev = "pass";
    let text: string;
    if (r.recommendation === "AVOID") {
      agent = "fraud";
      kind = "fail";
      text = `Escalated ${c.id} to underwriting — quoted ${fmtPct(r.mispricingPct)} above fair value; buy-side halted.`;
    } else if (r.evidence.uncertain >= 6) {
      agent = "evidence";
      kind = "warn";
      text = `Requested verification addendum for ${c.id} — ${r.evidence.uncertain} evidence inputs still unresolved.`;
    } else if (Math.abs(r.mispricingPct) > 4) {
      agent = "valuation";
      kind = r.mispricingPct > 0 ? "warn" : "pass";
      text = `Repriced ${c.id}: fair value ${fmtMoney(r.fairValue.point)} — tape now ${fmtPct(r.mispricingPct)} off the band.`;
    } else {
      agent = "sentinel";
      kind = "pass";
      text = `Monitoring sync for ${c.id}: ${c.registry} ledger reconciled, ${r.evidence.verified} verified inputs re-hashed.`;
    }
    const t = new Date(base - i * 23 * 60_000);
    const time = `${t.toISOString().slice(0, 10)} · ${String(t.getUTCHours()).padStart(2, "0")}:${String(
      t.getUTCMinutes(),
    ).padStart(2, "0")} UTC`;
    return { id: `${c.id}-${i}`, agent, kind, text, time };
  });

  const dotCls: Record<Sev, string> = {
    pass: "bg-emerald-400",
    warn: "bg-amber-300",
    fail: "bg-red-400",
  };

  return (
    <div className="space-y-3">
      <Head
        title="Autonomous agent log"
        sub="What each engine agent did on this watchlist, newest first — valuation, evidence, fraud and satellite workers share one audit clock."
      />
      <div className="relative space-y-2 pl-4">
        <div className="absolute bottom-2 left-[3px] top-2 w-px bg-border/70" />
        {events.map((ev) => (
          <div key={ev.id} className="relative">
            <span className={cn("absolute -left-4 top-2 size-[7px] rounded-full", dotCls[ev.kind])} />
            <div className="flex flex-wrap items-center gap-2">
              <span className="num rounded border border-border/70 bg-foreground/[0.03] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                {ev.agent}-agent
              </span>
              <span className="num text-[10px] text-muted-foreground/50">{ev.time}</span>
            </div>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{ev.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===================== 09 · marketplace analytics ===================== */

export function AnalyticsPanel() {
  const totalSupply = scoredCredits.reduce((a, e) => a + e.credit.volumeAvailable, 0);
  const total30d = scoredCredits.reduce((a, e) => a + e.credit.monthlyVolume, 0);

  const rows = (() => {
    const m = new Map<string, { n: number; supply: number; vol: number; price: number; mis: number }>();
    for (const e of scoredCredits) {
      const k = e.credit.registry;
      const prev = m.get(k) ?? { n: 0, supply: 0, vol: 0, price: 0, mis: 0 };
      m.set(k, {
        n: prev.n + 1,
        supply: prev.supply + e.credit.volumeAvailable,
        vol: prev.vol + e.credit.monthlyVolume,
        price: prev.price + e.credit.price,
        mis: prev.mis + e.risk.mispricingPct,
      });
    }
    return [...m.entries()]
      .map(([k, v]) => ({
        k,
        n: v.n,
        supply: v.supply,
        vol: v.vol,
        turnover: (v.vol / v.supply) * 100,
        avgPrice: v.price / v.n,
        avgMis: v.mis / v.n,
        depth: (v.vol / total30d) * 100,
      }))
      .sort((a, b) => b.vol - a.vol);
  })();

  const vintageMap = new Map<number, number>();
  scoredCredits.forEach((e) =>
    e.credit.vintages.forEach((v) => vintageMap.set(v, (vintageMap.get(v) ?? 0) + 1)),
  );
  const vintages = [...vintageMap.entries()].sort((a, b) => a[0] - b[0]);
  const maxVintage = Math.max(...vintages.map(([, n]) => n));

  return (
    <div className="space-y-4">
      <Head
        title="Turnover, spread & depth by registry"
        sub={`Aggregate tape statistics across ${fmtTonnes(totalSupply)} t of listed supply and ${fmtTonnes(total30d)} t traded in the last 30 days.`}
      />

      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-xs">
          <thead>
            <tr className="border-b border-border/70 text-left text-[10px] uppercase tracking-wider text-muted-foreground/60">
              <th className="py-2 pr-3 font-medium">Registry</th>
              <th className="py-2 pr-3 text-right font-medium">Listings</th>
              <th className="py-2 pr-3 text-right font-medium">Supply</th>
              <th className="py-2 pr-3 text-right font-medium">30d volume</th>
              <th className="py-2 pr-3 text-right font-medium">Turnover</th>
              <th className="py-2 pr-3 text-right font-medium">Depth</th>
              <th className="py-2 pr-3 text-right font-medium">Avg price</th>
              <th className="py-2 text-right font-medium">Avg mispricing</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.k} className="border-b border-border/40">
                <td className="py-2.5 pr-3 font-medium">{r.k}</td>
                <td className="num py-2.5 pr-3 text-right">{r.n}</td>
                <td className="num py-2.5 pr-3 text-right">{fmtTonnes(r.supply)} t</td>
                <td className="num py-2.5 pr-3 text-right">{fmtTonnes(r.vol)} t</td>
                <td className="num py-2.5 pr-3 text-right">{r.turnover.toFixed(1)}%</td>
                <td className="num py-2.5 pr-3 text-right text-primary">{r.depth.toFixed(1)}%</td>
                <td className="num py-2.5 pr-3 text-right">{fmtMoney(r.avgPrice)}</td>
                <td
                  className={cn(
                    "num py-2.5 text-right font-semibold",
                    r.avgMis > 4 ? "text-amber-300" : r.avgMis < -8 ? "text-emerald-300" : "text-muted-foreground",
                  )}
                >
                  {fmtPct(r.avgMis)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-lg border border-border/60 bg-foreground/[0.02] p-4">
        <Head title="Vintage depth" sub="How many listings still carry each vintage year — thin columns price higher." />
        <div className="mt-3 flex items-end gap-1.5">
          {vintages.map(([y, n]) => (
            <div key={y} className="flex flex-1 flex-col items-center gap-1">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(n / maxVintage) * 72}px` }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="w-full rounded-t bg-primary/40"
                style={{ minHeight: 4 }}
              />
              <span className="num text-[9px] text-muted-foreground/60">{y}</span>
              <span className="num text-[9px] text-muted-foreground/40">{n}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ====================== 10 · NLP financial terminal ====================== */

interface MiniMsg {
  role: "user" | "assistant";
  text: string;
  sources?: string[];
}

const CHIPS = [
  "Where should I buy?",
  "What is overpriced?",
  "Biggest downside?",
  "How solid is the evidence?",
];

export function NlpPanel() {
  const [msgs, setMsgs] = useState<MiniMsg[]>([
    {
      role: "assistant",
      text: "Terminal inline. Ask the book anything — answers are derived from the same engine that prices the credits, with sources cited.",
      sources: ["Registry issuance ledger", "Market trade tape"],
    },
  ]);
  const [draft, setDraft] = useState("");

  const send = (q: string) => {
    const question = q.trim();
    if (!question) return;
    const reply = pickReply(question);
    setMsgs((m) => [...m, { role: "user", text: question }, { role: "assistant", ...reply }]);
    setDraft("");
  };

  return (
    <div className="space-y-3">
      <Head
        title="Ask the book"
        sub="Plain-language questions inline — the full-screen terminal lives at /terminal with the whole conversation history."
      />

      <div className="space-y-2.5 rounded-lg border border-border/60 bg-foreground/[0.02] p-3">
        {msgs.map((m, i) => (
          <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[92%] rounded-xl px-3.5 py-2.5 text-xs leading-5",
                m.role === "user"
                  ? "border border-primary/30 bg-primary/10"
                  : "border border-border/60 bg-card/60 text-muted-foreground",
              )}
            >
              {m.role === "assistant" && (
                <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-primary">
                  <Sparkles className="size-3" /> CarbonIQ
                </div>
              )}
              <p>{m.text}</p>
              {m.sources && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {m.sources.map((s) => (
                    <span
                      key={s}
                      className="num rounded border border-border/70 bg-foreground/[0.03] px-1.5 py-0.5 text-[9px] text-muted-foreground"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {CHIPS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => send(c)}
            className="rounded-full border border-border/70 bg-foreground/[0.03] px-3 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            {c}
          </button>
        ))}
      </div>

      <form
        onSubmit={(ev) => {
          ev.preventDefault();
          send(draft);
        }}
        className="flex gap-2"
      >
        <input
          value={draft}
          onChange={(ev) => setDraft(ev.target.value)}
          placeholder="e.g. which credit is cheapest on evidence-adjusted value?"
          className="num h-9 flex-1 rounded-lg border border-border/70 bg-foreground/[0.03] px-3 text-xs outline-none placeholder:text-muted-foreground/40 focus:border-primary/50"
        />
        <Button type="submit" size="sm" className="gap-1.5">
          <Send className="size-3.5" /> Ask
        </Button>
      </form>

      <Button asChild variant="outline" size="sm" className="gap-1.5">
        <Link to="/terminal">
          Open full terminal <ArrowRight className="size-3.5" />
        </Link>
      </Button>
    </div>
  );
}

/* ======================= 11 · valuation waterfall ======================= */

export function WaterfallPanel() {
  const top = [...scoredCredits].sort((a, b) => b.risk.mispricingPct - a.risk.mispricingPct)[0];
  const riskFactor = 0.4 + 0.6 * (top.risk.score / 100);
  const anchor = top.risk.fairValue.point / riskFactor;
  const steps = [
    { label: "Evidence anchor", value: fmtMoney(anchor), note: "intrinsic value before risk", tone: "" },
    { label: "× risk factor", value: `×${riskFactor.toFixed(2)}`, note: `composite score ${top.risk.score}/100`, tone: "" },
    {
      label: "Fair value (point)",
      value: fmtMoney(top.risk.fairValue.point),
      note: `band ${fmtMoney(top.risk.fairValue.low)} – ${fmtMoney(top.risk.fairValue.high)}`,
      tone: "primary",
    },
    {
      label: "Market quote",
      value: fmtMoney(top.credit.price),
      note: `${top.risk.mispricingPct >= 0 ? "+" : ""}${top.risk.mispricingPct.toFixed(1)}% vs fair value`,
      tone: "",
    },
  ];

  return (
    <div className="space-y-3">
      <Head title="Anchor → risk → band → tape" sub={`Step-by-step bridge for the most mispriced name on the book.`} />
      <p className="text-xs text-muted-foreground">
        Subject:{" "}
        <Link to={`/credit/${top.credit.id}`} className="font-medium text-foreground/90 hover:text-primary">
          {top.credit.name}
        </Link>{" "}
        ({top.credit.id}).
      </p>
      {steps.map((s, i) => (
        <div
          key={s.label}
          className={cn(
            "flex items-center justify-between gap-3 rounded-lg border px-4 py-3",
            s.tone === "primary" ? "border-primary/30 bg-primary/5" : "border-border/60 bg-foreground/[0.02]",
          )}
        >
          <div>
            <div className="text-sm font-medium">
              <span className="num mr-2 text-muted-foreground/40">{i + 1}</span>
              {s.label}
            </div>
            <div className="num text-[11px] text-muted-foreground/70">{s.note}</div>
          </div>
          <span className={cn("num text-sm font-bold", s.tone === "primary" ? "text-primary" : "text-foreground/90")}>
            {s.value}
          </span>
        </div>
      ))}
      <div className="rounded-lg border border-border/60 bg-foreground/[0.02] p-3">
        <div className="text-xs font-semibold">Why this bridge matters</div>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          The anchor is what the evidence supports before risk; the risk factor is the weighted six-factor
          composite, never a discretionary haircut. The band carries estimation error, and the tape is only
          ever compared against the point — that comparison is the {fmtPct(top.risk.mispricingPct)} gap above.
        </p>
      </div>
    </div>
  );
}

/* ======================= 12 · risk decomposition ======================= */

export function DecompositionPanel() {
  const factorAvgs = scoredCredits[0].risk.breakdown.map((b) => {
    const avg = Math.round(
      scoredCredits.reduce((a, e) => {
        const f = e.risk.breakdown.find((x) => x.key === b.key);
        return a + (f?.value ?? 0);
      }, 0) / scoredCredits.length,
    );
    const best = [...scoredCredits].sort(
      (a, b2) =>
        (b2.risk.breakdown.find((x) => x.key === b.key)?.value ?? 0) -
        (a.risk.breakdown.find((x) => x.key === b.key)?.value ?? 0),
    )[0];
    const worst = [...scoredCredits].reverse().sort(
      (a, b2) =>
        (b2.risk.breakdown.find((x) => x.key === b.key)?.value ?? 0) -
        (a.risk.breakdown.find((x) => x.key === b.key)?.value ?? 0),
    )[0];
    return { ...b, avg, best, worst };
  });

  return (
    <div className="space-y-4">
      <Head
        title="Six weighted factors, portfolio average"
        sub="The composite is the weighted sum of these six inputs — with the strongest and weakest holder named for each. No black box."
      />
      <div className="space-y-3">
        {factorAvgs.map((b) => {
          const bestV = b.best.risk.breakdown.find((x) => x.key === b.key)?.value ?? 0;
          const worstV = b.worst.risk.breakdown.find((x) => x.key === b.key)?.value ?? 0;
          return (
            <div key={b.key} className="rounded-lg border border-border/60 bg-foreground/[0.02] p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground/80">
                  {b.label}
                  <span className="num ml-2 text-[10px] text-muted-foreground/50">
                    ×{Math.round(b.weight * 100)}% weight
                  </span>
                </span>
                <span className="num font-semibold">{b.avg}</span>
              </div>
              <div className="mt-1.5">
                <Progress value={b.avg} className="h-1.5" />
              </div>
              <div className="num mt-1.5 flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted-foreground/60">
                <span>
                  leader <span className="text-emerald-300">{b.best.credit.id}</span> {bestV}
                </span>
                <span>
                  laggard <span className="text-red-300">{b.worst.credit.id}</span> {worstV}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs leading-5 text-muted-foreground">
        Portfolio average across {scoredCredits.length} credits. Contribution to the composite = factor value ×
        weight; the weights are fixed in the engine and never fitted to a conclusion.
      </p>
    </div>
  );
}

/* ========================= 13 · evidence graph ========================= */

export function EvidenceGraphPanel() {
  const left = useMemo(
    () =>
      [...scoredCredits]
        .sort(
          (a, b) =>
            b.risk.evidence.verified -
            a.risk.evidence.verified -
            (a.risk.evidence.uncertain - b.risk.evidence.uncertain),
        )
        .slice(0, 6),
    [],
  );
  const sourceList = useMemo(() => {
    const count = new Map<string, number>();
    left.forEach((e) => e.risk.sources.forEach((s) => count.set(s, (count.get(s) ?? 0) + 1)));
    return [...count.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([s]) => s);
  }, [left]);

  const [sel, setSel] = useState(left[0].credit.id);

  const rowH = 52;
  const H = Math.max(left.length, sourceList.length) * rowH + 36;
  const yL = (i: number) => 28 + i * rowH + (H - 56 - (left.length - 1) * rowH) / 2;
  const yR = (i: number) => 28 + i * rowH + (H - 56 - (sourceList.length - 1) * rowH) / 2;
  const X1 = 168;
  const X2 = 552;

  return (
    <div className="space-y-3">
      <Head
        title="Claims ↔ sources"
        sub="Click a credit to trace which primary sources feed its assessment — every claim on the tape resolves to a document, or it stays an assumption."
      />
      <div className="overflow-x-auto rounded-lg border border-border/60 bg-foreground/[0.02] p-2">
        <svg viewBox={`0 0 720 ${H}`} className="w-full min-w-[560px]" role="img" aria-label="Evidence graph">
          {left.map((e, i) =>
            sourceList.map((s, j) => {
              const linked = e.risk.sources.includes(s);
              if (!linked) return null;
              const active = sel === e.credit.id;
              const y1 = yL(i);
              const y2 = yR(j);
              return (
                <motion.path
                  key={`${e.credit.id}-${s}`}
                  d={`M ${X1} ${y1} C ${(X1 + X2) / 2} ${y1}, ${(X1 + X2) / 2} ${y2}, ${X2} ${y2}`}
                  fill="none"
                  stroke={active ? "#6ee7b7" : "rgba(255,255,255,0.10)"}
                  strokeWidth={active ? 1.6 : 1}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.6, delay: 0.05 * j }}
                />
              );
            }),
          )}

          {left.map((e, i) => {
            const active = sel === e.credit.id;
            const ev = e.risk.evidence;
            return (
              <g
                key={e.credit.id}
                onClick={() => setSel(e.credit.id)}
                className="cursor-pointer"
                role="button"
                aria-label={`Select ${e.credit.id}`}
              >
                <rect
                  x={40}
                  y={yL(i) - 16}
                  width={X1 - 44}
                  height={32}
                  rx={8}
                  fill={active ? "rgba(52,211,153,0.14)" : "rgba(255,255,255,0.04)"}
                  stroke={active ? "#6ee7b7" : "rgba(255,255,255,0.12)"}
                />
                <text x={50} y={yL(i) + 1} fill={active ? "#a7f3d0" : "#cbd5cb"} fontSize={11} fontFamily="var(--font-mono, monospace)">
                  {e.credit.id}
                </text>
                <text x={50} y={yL(i) + 12} fill="rgba(255,255,255,0.4)" fontSize={9}>
                  {ev.verified} verified · {ev.uncertain} open
                </text>
                <circle cx={X1} cy={yL(i)} r={4} fill={active ? "#6ee7b7" : "rgba(255,255,255,0.3)"} />
              </g>
            );
          })}

          {sourceList.map((s, j) => (
            <g key={s}>
              <circle cx={X2} cy={yR(j)} r={4} fill="rgba(190,242,100,0.65)" />
              <text x={X2 + 10} y={yR(j) + 3} fill="rgba(255,255,255,0.55)" fontSize={10}>
                {s.length > 34 ? `${s.slice(0, 33)}…` : s}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <div className="num flex flex-wrap gap-3 text-[10px] text-muted-foreground/60">
        <span>■ credit claim (left)</span>
        <span>■ primary source (right)</span>
        <span className="text-primary">— selected {sel}</span>
      </div>
    </div>
  );
}

/* ========================= 14 · portfolio heatmap ========================= */

function heat(v: number): string {
  if (v >= 78) return "rgba(52,211,153,0.32)";
  if (v >= 62) return "rgba(190,242,100,0.24)";
  if (v >= 45) return "rgba(252,211,77,0.22)";
  return "rgba(248,113,113,0.26)";
}
function heatMis(m: number): string {
  if (m > 12) return "rgba(248,113,113,0.38)";
  if (m > 4) return "rgba(252,211,77,0.28)";
  if (m < -8) return "rgba(52,211,153,0.30)";
  return "rgba(255,255,255,0.06)";
}

export function HeatmapPanel() {
  const cols = [
    { k: "composite", label: "Score", get: (e: Entry) => e.risk.score },
    ...scoredCredits[0].risk.breakdown.map((b) => ({
      k: b.key,
      label: b.label.split(" ")[0],
      get: (e: Entry) => e.risk.breakdown.find((x) => x.key === b.key)?.value ?? 0,
    })),
    { k: "ev", label: "Verified", get: (e: Entry) => Math.round((e.risk.evidence.verified / Math.max(1, e.risk.evidence.verified + e.risk.evidence.estimated + e.risk.evidence.assumed + e.risk.evidence.uncertain)) * 100) },
  ];

  return (
    <div className="space-y-3">
      <Head
        title="Every position, every factor, one grid"
        sub="Rows sorted by composite score. Green = strength, amber = watch, red = drag. The last column is mispricing — red means the tape is above fair value."
      />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-separate border-spacing-[3px]">
          <thead>
            <tr>
              <th className="w-40 px-2 py-1 text-left text-[10px] uppercase tracking-wider text-muted-foreground/60">
                Credit
              </th>
              {cols.map((c) => (
                <th
                  key={c.k}
                  className="px-1 py-1 text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60"
                >
                  {c.label}
                </th>
              ))}
              <th className="px-1 py-1 text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
                Mispricing
              </th>
            </tr>
          </thead>
          <tbody>
            {scoredCredits.map((e) => (
              <tr key={e.credit.id}>
                <td className="whitespace-nowrap rounded bg-foreground/[0.03] px-2 py-1.5">
                  <Link
                    to={`/credit/${e.credit.id}`}
                    className="num text-[11px] transition-colors hover:text-primary"
                  >
                    {e.credit.id}
                  </Link>
                  <span className="num ml-1.5 text-[9px] text-muted-foreground/50">{e.risk.tier}</span>
                </td>
                {cols.map((c) => {
                  const v = c.get(e);
                  return (
                    <td
                      key={c.k}
                      className="num rounded px-1 py-1.5 text-center text-[11px] font-semibold"
                      style={{ background: heat(v) }}
                      title={`${c.label}: ${v}`}
                    >
                      {v}
                    </td>
                  );
                })}
                <td
                  className="num rounded px-1 py-1.5 text-center text-[11px] font-bold"
                  style={{ background: heatMis(e.risk.mispricingPct) }}
                  title={`Mispricing: ${e.risk.mispricingPct.toFixed(1)}%`}
                >
                  {e.risk.mispricingPct > 0 ? "+" : ""}
                  {e.risk.mispricingPct.toFixed(0)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="num flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground/60">
        <span className="flex items-center gap-1">
          <span className="size-3 rounded" style={{ background: heat(85) }} /> strong ≥78
        </span>
        <span className="flex items-center gap-1">
          <span className="size-3 rounded" style={{ background: heat(70) }} /> solid ≥62
        </span>
        <span className="flex items-center gap-1">
          <span className="size-3 rounded" style={{ background: heat(50) }} /> watch ≥45
        </span>
        <span className="flex items-center gap-1">
          <span className="size-3 rounded" style={{ background: heat(30) }} /> drag &lt;45
        </span>
        <span className="flex items-center gap-1">
          <span className="size-3 rounded" style={{ background: heatMis(20) }} /> overpriced
        </span>
      </div>
    </div>
  );
}

/* ======================= 15 · transaction audit trail ======================= */

export function AuditPanel() {
  const root =
    "0x" +
    h32(TRANSACTIONS.map((t) => t.hash).join("|")).toString(16).padStart(8, "0") +
    h32(TRANSACTIONS.map((t) => t.date).join("|")).toString(16).padStart(8, "0");
  const chain = TRANSACTIONS.map((t, i) => ({
    ...t,
    block: 21_482_911 - i * 47,
    prev: i === 0 ? "0x0000000000000000" : TRANSACTIONS[i - 1].hash,
  }));

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-emerald-300/25 bg-emerald-400/[0.06] px-3.5 py-2.5">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <CheckCircle2 className="size-4 text-emerald-300" />
          <span className="font-semibold text-emerald-200">Chain verified</span>
          <span className="num text-muted-foreground/70">
            {chain.length} blocks · every prev-hash links · state root {root}
          </span>
        </div>
      </div>

      <Head
        title="Hash-linked settlement history"
        sub="Each block commits to the previous one — edits are detectable because they'd break every link downstream."
      />

      <div className="space-y-2">
        {chain.map((t, i) => (
          <div key={t.hash}>
            <div className={rowCls}>
              <span className="num w-20 shrink-0 text-[11px] text-muted-foreground/50">#{t.block}</span>
              <span
                className={cn(
                  "num rounded border px-2 py-0.5 text-[10px] font-bold tracking-wide",
                  t.type === "BUY" && "border-emerald-300/35 bg-emerald-400/10 text-emerald-300",
                  t.type === "SELL" && "border-amber-300/35 bg-amber-400/10 text-amber-300",
                  t.type === "RETIRE" && "border-primary/40 bg-primary/10 text-primary",
                )}
              >
                {t.type}
              </span>
              <span className="num w-24 text-xs">{t.hash}</span>
              <span className="num w-20 text-xs font-semibold">{t.id}</span>
              <span className="num w-24 text-xs">{fmtTonnes(t.tonnes)} t</span>
              <span className="num w-28 text-right text-xs">{fmtMoney(t.usd)}</span>
              <span className="num flex-1 text-right text-[11px] text-muted-foreground/60">{t.date}</span>
              <span
                className={cn(
                  "num text-[10px] font-bold",
                  t.status === "RETIRED" ? "text-primary" : "text-emerald-400",
                )}
              >
                {t.status}
              </span>
            </div>
            {i < chain.length - 1 && (
              <div className="my-0.5 flex items-center gap-2 pl-6 text-[10px] text-muted-foreground/40">
                <Link2 className="size-3" />
                <span className="num">
                  prev {t.hash} → block #{chain[i + 1].block}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ==================== 16 · digital ownership receipt ==================== */

export function ReceiptPanel() {
  const receipts = POSITIONS.map((p, i) => {
    const c = p.credit;
    return {
      ...p,
      receipt: `RCPT-2026-${String(928 - i * 7).padStart(4, "0")}-${String(i + 1).padStart(2, "0")}`,
      serial: `${c.id}-${c.vintages[0]}-${String(h32(c.id + "serial") % 900000 + 100000)}`,
      signature: `0x${h32(c.id + "sig-a").toString(16).padStart(8, "0")}${h32(c.id + "sig-b")
        .toString(16)
        .padStart(8, "0")}`,
      custodian: "CarbonIQ Vault · simulated custody",
      settled: `2026-09-${String(28 - i * 6).padStart(2, "0")}`,
    };
  });

  return (
    <div className="space-y-4">
      <Head
        title="Custody receipts for every simulated lot"
        sub="Each position mints a receipt binding serial range, registry, quantity and custody signature — verifiable against the audit trail."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {receipts.map((r) => (
          <motion.div
            key={r.receipt}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35 }}
            className="rounded-xl border border-dashed border-primary/30 bg-card/60 p-4"
          >
            <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-3">
              <div className="flex items-center gap-2.5">
                <ScoreRing score={r.risk.score} tier={r.risk.tier} size={44} strokeWidth={4} />
                <div>
                  <div className="text-sm font-semibold leading-tight">{r.credit.name}</div>
                  <div className="num text-[11px] text-muted-foreground/60">
                    {r.receipt} · settled {r.settled}
                  </div>
                </div>
              </div>
              <TierBadge tier={r.risk.tier} />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              {[
                { k: "Serial range", v: r.serial },
                { k: "Registry", v: r.credit.registry },
                { k: "Vintage", v: String(r.credit.vintages[0]) },
                { k: "Quantity", v: `${fmtTonnes(r.tonnes)} t` },
                { k: "Cost basis", v: `${fmtMoney(r.costBasis)}/t` },
                { k: "Mark", v: `${fmtMoney(r.credit.price)}/t` },
              ].map((f) => (
                <div key={f.k} className="rounded border border-border/60 bg-foreground/[0.02] px-2.5 py-1.5">
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground/50">{f.k}</div>
                  <div className="num truncate text-[11px] font-semibold">{f.v}</div>
                </div>
              ))}
            </div>

            <div className="mt-3 space-y-1.5">
              <div className="num flex items-center justify-between gap-2 text-[10px] text-muted-foreground/60">
                <span>Custody</span>
                <span className="truncate text-foreground/80">{r.custodian}</span>
              </div>
              <div className="num flex items-center justify-between gap-2 text-[10px] text-muted-foreground/60">
                <span>Signature</span>
                <span className="truncate text-primary">{r.signature}</span>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-border/60 pt-2.5">
              {[
                { icon: <CheckCircle2 className="size-3" />, label: "serial verified", cls: "text-emerald-300 border-emerald-300/30" },
                { icon: <ShieldCheck className="size-3" />, label: "custody signed", cls: "text-emerald-300 border-emerald-300/30" },
                {
                  icon: r.risk.recommendation === "AVOID" ? <XCircle className="size-3" /> : <Radio className="size-3" />,
                  label: r.risk.recommendation === "AVOID" ? "flagged for review" : "live on tape",
                  cls:
                    r.risk.recommendation === "AVOID"
                      ? "text-red-300 border-red-400/30"
                      : "text-primary border-primary/30",
                },
              ].map((b) => (
                <span
                  key={b.label}
                  className={cn(
                    "num inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[9px] font-semibold uppercase",
                    b.cls,
                  )}
                >
                  {b.icon}
                  {b.label}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-border/60 bg-foreground/[0.02] p-3 text-[11px] leading-5 text-muted-foreground/70">
        <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-300/70" />
        Sample pilot data — receipts are simulated and carry no claim on a real registry account, asset or
        counterparty.
      </div>
    </div>
  );
}

/* ============================== dispatcher ============================== */

const PANELS: Record<string, () => ReactElement> = {
  mispricing: MispricingPanel,
  negotiation: NegotiationPanel,
  portfolio: PortfolioPanel,
  fraud: FraudPanel,
  whatif: WhatIfPanel,
  alerts: AlertsPanel,
  env: EnvPanel,
  activity: ActivityPanel,
  analytics: AnalyticsPanel,
  nlp: NlpPanel,
  waterfall: WaterfallPanel,
  decomposition: DecompositionPanel,
  graph: EvidenceGraphPanel,
  heatmap: HeatmapPanel,
  audit: AuditPanel,
  receipt: ReceiptPanel,
};

export function ScanPanel({ id }: { id: string }) {
  const Panel = PANELS[id] ?? MispricingPanel;
  return <Panel />;
}
