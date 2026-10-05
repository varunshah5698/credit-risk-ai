import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  LineChart,
  MessageSquareQuote,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { fmtPct, scoredCredits } from "@/lib/credits";
import { cn } from "@/lib/utils";
import { EvidenceBar, RecommendationBadge } from "@/components/credit-visuals";
import { WorkspaceNav } from "@/components/dashboard-shell";
import { pickReply } from "@/lib/terminal";

/* ===================== shared aggregates ===================== */

function portfolioFactors() {
  return scoredCredits[0].risk.breakdown.map((b) => {
    const avg = Math.round(
      scoredCredits.reduce((a, e) => {
        const f = e.risk.breakdown.find((x) => x.key === b.key);
        return a + (f?.value ?? 0);
      }, 0) / scoredCredits.length,
    );
    return { ...b, avg };
  });
}

function aggregateEvidence() {
  return scoredCredits.reduce(
    (a, e) => ({
      verified: a.verified + e.risk.evidence.verified,
      estimated: a.estimated + e.risk.evidence.estimated,
      assumed: a.assumed + e.risk.evidence.assumed,
      uncertain: a.uncertain + e.risk.evidence.uncertain,
    }),
    { verified: 0, estimated: 0, assumed: 0, uncertain: 0 },
  );
}

function ScreenFoot() {
  return (
    <footer className="relative border-t border-border/60 py-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 text-xs text-muted-foreground/50 sm:flex-row sm:px-6">
        <span>CARBONIQ · financial intelligence, not investment advice</span>
        <span className="num">PILOT BUILD · SAMPLE DATA · 68 SIGNAL TYPES</span>
      </div>
    </footer>
  );
}

/* ===================== /analytics — portfolio intelligence ===================== */

