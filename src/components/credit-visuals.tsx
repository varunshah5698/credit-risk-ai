import { useId } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  assessRisk,
  type Credit,
  type EvidenceLayer,
  type RiskAssessment,
} from "@/lib/credits";

export function tierColor(tier: RiskAssessment["tier"]) {
  switch (tier) {
    case "A":
      return {
        text: "text-emerald-300",
        bg: "bg-emerald-400/15",
        border: "border-emerald-300/30",
        stroke: "#6ee7b7",
      };
    case "B":
      return {
        text: "text-lime-300",
        bg: "bg-lime-400/10",
        border: "border-lime-300/30",
        stroke: "#bef264",
      };
    case "C":
      return {
        text: "text-amber-300",
        bg: "bg-amber-400/10",
        border: "border-amber-300/30",
        stroke: "#fcd34d",
      };
    case "D":
      return {
        text: "text-red-400",
        bg: "bg-red-500/10",
        border: "border-red-400/30",
        stroke: "#f87171",
      };
  }
}

/** Animated circular risk-score gauge. Higher = safer. */
export function ScoreRing({
  score,
  tier,
  size = 64,
  strokeWidth = 5,
  animateOnView = true,
}: {
  score: number;
  tier: RiskAssessment["tier"];
  size?: number;
  strokeWidth?: number;
  animateOnView?: boolean;
}) {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const colors = tierColor(tier);

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-foreground/8"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          stroke={colors.stroke}
          strokeDasharray={circumference}
          initial={
            animateOnView
              ? { strokeDashoffset: circumference }
              : { strokeDashoffset: circumference * (1 - score / 100) }
          }
          whileInView={
            animateOnView
              ? { strokeDashoffset: circumference * (1 - score / 100) }
              : undefined
          }
          animate={
            animateOnView
              ? undefined
              : { strokeDashoffset: circumference * (1 - score / 100) }
          }
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          style={{ filter: `drop-shadow(0 0 5px ${colors.stroke}66)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn("num font-semibold leading-none", colors.text)}
          style={{ fontSize: size * 0.3 }}
        >
          {score}
        </span>
        {size >= 56 && (
          <span
            className="text-muted-foreground/70 leading-none"
            style={{ fontSize: size * 0.14 }}
          >
            /100
          </span>
        )}
      </div>
    </div>
  );
}

/** Tiny SVG price sparkline with a soft glow, no chart library needed. */
export function Sparkline({
  data,
  width = 120,
  height = 36,
  positive,
}: {
  data: number[];
  width?: number;
  height?: number;
  positive: boolean;
}) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 3;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (width - 2) + 1;
    const y = height - pad - ((v - min) / range) * (height - pad * 2);
    return [x, y] as const;
  });

  const line = points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `1,${height - 1} ${line} ${width - 1},${height - 1}`;
  const stroke = positive ? "#6ee7b7" : "#f87171";
  const gid = `spark-${useId()}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gid})`} />
      <motion.polyline
        points={line}
        fill="none"
        stroke={stroke}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        style={{ filter: `drop-shadow(0 0 3px ${stroke}55)` }}
      />
    </svg>
  );
}

/** Tier chip, e.g. "A · Prime" */
export function TierBadge({ tier, className }: { tier: RiskAssessment["tier"]; className?: string }) {
  const c = tierColor(tier);
  const label =
    tier === "A" ? "Prime" : tier === "B" ? "Investment Grade" : tier === "C" ? "Watch" : "High Risk";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide",
        c.text,
        c.bg,
        c.border,
        className,
      )}
    >
      <span className="num">{tier}</span>
      <span className="text-foreground/50">·</span>
      {label}
    </span>
  );
}

/** BUY / HOLD / NEGOTIATE / AVOID decision chip (mono, terminal-style). */
export function RecommendationBadge({
  rec,
  className,
}: {
  rec: RiskAssessment["recommendation"];
  className?: string;
}) {
  const styles: Record<string, string> = {
    BUY: "border-emerald-300/35 bg-emerald-400/12 text-emerald-300",
    HOLD: "border-lime-300/25 bg-lime-400/8 text-lime-300",
    NEGOTIATE: "border-amber-300/35 bg-amber-400/10 text-amber-300",
    AVOID: "border-red-400/35 bg-red-500/10 text-red-400",
  };
  return (
    <span
      className={cn(
        "num inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-bold tracking-[0.08em]",
        styles[rec],
        className,
      )}
    >
      {rec}
    </span>
  );
}

/** Evidence confidence stack: verified / estimated / assumed / uncertain. */
export function EvidenceBar({ evidence }: { evidence: EvidenceLayer }) {
  const total =
    evidence.verified + evidence.estimated + evidence.assumed + evidence.uncertain || 1;
  const segs = [
    { n: evidence.verified, cls: "bg-emerald-400/80", label: "Verified" },
    { n: evidence.estimated, cls: "bg-lime-400/60", label: "Estimated" },
    { n: evidence.assumed, cls: "bg-amber-400/60", label: "Assumed" },
    { n: evidence.uncertain, cls: "bg-red-400/50", label: "Uncertain" },
  ];
  return (
    <div>
      <div className="flex h-2 overflow-hidden rounded-full bg-foreground/8">
        {segs.map((s, i) => (
          <motion.div
            key={s.label}
            className={s.cls}
            initial={{ width: 0 }}
            whileInView={{ width: `${(s.n / total) * 100}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
          />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {segs.map((s) => (
          <span key={s.label} className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span className={cn("size-1.5 rounded-full", s.cls)} />
            {s.label} <span className="num text-foreground/70">{s.n}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** Weighted contribution bars for one credit's factor breakdown. */
export function FactorBars({ credit }: { credit: Credit }) {
  const { breakdown } = assessRisk(credit);
  const maxWeight = Math.max(...breakdown.map((b) => b.weight));
  return (
    <div className="space-y-2.5">
      {breakdown.map((b, i) => (
        <div key={b.key} className="flex items-center gap-3">
          <span className="w-36 shrink-0 text-xs text-muted-foreground">
            {b.label}
          </span>
          <div className="relative h-5 flex-1 overflow-hidden rounded-sm bg-foreground/5">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-sm"
              style={{
                background:
                  b.value >= 78
                    ? "linear-gradient(90deg, oklch(0.7 0.15 155 / 0.5), oklch(0.8 0.2 155 / 0.75))"
                    : b.value >= 62
                      ? "linear-gradient(90deg, oklch(0.72 0.14 130 / 0.5), oklch(0.8 0.16 130 / 0.7))"
                      : b.value >= 45
                        ? "linear-gradient(90deg, oklch(0.75 0.13 85 / 0.5), oklch(0.8 0.15 85 / 0.7))"
                        : "linear-gradient(90deg, oklch(0.6 0.17 25 / 0.5), oklch(0.66 0.19 25 / 0.7))",
              }}
              initial={{ width: 0 }}
              whileInView={{ width: `${b.value}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
            />
            {/* weight marker: width of the weight relative to the max weight */}
            <div
              className="absolute inset-y-0 border-r border-dashed border-foreground/25"
              style={{ left: `${(b.weight / maxWeight) * 100}%` }}
            />
          </div>
          <span className="num w-8 text-right text-xs font-medium text-foreground/90">
            {b.value}
          </span>
          <span className="num w-12 text-right text-[10px] text-muted-foreground/70">
            ×{(b.weight * 100).toFixed(0)}%
          </span>
        </div>
      ))}
    </div>
  );
}
