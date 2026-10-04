import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "react-router";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CircleDollarSign,
  FileSearch,
  Gauge,
  Landmark,
  Radar,
  Scale,
  ShieldCheck,
  Waves,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScoreRing } from "@/components/credit-visuals";
import {
  assessRisk,
  CREDITS,
  fmtMoney,
  fmtPct,
  type Credit,
} from "@/lib/credits";
import { cn } from "@/lib/utils";

/* ============================ brand mark ============================ */

function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} fill="none" aria-hidden>
      <circle cx="20" cy="20" r="17.5" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1.5" />
      <path
        d="M28.5 12.5a12 12 0 1 0 0 15"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="31.5" cy="27" r="2.2" fill="currentColor" />
    </svg>
  );
}

/* ============================ count-up hook ============================ */

function useCountUp(target: number, duration = 1400) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, target, duration]);

  return { ref, value };
}

function CountStat({
  target,
  suffix,
  label,
  decimals = 0,
  delay = 0,
}: {
  target: number;
  suffix?: string;
  label: string;
  decimals?: number;
  delay?: number;
}) {
  const { ref, value } = useCountUp(target);
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
    >
      <div className="num text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        <span ref={ref}>{value.toFixed(decimals)}</span>
        {suffix && <span className="text-primary">{suffix}</span>}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </motion.div>
  );
}

/* ============================ CO₂ particle field ============================ */

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function ParticleLayer({ count = 22 }: { count?: number }) {
  const rand = seeded(42);
  const particles = Array.from({ length: count }, (_, i) => {
    const size = 8 + rand() * 16;
    return {
      key: i,
      left: rand() * 100,
      size,
      duration: 14 + rand() * 16,
      delay: -rand() * 30,
      drift: (rand() - 0.5) * 60,
      opacity: 0.14 + rand() * 0.3,
      label: rand() > 0.55 ? "tCO₂e" : "CO₂",
    };
  });
  return (
    <div className="particle-layer pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {particles.map((p) => (
        <span
          key={p.key}
          className="particle num select-none text-primary/70"
          style={{
            left: `${p.left}%`,
            fontSize: `${p.size * 0.45}px`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            ["--p-dx" as string]: `${p.drift}px`,
            ["--p-op" as string]: p.opacity,
          }}
        >
          {p.label}
        </span>
      ))}
    </div>
  );
}

/* ============================ O=C=O molecule ============================ */

function Molecule() {
  return (
    <div
      className="molecule-layer molecule-breath pointer-events-none absolute right-[4%] top-[8%] hidden h-[420px] w-[420px] opacity-[0.32] lg:block"
      aria-hidden
    >
      <svg viewBox="0 0 200 200" className="absolute inset-0 size-full text-primary">
        {/* bonds */}
        <line x1="70" y1="100" x2="100" y2="100" stroke="currentColor" strokeWidth="2" strokeOpacity="0.55" />
        <line x1="70" y1="94" x2="100" y2="94" stroke="currentColor" strokeWidth="2" strokeOpacity="0.55" />
        <line x1="100" y1="100" x2="130" y2="100" stroke="currentColor" strokeWidth="2" strokeOpacity="0.55" />
        <line x1="100" y1="94" x2="130" y2="94" stroke="currentColor" strokeWidth="2" strokeOpacity="0.55" />
        {/* atoms */}
        <circle cx="70" cy="97" r="9" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeOpacity="0.8" strokeWidth="1.5" />
        <circle cx="130" cy="97" r="9" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeOpacity="0.8" strokeWidth="1.5" />
        <circle cx="100" cy="97" r="7" fill="currentColor" fillOpacity="0.4" stroke="currentColor" strokeWidth="1.5" />
        <text x="70" y="100.5" textAnchor="middle" dominantBaseline="middle" fontSize="8" fill="currentColor">O</text>
        <text x="130" y="100.5" textAnchor="middle" dominantBaseline="middle" fontSize="8" fill="currentColor">O</text>
        <text x="100" y="100.5" textAnchor="middle" dominantBaseline="middle" fontSize="7" fill="currentColor">C</text>
        {/* orbit guides */}
        <ellipse cx="100" cy="97" rx="78" ry="52" stroke="currentColor" strokeOpacity="0.18" strokeWidth="1" strokeDasharray="3 5" />
        <ellipse cx="100" cy="97" rx="52" ry="76" stroke="currentColor" strokeOpacity="0.12" strokeWidth="1" strokeDasharray="3 5" />
      </svg>
      {/* orbiting electrons */}
      <div className="electron-orbit" style={{ ["--orbit-d" as string]: "14s" }}>
        <span className="absolute left-1/2 top-[9%] size-2 -translate-x-1/2 rounded-full bg-primary shadow-[0_0_10px_oklch(0.82_0.21_158/0.9)]" />
      </div>
      <div className="electron-orbit" style={{ ["--orbit-d" as string]: "22s", animationDirection: "reverse" }}>
        <span className="absolute left-1/2 top-[26%] size-1.5 -translate-x-1/2 rounded-full bg-emerald-300/90 shadow-[0_0_8px_oklch(0.82_0.21_158/0.8)]" />
      </div>
    </div>
  );
}