export function AnalyticsScreen() {
  const avgScore = Math.round(
    scoredCredits.reduce((a, e) => a + e.risk.score, 0) / scoredCredits.length,
  );
  const tiers = (["A", "B", "C", "D"] as const).map(
    (t) => `${scoredCredits.filter((e) => e.risk.tier === t).length}${t}`,
  );
  const worstStress = scoredCredits
    .flatMap((e) => e.risk.stresses.map((s) => ({ ...s, credit: e.credit })))
    .sort((a, b) => a.impactPct - b.impactPct)[0];
  const evidence = aggregateEvidence();
  const evidenceTotal =
    evidence.verified + evidence.estimated + evidence.assumed + evidence.uncertain;
  const verifiedShare = Math.round((evidence.verified / evidenceTotal) * 100);

  const factors = portfolioFactors();
  const mispricing = [...scoredCredits].sort(
    (a, b) => b.risk.mispricingPct - a.risk.mispricingPct,
  );

  const kpis = [
    { label: "Avg risk score", value: `${avgScore}`, sub: "weighted composite /100" },
    { label: "Tier mix", value: tiers.join(" · "), sub: "credits by tier" },
    {
      label: "Worst stress",
      value: fmtPct(worstStress.impactPct),
      sub: worstStress.name,
      tone: "text-red-400",
    },
    {
      label: "Verified evidence",
      value: `${verifiedShare}%`,
      sub: `${evidenceTotal} inputs on file`,
    },
  ];

  return (
    <div className="relative min-h-screen overflow-x-clip">
      <div className="pointer-events-none fixed inset-0 bg-grid opacity-60 [mask-image:radial-gradient(70%_50%_at_50%_0%,black,transparent)]" />
      <div className="pointer-events-none fixed -left-44 top-2/3 size-[440px] rounded-full bg-primary/6 blur-[130px]" />

      <WorkspaceNav />

      <main className="relative mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6">
        <motion.section
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="num text-[11px] font-medium uppercase tracking-[0.18em] text-primary">
            Analytics · portfolio intelligence
          </div>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Where the book stands
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Portfolio-average risk decomposition, mispricing distribution and the
            stress exposures that dominate the downside — all derived from the same
            six-factor engine.
          </p>
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
              <div className={cn("num mt-1 text-xl font-bold tracking-tight", s.tone)}>
                {s.value}
              </div>
              <div className="num mt-0.5 truncate text-[11px] text-muted-foreground/70">
                {s.sub}
              </div>
            </motion.div>
          ))}
        </section>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <LineChart className="size-4 text-primary" />
                Risk decomposition · portfolio average
              </CardTitle>
              <CardDescription>
                Weighted contribution of each factor across {scoredCredits.length}{" "}
                credits.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {factors.map((b) => (
                <div key={b.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground/80">
                      {b.label}
                      <span className="num ml-2 text-[10px] text-muted-foreground/50">
                        ×{Math.round(b.weight * 100)}%
                      </span>
                    </span>
                    <span className="num font-semibold">{b.avg}</span>
                  </div>
                  <Progress value={b.avg} className="h-1.5" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <AlertTriangle className="size-4 text-amber-300" />
                Stress exposure · worst first
              </CardTitle>
              <CardDescription>
                Adverse scenarios with the largest impact on fair value.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {scoredCredits
                .flatMap((e) => e.risk.stresses.map((s) => ({ ...s, credit: e.credit })))
                .sort((a, b) => a.impactPct - b.impactPct)
                .slice(0, 5)
                .map((s) => (
                  <div
                    key={`${s.credit.id}-${s.name}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-red-400/15 bg-red-500/[0.03] px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{s.name}</div>
                      <div className="num truncate text-[11px] text-muted-foreground/70">
                        {s.credit.id} · {s.detail}
                      </div>
                    </div>
                    <span className="num shrink-0 rounded bg-red-400/10 px-2 py-1 text-xs font-bold text-red-300">
                      {s.impactPct}%
                    </span>
                  </div>
                ))}
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="size-4 text-primary" />
                Mispricing distribution
              </CardTitle>
              <CardDescription>
                Market quote minus risk-adjusted fair value, most overpriced first.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {mispricing.map((e) => {
                const over = e.risk.mispricingPct >= 0;
                return (
                  <div
                    key={e.credit.id}
                    className="flex items-center gap-3 rounded-lg border border-border/60 bg-foreground/[0.02] px-3 py-2"
                  >
                    <Link
                      to={`/credit/${e.credit.id}`}
                      className="num w-20 shrink-0 truncate text-xs font-semibold transition-colors hover:text-primary"
                    >
                      {e.credit.id}
                    </Link>
                    <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-foreground/8">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          over ? "bg-amber-400/70" : "bg-emerald-400/70",
                        )}
                        style={{
                          width: `${Math.min(Math.abs(e.risk.mispricingPct), 100)}%`,
                        }}
                      />
                    </div>
                    <span
                      className={cn(
                        "num w-16 shrink-0 text-right text-xs font-bold",
                        over ? "text-amber-300" : "text-emerald-400",
                      )}
                    >
                      {over ? "+" : ""}
                      {e.risk.mispricingPct.toFixed(1)}%
                    </span>
                    <RecommendationBadge rec={e.risk.recommendation} />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <ShieldCheck className="size-4 text-primary" />
                Evidence quality
              </CardTitle>
              <CardDescription>
                Verified facts vs estimates, assumptions and open questions behind the
                numbers.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <EvidenceBar evidence={evidence} />
              <div className="grid grid-cols-2 gap-2">
                {scoredCredits.slice(0, 4).map((e) => (
                  <div
                    key={e.credit.id}
                    className="rounded-lg border border-border/60 bg-foreground/[0.02] p-3"
                  >
                    <div className="num text-[11px] text-muted-foreground/70">
                      {e.credit.id}
                    </div>
                    <div className="num mt-0.5 text-sm font-semibold">
                      {e.risk.evidence.verified} verified
                      <span className="text-muted-foreground/60">
                        {" "}
                        / {e.risk.evidence.uncertain} open
                      </span>
                    </div>
                    <div className="num mt-0.5 text-[10px] text-muted-foreground/60">
                      {e.risk.confidence} confidence
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[11px] leading-5 text-muted-foreground/60">
                Aggregate mix across every credit on the book — the engine never
                silently upgrades an assumption into a fact.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <ScreenFoot />
    </div>
  );
}

/* ===================== /terminal — NLP financial terminal ===================== */

interface Msg {
  role: "user" | "assistant";
  text: string;
  sources?: string[];
}

// Answer engine lives in lib so the inline scan terminal can share it.
const SUGGESTIONS = [
  "Where should I buy?",
  "What is overpriced?",
  "Biggest downside?",
  "How solid is the evidence?",
  "What is VCS-1942 worth?",
];

export function TerminalScreen() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      text: "CarbonIQ terminal ready. Ask about mispricing, fair value, stress or evidence across the book — every answer cites its sources.",
      sources: ["Registry issuance ledger", "Market trade tape"],
    },
  ]);
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const send = (question: string) => {
    const q = question.trim();
    if (!q) return;
    const reply = pickReply(q);
    setMessages((m) => [
      ...m,
      { role: "user", text: q },
      { role: "assistant", text: reply.text, sources: reply.sources },
    ]);
    setDraft("");
  };

  return (
    <div className="relative min-h-screen overflow-x-clip">
      <div className="pointer-events-none fixed inset-0 bg-grid opacity-60 [mask-image:radial-gradient(70%_50%_at_50%_0%,black,transparent)]" />
      <div className="pointer-events-none fixed -right-44 top-1/3 size-[440px] rounded-full bg-primary/6 blur-[130px]" />

      <WorkspaceNav />

      <main className="relative mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6">
        <motion.section
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="num text-[11px] font-medium uppercase tracking-[0.18em] text-primary">
            Terminal · NLP
          </div>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Ask the book
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Plain-language questions over the same engine that prices the credits —
            answers come back with the sources they were derived from.
          </p>
        </motion.section>

        <div className="glass mt-6 overflow-hidden rounded-xl border border-border/70">
          <div className="flex items-center justify-between border-b border-border/70 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-red-400/50" />
              <span className="size-2 rounded-full bg-amber-400/50" />
              <span className="size-2 rounded-full bg-emerald-400/60" />
              <span className="num ml-2 flex items-center gap-1.5 text-[10px] tracking-[0.14em] text-muted-foreground">
                <MessageSquareQuote className="size-3" />
                CARBONIQ · NLP TERMINAL v1.4
              </span>
            </div>
            <span className="animate-pulse-dot size-1.5 rounded-full bg-primary" />
          </div>

          <div className="max-h-[52vh] space-y-4 overflow-y-auto p-4 sm:p-5">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[88%] rounded-xl px-4 py-3 text-sm leading-6",
                    m.role === "user"
                      ? "border border-primary/30 bg-primary/10 text-foreground"
                      : "border border-border/60 bg-foreground/[0.03] text-muted-foreground",
                  )}
                >
                  {m.role === "assistant" && (
                    <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-primary">
                      <Sparkles className="size-3" /> CarbonIQ
                    </div>
                  )}
                  <p>{m.text}</p>
                  {m.sources && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {m.sources.map((src) => (
                        <span
                          key={src}
                          className="num rounded border border-border/70 bg-foreground/[0.03] px-1.5 py-0.5 text-[10px] text-muted-foreground"
                        >
                          {src}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <div className="flex flex-wrap gap-1.5 border-t border-border/60 px-4 py-3">
            {SUGGESTIONS.map((sug) => (
              <button
                key={sug}
                type="button"
                onClick={() => send(sug)}
                className="rounded-full border border-border/70 bg-foreground/[0.03] px-3 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                {sug}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(draft);
            }}
            className="flex items-center gap-2 border-t border-border/60 p-3"
          >
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ask about mispricing, fair value, stress, evidence…"
              className="border-border/70 bg-foreground/[0.03] text-sm"
            />
            <Button
              type="submit"
              size="icon"
              className="shrink-0"
              disabled={!draft.trim()}
            >
              <Send className="size-4" />
            </Button>
          </form>
        </div>
      </main>

      <ScreenFoot />
    </div>
  );
}