/* ============================ hero terminal card ============================ */

function CornerBrackets() {
  const base = "pointer-events-none absolute size-4 border-primary/70";
  return (
    <>
      <span className={cn(base, "left-0 top-0 border-l-2 border-t-2")} />
      <span className={cn(base, "right-0 top-0 border-r-2 border-t-2")} />
      <span className={cn(base, "bottom-0 left-0 border-b-2 border-l-2")} />
      <span className={cn(base, "bottom-0 right-0 border-b-2 border-r-2")} />
    </>
  );
}

const HERO_ROWS = [
  { label: "Carbon integrity", value: 62, note: "degraded", cls: "text-amber-300", bar: "bar-glow-amber", barCls: "bg-amber-400/70" },
  { label: "Liquidity", value: 28, note: "thin", cls: "text-amber-300", bar: "bar-glow-amber", barCls: "bg-amber-400/70" },
  { label: "Regulatory eligibility", value: null, note: "FLAGGED", cls: "text-red-400", bar: "bar-glow-red", barCls: "bg-red-400/70" },
] as const;

function HeroTerminal() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotate: 1 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ duration: 0.9, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="glass relative mx-auto w-full max-w-lg rounded-lg p-[1px]"
    >
      <CornerBrackets />
      {/* radar scan line */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg">
        <div className="scan-sweep absolute inset-x-8 h-14 bg-gradient-to-b from-transparent via-primary/10 to-transparent" />
      </div>

      {/* window chrome */}
      <div className="relative rounded-lg border border-border/80 bg-background/80 backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-border/70 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-red-400/50" />
            <span className="size-2 rounded-full bg-amber-400/50" />
            <span className="size-2 rounded-full bg-emerald-400/60" />
            <span className="num ml-2 text-[10px] tracking-[0.14em] text-muted-foreground">
              CARBONIQ · RISK ENGINE v4.02
            </span>
          </div>
          <span className="animate-pulse-dot size-1.5 rounded-full bg-primary" />
        </div>

        <div className="space-y-5 p-5">
          {/* asset line */}
          <div className="flex items-center justify-between">
            <div>
              <div className="num text-[10px] text-muted-foreground">VCS-2140 · DELTA BASIN IFM</div>
              <div className="mt-0.5 text-sm font-semibold tracking-tight">Improved Forest Management · US</div>
            </div>
            <span className="num rounded border border-amber-300/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-amber-300">
              TIER C
            </span>
          </div>

          {/* price confrontation */}
          <div className="rounded-lg border border-border/70 bg-foreground/[0.02] p-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/70">Market price</div>
                <div className="num mt-1 text-2xl font-bold">$14.80</div>
                <div className="num text-[10px] text-muted-foreground/60">seller quote</div>
              </div>
              <div className="pb-1 text-muted-foreground/40">→</div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-[0.16em] text-primary/80">Risk-adjusted</div>
                <div className="num mt-1 text-2xl font-bold text-primary">$9.10</div>
                <div className="num text-[10px] text-muted-foreground/60">−38.5% · overpriced</div>
              </div>
            </div>
            {/* glowing band bar */}
            <div className="mt-3">
              <div className="relative h-2 overflow-hidden rounded-full bg-foreground/8">
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full bg-amber-400/80 bar-glow-amber"
                  initial={{ width: 0 }}
                  animate={{ width: "64.2%" }}
                  transition={{ duration: 1.3, delay: 1.1, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
              <div className="num mt-1.5 flex justify-between text-[10px] text-muted-foreground/60">
                <span>fair-value floor $7.40</span>
                <span>ceiling $12.90</span>
              </div>
            </div>
          </div>

          {/* risk score */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <ScoreRing score={64.2} tier="C" size={72} strokeWidth={6} animateOnView={false} />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/70">Composite risk score</div>
              <div className="num text-lg font-bold">64.2 <span className="text-xs font-medium text-amber-300">HIGH VARIANCE</span></div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">Downside dominated by integrity &amp; eligibility findings.</div>
            </div>
          </div>

          {/* risk marker rows */}
          <div className="space-y-2.5">
            {HERO_ROWS.map((r, i) => (
              <div key={r.label}>
                <div className="mb-1 flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">{r.label}</span>
                  <span className={cn("num font-bold", r.cls)}>
                    {r.value !== null && r.value}
                    {r.value !== null && " "}
                    {r.note}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-foreground/8">
                  <motion.div
                    className={cn("h-full rounded-full", r.barCls, r.bar)}
                    initial={{ width: 0 }}
                    animate={{ width: r.value !== null ? `${r.value}%` : "100%" }}
                    transition={{ duration: 1, delay: 1.25 + i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* floating telemetry */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="num absolute -left-6 top-16 hidden rounded-md border border-border/70 bg-background/85 px-2.5 py-1.5 text-[9px] leading-relaxed text-muted-foreground backdrop-blur sm:block"
      >
        LAT 33.7405<br />LON −84.1531<br /><span className="text-primary">▲ BUFFER ZONE SCAN</span>
      </motion.div>
      <motion.div
        animate={{ y: [0, 9, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="num absolute -right-5 bottom-20 hidden rounded-md border border-border/70 bg-background/85 px-2.5 py-1.5 text-[9px] leading-relaxed text-muted-foreground backdrop-blur sm:block"
      >
        LAST VERIFICATION 2025-06<br />REVERSALS YTD 2<br /><span className="text-amber-300">▲ METHODOLOGY REVIEW OPEN</span>
      </motion.div>
    </motion.div>
  );
}

/* ============================ live scored counter ============================ */

function LiveCounter() {
  const [tonnes, setTonnes] = useState(1_284_502);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setTonnes((t) => t + 3 + Math.floor(Math.random() * 9));
      setFlash(true);
      setTimeout(() => setFlash(false), 380);
    }, 1200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
        <span className="relative inline-flex size-2 rounded-full bg-primary" />
      </span>
      <span className="num text-sm text-muted-foreground">tCO₂e scored today</span>
      <span
        className={cn(
          "num rounded px-1.5 py-0.5 text-sm font-bold tabular-nums transition-colors duration-300",
          flash ? "bg-primary/15 text-primary" : "text-foreground",
        )}
      >
        {tonnes.toLocaleString("en-US")}
      </span>
    </div>
  );
}

/* ============================ self-drawing curve ============================ */

function AvoidedCurve() {
  return (
    <div className="relative">
      <svg viewBox="0 0 560 200" className="w-full">
        <defs>
          <linearGradient id="avoided-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6ee7b7" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#6ee7b7" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* gridlines */}
        {[40, 90, 140].map((y) => (
          <line key={y} x1="0" y1={y} x2="560" y2={y} stroke="oklch(0.95 0.02 152 / 0.06)" strokeWidth="1" />
        ))}
        <motion.path
          d="M0,178 C70,172 120,166 180,150 C240,134 280,120 340,96 C400,72 450,52 560,26 L560,200 L0,200 Z"
          fill="url(#avoided-fill)"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, delay: 1 }}
        />
        <motion.path
          d="M0,178 C70,172 120,166 180,150 C240,134 280,120 340,96 C400,72 450,52 560,26"
          fill="none"
          stroke="#6ee7b7"
          strokeWidth="2.4"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 2, ease: "easeOut" }}
          style={{ filter: "drop-shadow(0 0 6px oklch(0.82 0.21 158 / 0.5))" }}
        />
      </svg>
      {/* pulsing live tip */}
      <motion.span
        className="absolute right-0 top-[13%] flex -translate-y-1/2"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 2 }}
      >
        <span className="absolute inline-flex size-3 animate-ping rounded-full bg-primary opacity-60" />
        <span className="relative inline-flex size-3 rounded-full border-2 border-background bg-primary" />
      </motion.span>
      <div className="num mt-2 flex justify-between text-[10px] text-muted-foreground/60">
        <span>2020</span>
        <span className="text-primary">verified emissions avoided, cumulative</span>
        <span>today</span>
      </div>
    </div>
  );
}

/* ============================ registry ticker ============================ */

function TickerItem({ c }: { c: Credit }) {
  const risk = assessRisk(c);
  const over = risk.mispricingPct >= 0;
  return (
    <span className="mx-5 inline-flex items-center gap-2 text-xs">
      <span className="num text-muted-foreground">{c.id}</span>
      <span className="font-medium">{c.name}</span>
      <span className="num">{fmtMoney(c.price)}</span>
      <span className="num text-muted-foreground/60">/</span>
      <span className={cn("num", over ? "text-red-400" : "text-emerald-400")}>
        {fmtMoney(risk.fairValue.point)}
      </span>
      <span
        className={cn(
          "num rounded px-1.5 py-px text-[10px] font-semibold",
          over ? "bg-red-500/10 text-red-400" : "bg-emerald-400/10 text-emerald-300",
        )}
      >
        {fmtPct(risk.mispricingPct)}
      </span>
    </span>
  );
}

function Ticker() {
  const items = [...CREDITS, ...CREDITS];
  return (
    <div className="relative w-full overflow-hidden border-y border-border/70 bg-card/40 py-2.5">
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

/* ============================ page ============================ */

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
} as const;

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
      {...fadeUp}
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

const GAP_CARDS = [
  {
    icon: <CircleDollarSign className="size-5" />,
    title: "Overpaying",
    body: "A seller's quote is not a valuation. Without a risk-adjusted reference, low-quality credits command premiums they have not earned — and the loss is booked the day you buy.",
  },
  {
    icon: <Landmark className="size-5" />,
    title: "Regulatory",
    body: "Methodology revisions, eligibility rules and policy shifts can impair a credit's usability overnight. Most buyers learn about the change after the purchase settles.",
  },
  {
    icon: <Waves className="size-5" />,
    title: "Liquidity",
    body: "Thin float and slow turnover mean the exit is not guaranteed at the price you underwrote. Illiquidity is a risk you pay for but rarely see on the invoice.",
  },
  {
    icon: <AlertTriangle className="size-5" />,
    title: "Reputation",
    body: "When a credit's claims are later challenged, the damage compounds: write-downs, restated climate commitments, and the public scrutiny that follows both.",
  },
];

const CAPABILITIES = [
  {
    icon: <Scale className="size-5" />,
    title: "Risk-adjusted fair value",
    body: "A defensible value range for every credit — computed from evidence and risk, never from the seller's ask.",
  },
  {
    icon: <Radar className="size-5" />,
    title: "Mispricing radar",
    body: "Compares each asset against vintage-, type- and quality-matched peers to surface unusual premiums and discounts.",
  },
  {
    icon: <FileSearch className="size-5" />,
    title: "Evidence confidence",
    body: "Separates verified facts, model estimates, assumptions and open questions — so you know how solid each conclusion is.",
  },
  {
    icon: <Gauge className="size-5" />,
    title: "Financial stress testing",
    body: "Runs price shocks, policy changes, liquidity deterioration and underperformance against your position before you take it.",
  },
  {
    icon: <BarChart3 className="size-5" />,
    title: "Negotiation intelligence",
    body: "Converts risk findings into a defensible purchase range you can take into the room — with the evidence attached.",
  },
  {
    icon: <ShieldCheck className="size-5" />,
    title: "Explainable decisions",
    body: "Every recommendation traces back to signals, model outputs and sources. No black box, no unverifiable claims.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Ingest & reconcile",
    body: "Registry records, project documents, market prices, disclosures and environmental evidence are pulled together — and conflicts or gaps are flagged before any conclusion is drawn.",
  },
  {
    n: "02",
    title: "Score eighteen signals",
    body: "Specialized analyses grade project, integrity, market, regulatory and fraud-related risk. The engine distinguishes what is verified from what is merely assumed.",
  },
  {
    n: "03",
    title: "Return a risk-adjusted price",
    body: "Valuation and stress models turn the risk picture into a fair-value range, a mispricing verdict and a BUY / HOLD / NEGOTIATE / AVOID recommendation with evidence.",
  },
];

export default function Landing() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="relative min-h-screen overflow-x-clip"
    >
      {/* ambient background */}
      <div className="pointer-events-none fixed inset-0 bg-grid opacity-40 [mask-image:radial-gradient(75%_60%_at_50%_0%,black,transparent)]" />
      <div className="pointer-events-none fixed -left-44 top-1/3 size-[440px] rounded-full bg-primary/6 blur-[130px]" />
      <div className="pointer-events-none fixed -right-44 top-2/3 size-[440px] rounded-full bg-chart-2/5 blur-[130px]" />

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
              <span className="font-display text-lg font-bold tracking-[0.08em]">
                CARBON<span className="text-primary">IQ</span>
              </span>
            </Link>
            <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
              <a href="#gap" className="transition-colors hover:text-foreground">The gap</a>
              <a href="#capabilities" className="transition-colors hover:text-foreground">Platform</a>
              <a href="#method" className="transition-colors hover:text-foreground">Method</a>
            </nav>
            <Button asChild className="cta-glow gap-2 rounded-lg">
              <Link to="/dashboard">
                Open terminal <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </motion.header>

        {/* ============ HERO ============ */}
        <section className="relative">
          <Molecule />
          <ParticleLayer count={24} />

          <div className="mx-auto w-full max-w-6xl px-4 pb-14 pt-16 sm:px-6 lg:pb-20 lg:pt-24">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div className="relative">
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: 0.1 }}
                  className="num inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-3 py-1 text-[11px] tracking-wide text-primary"
                >
                  <span className="relative flex size-1.5">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-70" />
                    <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
                  </span>
                  SYSTEM STATUS · 42 REGISTRY FEEDS LIVE
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.65, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="mt-6 font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.5rem]"
                >
                  The price you see is not the{" "}
                  <span className="underline decoration-primary decoration-[3px] underline-offset-8">
                    risk
                  </span>{" "}
                  you carry.
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.65, delay: 0.32, ease: [0.22, 1, 0.36, 1] }}
                  className="mt-6 max-w-xl text-base leading-7 text-muted-foreground"
                >
                  CarbonIQ is the financial intelligence layer for carbon credits. It
                  reconciles registry data, project documents and market behavior into a
                  risk-adjusted fair value — so before you commit capital, you know what
                  you are buying, what it is worth, and what could make you regret it.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.65, delay: 0.44 }}
                  className="mt-8 flex flex-wrap items-center gap-4"
                >
                  <Button asChild size="lg" className="cta-glow gap-2 rounded-lg px-7 text-[15px]">
                    <Link to="/dashboard">
                      Run a credit assessment <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  <a
                    href="#method"
                    className="num text-sm font-bold tracking-wider text-foreground/80 transition-colors hover:text-primary"
                  >
                    [ VIEW_METHOD ]
                  </a>
                </motion.div>

                {/* count-up stats */}
                <div className="mt-10 grid max-w-md grid-cols-3 gap-6 border-t border-border/60 pt-6">
                  <CountStat target={18} suffix="" label="risk signals per credit" delay={0.5} />
                  <CountStat target={42} suffix="" label="registry feeds ingested" delay={0.6} />
                  <CountStat target={4} suffix="s" label="per full assessment" delay={0.7} />
                </div>
              </div>

              <HeroTerminal />
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1 }}
              className="mt-14"
            >
              <LiveCounter />
            </motion.div>
          </div>

          <Ticker />
        </section>

        {/* ============ WHERE THE GAP COSTS MONEY ============ */}
        <section id="gap" className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
          <SectionHeading
            kicker="The information gap"
            title={
              <>
                Where the gap <span className="gradient-text">costs money</span>
              </>
            }
            sub="Critical facts sit fragmented across registries, documents and reports. Buyers run weeks of manual diligence and still transact on an incomplete picture. These are the four ways that gap turns into losses."
          />

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {GAP_CARDS.map((p, i) => (
              <motion.div
                key={p.title}
                {...fadeUp}
                transition={{ duration: 0.55, delay: i * 0.09, ease: [0.22, 1, 0.36, 1] }}
                className="group glass relative overflow-hidden rounded-2xl p-5 transition-colors hover:border-primary/30"
              >
                <div className="pointer-events-none absolute -right-8 -top-10 size-28 rounded-full bg-primary/8 blur-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="flex size-10 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary">
                  {p.icon}
                </div>
                <h3 className="mt-4 font-display text-base font-semibold tracking-tight">{p.title}</h3>
                <p className="mt-2 text-[13px] leading-6 text-muted-foreground">{p.body}</p>
              </motion.div>
            ))}
          </div>

          {/* self-drawing curve */}
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="glass mt-8 rounded-2xl p-6"
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display text-base font-semibold tracking-tight">
                The market is scaling faster than its evidence
              </h3>
              <span className="num rounded border border-primary/25 bg-primary/8 px-2 py-0.5 text-[10px] tracking-wider text-primary">
                LIVE · REGISTRY AGGREGATE
              </span>
            </div>
            <AvoidedCurve />
          </motion.div>
        </section>

        {/* ============ CAPABILITIES ============ */}
        <section id="capabilities" className="border-y border-border/60 bg-card/30 py-20 lg:py-28">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <SectionHeading
              kicker="The platform"
              title={
                <>
                  Treats credits as <span className="gradient-text">financial assets</span>
                </>
              }
              sub="Not another sustainability dashboard. CarbonIQ prices risk, surfaces mispricing, and stands behind every number it shows you."
            />

            <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {CAPABILITIES.map((cap, i) => (
                <motion.div
                  key={cap.title}
                  {...fadeUp}
                  transition={{ duration: 0.55, delay: (i % 3) * 0.09, ease: [0.22, 1, 0.36, 1] }}
                  className="group glass relative overflow-hidden rounded-2xl p-6 transition-colors hover:border-primary/30"
                >
                  <div className="pointer-events-none absolute -right-8 -top-10 size-28 rounded-full bg-primary/8 blur-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <div className="flex size-11 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary">
                    {cap.icon}
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold tracking-tight">{cap.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{cap.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ HOW IT WORKS (sticky) ============ */}
        <section id="method" className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <div className="lg:sticky lg:top-28">
                <motion.div {...fadeUp} transition={{ duration: 0.6 }}>
                  <span className="num text-[11px] font-medium uppercase tracking-[0.22em] text-primary">
                    The method
                  </span>
                  <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                    From fragmented evidence to a{" "}
                    <span className="gradient-text">defensible price</span>
                  </h2>
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">
                    Three deterministic stages, no black box. Every output keeps its
                    evidence trail so a conclusion can always be traced back to the
                    underlying data.
                  </p>
                  <Button asChild className="cta-glow mt-8 gap-2 rounded-lg">
                    <Link to="/dashboard">
                      Run a credit assessment <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </motion.div>
              </div>
            </div>

            <div className="space-y-4 lg:col-span-3">
              {STEPS.map((s, i) => (
                <motion.div
                  key={s.n}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.6, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  className="glass relative overflow-hidden rounded-2xl p-6"
                >
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                  <div className="flex items-start gap-5">
                    <span className="num text-2xl font-bold text-primary/50">{s.n}</span>
                    <div>
                      <h3 className="font-display text-lg font-semibold tracking-tight">{s.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{s.body}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ PILOT CTA ============ */}
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
              <ParticleLayer count={10} />
              <div className="relative">
                <LogoMark className="animate-float-y mx-auto size-12 text-primary" />
                <h2 className="mt-6 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                  Price your next purchase like a{" "}
                  <span className="gradient-text">risk desk</span>.
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                  Join the pilot program: run your watchlist through the engine, see the
                  risk-adjusted book, and pressure-test your next purchase before the
                  wire goes out.
                </p>
                <Button asChild size="lg" className="cta-glow mt-8 gap-2 rounded-lg px-8 text-[15px]">
                  <Link to="/dashboard">
                    Run a credit assessment <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <p className="num mt-4 text-[11px] text-muted-foreground/50">
                  PILOT BUILD · SAMPLE DATA · NOT INVESTMENT ADVICE
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
              <span>CARBONIQ — carbon credit financial intelligence</span>
            </div>
            <span className="num">FINANCE &amp; COMMERCE · PILOT BUILD · SAMPLE DATA</span>
          </div>
        </footer>
      </div>
    </motion.div>
  );
}
