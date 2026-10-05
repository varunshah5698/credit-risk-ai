import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useAction } from "convex/react";
import { motion } from "framer-motion";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  CreditCard,
  FileText,
  Lock,
  Loader2,
  Plus,
  RefreshCw,
  ShieldCheck,
  X,
  Zap,
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
import { Separator } from "@/components/ui/separator";
import {
  assessRisk,
  fmtMoney,
  fmtPct,
  fmtTonnes,
  scoredCredits,
  type Credit,
} from "@/lib/credits";
import { cn } from "@/lib/utils";
import { RecommendationBadge, ScoreRing } from "@/components/credit-visuals";
import { CreditAnalyticsPanel } from "@/components/credit-analytics";
import { CreditDetailCard, WorkspaceNav } from "@/components/dashboard-shell";
import { api } from "@/convex/_generated/api";
import { STRIPE_KEY_TAIL, STRIPE_MODE } from "@/lib/stripe";

/* ===================== custody book (illustrative sample data) ===================== */

const QTY = [12_000, 8_000, 5_000, 3_000, 1_500];

const POSITIONS = scoredCredits.slice(0, 5).map((e, i) => ({
  credit: e.credit,
  risk: e.risk,
  tonnes: QTY[i],
  costBasis: Math.round(e.credit.price * (0.9 + i * 0.035) * 100) / 100,
}));

type TxnType = "BUY" | "SELL" | "RETIRE";

interface Txn {
  hash: string;
  type: TxnType;
  id: string;
  tonnes: number;
  usd: number;
  date: string;
  status: string;
}

const TRANSACTIONS: Txn[] = [
  { hash: "0x9f2c…a41d", type: "BUY", id: "VCS-1942", tonnes: 12_000, usd: 148_800, date: "2026-09-28 14:02 UTC", status: "SETTLED" },
  { hash: "0x71ab…09e2", type: "BUY", id: "ACR-5529", tonnes: 8_000, usd: 140_600, date: "2026-09-21 09:47 UTC", status: "SETTLED" },
  { hash: "0x3d80…bb17", type: "SELL", id: "GS-7703", tonnes: 4_500, usd: 42_975, date: "2026-09-14 16:20 UTC", status: "SETTLED" },
  { hash: "0xc44e…5f90", type: "RETIRE", id: "CAR-1140", tonnes: 2_000, usd: 15_600, date: "2026-09-02 11:08 UTC", status: "RETIRED" },
  { hash: "0x2a19…7c63", type: "BUY", id: "VCS-4408", tonnes: 3_000, usd: 61_200, date: "2026-08-25 08:31 UTC", status: "SETTLED" },
  { hash: "0x8e57…d2aa", type: "BUY", id: "GS-3311", tonnes: 1_500, usd: 20_400, date: "2026-08-11 13:55 UTC", status: "SETTLED" },
];

const TXN_BADGE: Record<TxnType, string> = {
  BUY: "border-emerald-300/35 bg-emerald-400/10 text-emerald-300",
  SELL: "border-amber-300/35 bg-amber-400/10 text-amber-300",
  RETIRE: "border-primary/40 bg-primary/10 text-primary",
};

/* ===================== /ledger — custody + transactions + retirement ===================== */

export function LedgerScreen() {
  const [retired, setRetired] = useState<string[]>(["CAR-1140"]);

  const heldTonnes = POSITIONS.reduce((a, p) => a + p.tonnes, 0);
  const marketValue = POSITIONS.reduce((a, p) => a + p.credit.price * p.tonnes, 0);
  const pnl = POSITIONS.reduce(
    (a, p) => a + (p.credit.price - p.costBasis) * p.tonnes,
    0,
  );
  const retiredTonnes = POSITIONS.filter((p) => retired.includes(p.credit.id)).reduce(
    (a, p) => a + p.tonnes,
    0,
  );

  const kpis = [
    { label: "Positions", value: String(POSITIONS.length), sub: `${fmtTonnes(heldTonnes)} t held` },
    { label: "Market value", value: fmtMoney(marketValue), sub: "marked to live tape" },
    {
      label: "Unrealized P&L",
      value: `${pnl >= 0 ? "+" : "−"}${fmtMoney(Math.abs(pnl))}`,
      sub: "vs cost basis",
      tone: pnl >= 0 ? "text-emerald-400" : "text-red-400",
    },
    { label: "Retired", value: `${fmtTonnes(retiredTonnes)} t`, sub: "claimed & out of circulation" },
  ];

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
          className="flex flex-wrap items-start justify-between gap-4"
        >
          <div>
            <div className="num text-[11px] font-medium uppercase tracking-[0.18em] text-primary">
              Ledger · custody
            </div>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Custody ledger
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Every simulated position, its cost basis, the live mark and the
              transaction chain behind it — plus the retirement state of each lot.
            </p>
          </div>
          <Button asChild className="gap-2">
            <Link to="/portfolio/new">
              <Plus className="size-4" /> Buy credits
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
              <div className={cn("num mt-1 text-xl font-bold tracking-tight", s.tone)}>
                {s.value}
              </div>
              <div className="num mt-0.5 text-[11px] text-muted-foreground/70">{s.sub}</div>
            </motion.div>
          ))}
        </section>

        <section className="glass mt-6 rounded-xl p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight">Positions</h2>
            <span className="num text-[11px] text-muted-foreground/60">
              {POSITIONS.length} lots · marked {new Date().toISOString().slice(0, 10)}
            </span>
          </div>
          <div className="space-y-2">
            {POSITIONS.map((p, i) => {
              const isRetired = retired.includes(p.credit.id);
              const pl = (p.credit.price - p.costBasis) * p.tonnes;
              const plPct = ((p.credit.price - p.costBasis) / p.costBasis) * 100;
              const up = pl >= 0;
              return (
                <motion.div
                  key={p.credit.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className={cn(
                    "flex flex-wrap items-center gap-x-5 gap-y-3 rounded-xl border p-4",
                    isRetired
                      ? "border-border/60 bg-foreground/[0.01] opacity-75"
                      : "border-border/70 bg-foreground/[0.02]",
                  )}
                >
                  <div className="min-w-[190px] flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold tracking-tight">{p.credit.name}</span>
                      <RecommendationBadge rec={p.risk.recommendation} />
                    </div>
                    <div className="num text-[11px] text-muted-foreground/70">
                      {p.credit.id} · {p.credit.registry} · {fmtTonnes(p.tonnes)} t @{" "}
                      {fmtMoney(p.costBasis)}
                    </div>
                  </div>
                  <div className="w-24">
                    <div className="num text-[10px] uppercase tracking-wider text-muted-foreground/60">
                      Mark
                    </div>
                    <div className="num text-sm font-semibold">
                      {fmtMoney(p.credit.price)}
                    </div>
                  </div>
                  <div className="w-28">
                    <div className="num text-[10px] uppercase tracking-wider text-muted-foreground/60">
                      Market value
                    </div>
                    <div className="num text-sm font-semibold">
                      {fmtMoney(p.credit.price * p.tonnes)}
                    </div>
                  </div>
                  <div className="w-36">
                    <div className="num text-[10px] uppercase tracking-wider text-muted-foreground/60">
                      Unrealized P&L
                    </div>
                    <div
                      className={cn(
                        "num inline-flex items-center gap-1 text-sm font-bold",
                        up ? "text-emerald-400" : "text-red-400",
                      )}
                    >
                      {up ? (
                        <ArrowUpRight className="size-3.5" />
                      ) : (
                        <ArrowDownRight className="size-3.5" />
                      )}
                      {fmtMoney(Math.abs(pl))}
                      <span className="text-[11px] font-medium opacity-80">
                        ({fmtPct(plPct)})
                      </span>
                    </div>
                  </div>
                  {isRetired ? (
                    <Badge className="border-transparent bg-primary/15 text-primary">
                      <Lock className="mr-1 size-3" /> Retired
                    </Badge>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRetired([...retired, p.credit.id])}
                    >
                      Retire lot
                    </Button>
                  )}
                </motion.div>
              );
            })}
          </div>
        </section>

        <Separator className="my-8" />

        <section className="grid gap-5 lg:grid-cols-3">
          <Card className="glass lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Transaction history</CardTitle>
              <CardDescription>
                Immutable chain of buys, sells and retirements in this simulated wallet.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {TRANSACTIONS.map((t) => (
                <div
                  key={t.hash}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-border/60 bg-foreground/[0.02] px-3 py-2.5"
                >
                  <Badge variant="outline" className={cn("num text-[10px]", TXN_BADGE[t.type])}>
                    {t.type}
                  </Badge>
                  <span className="num w-24 text-xs text-muted-foreground">{t.hash}</span>
                  <span className="num w-20 text-xs font-semibold">{t.id}</span>
                  <span className="num w-24 text-xs">{fmtTonnes(t.tonnes)} t</span>
                  <span className="num w-28 text-right text-xs">{fmtMoney(t.usd)}</span>
                  <span className="num flex-1 text-right text-[11px] text-muted-foreground/60">
                    {t.date}
                  </span>
                  <span
                    className={cn(
                      "num text-[10px] font-bold",
                      t.status === "RETIRED" ? "text-primary" : "text-emerald-400",
                    )}
                  >
                    {t.status}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <FileText className="size-4 text-primary" /> Digital ownership receipt
              </CardTitle>
              <CardDescription>Latest settled settlement in your custody.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { k: "Receipt", v: "RCPT-2026-0928-01" },
                { k: "Txn hash", v: TRANSACTIONS[0].hash },
                { k: "Credit", v: TRANSACTIONS[0].id },
                { k: "Amount", v: `${fmtTonnes(TRANSACTIONS[0].tonnes)} t` },
                { k: "Total", v: fmtMoney(TRANSACTIONS[0].usd) },
                { k: "Custody", v: "CarbonLedger (simulated)" },
              ].map((s) => (
                <div
                  key={s.k}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-foreground/[0.02] px-3 py-2"
                >
                  <span className="num text-[10px] uppercase tracking-wider text-muted-foreground/60">
                    {s.k}
                  </span>
                  <span className="num text-xs font-semibold">{s.v}</span>
                </div>
              ))}
              <p className="text-[11px] leading-5 text-muted-foreground/60">
                Sample data — no real asset, card or counterparty is involved in this
                pilot build.
              </p>
            </CardContent>
          </Card>
        </section>
      </main>

      <footer className="relative border-t border-border/60 py-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 text-xs text-muted-foreground/50 sm:flex-row sm:px-6">
          <span>CARBONIQ · financial intelligence, not investment advice</span>
          <span className="num">PILOT BUILD · SAMPLE DATA · CUSTODY SIMULATED</span>
        </div>
      </footer>
    </div>
  );
}

/* ===================== /portfolio/new — Stripe buy workflow ===================== */

/** Test-mode trading limit for the workflow; the server re-validates each order. */
const WALLET_BALANCE = 350_000;

interface Settlement {
  receipt: string;
  creditId: string;
  tonnes: number;
  amountUsd: number;
  paymentIntent: string | null;
}

export function BuySellWorkspace() {
  const [params] = useSearchParams();
  const preselect =
    scoredCredits.find((e) => e.credit.id === params.get("credit"))?.credit ?? null;

  const [phase, setPhase] = useState<"idle" | "chosen" | "execute" | "settled">(
    preselect ? "chosen" : "idle",
  );
  const [selected, setSelected] = useState<Credit | null>(preselect);
  const [tonnes, setTonnes] = useState(1_000);

  const createCheckout = useAction(api.payments.createCheckoutSession);
  const confirmCheckout = useAction(api.payments.confirmCheckoutSession);

  const [paying, setPaying] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [summary, setSummary] = useState<Settlement | null>(null);
  const confirmedRef = useRef<string | null>(null);

  const checkoutState = params.get("checkout");
  const checkoutSessionId = params.get("session_id");

  // Stripe redirects back with ?checkout=success&session_id=... — verify the
  // payment server-side and book the position before showing the receipt.
  useEffect(() => {
    if (
      checkoutState !== "success" ||
      !checkoutSessionId ||
      confirmedRef.current === checkoutSessionId
    ) {
      return;
    }
    confirmedRef.current = checkoutSessionId;
    setVerifying(true);
    setPayError(null);
    confirmCheckout({ sessionId: checkoutSessionId })
      .then((res) => {
        if (res.paid) {
          setSummary({
            receipt: res.receipt ?? "—",
            creditId: res.creditId ?? "—",
            tonnes: res.tonnes,
            amountUsd: res.amountUsd,
            paymentIntent: res.paymentIntent,
          });
          setPhase("settled");
        } else {
          setPayError(
            `Stripe reports this payment as "${res.status}" — no charge was captured.`,
          );
          setPhase(preselect ? "chosen" : "idle");
        }
      })
      .catch((err: unknown) => {
        setPayError(
          err instanceof Error ? err.message : "Could not confirm the Stripe payment.",
        );
        setPhase(preselect ? "chosen" : "idle");
      })
      .finally(() => setVerifying(false));
  }, [checkoutState, checkoutSessionId, confirmCheckout, preselect]);

  const unit = selected?.price ?? 0;
  const cost = unit * tonnes;
  const overBalance = cost > WALLET_BALANCE;

  const stepQty = (delta: number) =>
    setTonnes((t) => Math.min(10_000, Math.max(100, t + delta)));

  const reset = () => {
    setSelected(null);
    setTonnes(1_000);
    setPhase("idle");
    setPayError(null);
    setNotice(null);
    setSummary(null);
  };

  const advance = () => {
    if (phase === "idle") {
      setSelected(scoredCredits[0].credit);
      setPhase("chosen");
    } else if (phase === "chosen" && !overBalance) {
      setPhase("execute");
    }
  };

  const startCheckout = async () => {
    if (!selected) return;
    setPaying(true);
    setPayError(null);
    setNotice(null);
    try {
      const res = await createCheckout({
        creditId: selected.id,
        creditName: selected.name,
        registry: selected.registry,
        tonnes,
        pricePerTonne: unit,
        origin: window.location.origin,
      });
      // Open hosted Checkout in a new tab (previews render inside an iframe
      // that Stripe refuses to frame); fall back to same-tab if popups block.
      const opened = window.open(res.url, "_blank");
      if (opened) {
        setPaying(false);
        setNotice(
          "Stripe Checkout opened in a new tab — complete the payment there and you'll be returned to this flow with a server-verified receipt.",
        );
      } else {
        window.location.assign(res.url);
      }
    } catch (err) {
      setPayError(
        err instanceof Error ? err.message : "Stripe Checkout could not be started.",
      );
      setPaying(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-clip">
      <div className="pointer-events-none fixed inset-0 bg-grid opacity-60 [mask-image:radial-gradient(70%_50%_at_50%_0%,black,transparent)]" />
      <div className="pointer-events-none fixed -left-44 top-1/3 size-[440px] rounded-full bg-primary/6 blur-[130px]" />

      <WorkspaceNav />

      <main className="relative mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="num text-[11px] font-medium uppercase tracking-[0.18em] text-primary">
              Buy workflow · Stripe checkout
            </div>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {phase === "idle"
                ? "Pick a credit"
                : phase === "chosen"
                  ? "Due diligence & order"
                  : phase === "execute"
                    ? "Secure checkout"
                    : "Payment settled"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Card payments run through Stripe{" "}
              {STRIPE_MODE === "test"
                ? "(test mode — no real funds move)"
                : "(live mode)"}
              . Stripe confirms the charge to the server, the receipt is written to your
              account, and the position lands in your custody ledger.
            </p>
          </div>
          {phase === "settled" ? (
            <Button asChild className="gap-2">
              <Link to="/ledger">
                View ledger <ArrowRight className="size-4" />
              </Link>
            </Button>
          ) : phase === "execute" ? (
            <Badge
              variant="outline"
              className="border-primary/30 bg-primary/10 text-[10px] text-primary"
            >
              <CreditCard className="mr-1 size-3" />
              {STRIPE_MODE === "test" ? "STRIPE TEST MODE" : "STRIPE LIVE"} · pk_…{STRIPE_KEY_TAIL}
            </Badge>
          ) : (
            <Button
              onClick={advance}
              disabled={phase === "chosen" && overBalance}
              className="gap-2"
            >
              {phase === "idle" ? <Plus className="size-4" /> : <Zap className="size-4" />}
              {phase === "idle" ? "Open workflow" : "Continue to payment"}
            </Button>
          )}
        </header>

        <div className="mt-6 space-y-5">
          {verifying && (
            <div className="glass flex items-center gap-3 rounded-xl p-5 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin text-primary" />
              Confirming your Stripe payment with the server — this only takes a moment.
            </div>
          )}

          {payError && (
            <div className="rounded-xl border border-red-400/25 bg-red-500/[0.04] p-4 text-xs leading-5 text-red-300">
              {payError}
            </div>
          )}

          {notice && (
            <div className="rounded-xl border border-primary/25 bg-primary/[0.05] p-4 text-xs leading-5 text-primary/90">
              {notice}
            </div>
          )}

          {checkoutState === "cancelled" && phase !== "execute" && phase !== "settled" && (
            <div className="rounded-xl border border-amber-300/25 bg-amber-400/[0.04] p-4 text-xs leading-5 text-amber-200/90">
              Stripe Checkout was cancelled — no charge was made. Pick the credit again when
              you're ready to pay.
            </div>
          )}

          {phase === "idle" && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {scoredCredits.slice(0, 6).map((entry) => {
                const c = entry.credit;
                const r = entry.risk;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelected(c);
                      setPhase("chosen");
                    }}
                    className={cn(
                      "glass rounded-xl p-4 text-left transition-colors hover:border-primary/30",
                      r.recommendation === "AVOID" && "border-red-400/25",
                      r.recommendation === "BUY" && "border-emerald-300/25",
                      r.recommendation === "NEGOTIATE" && "border-amber-300/25",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <ScoreRing score={r.score} tier={r.tier} size={40} strokeWidth={4} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">{c.name}</div>
                        <div className="num text-[11px] text-muted-foreground/70">
                          {c.id} · {fmtMoney(c.price)}
                        </div>
                      </div>
                      <RecommendationBadge rec={r.recommendation} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {phase === "chosen" && (
            <div className="grid gap-5 lg:grid-cols-3">
              <div className="space-y-5 lg:col-span-2">
                {selected && <CreditDetailCard credit={selected} risk={assessRisk(selected)} />}
                {selected && <CreditAnalyticsPanel credit={selected} risk={assessRisk(selected)} />}
              </div>
              <div className="glass h-fit rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Order & payment</h4>
                  <Badge
                    variant="outline"
                    className="border-primary/30 bg-primary/10 text-[10px] text-primary"
                  >
                    <CreditCard className="mr-1 size-3" /> STRIPE{" "}
                    {STRIPE_MODE === "test" ? "TEST" : "LIVE"}
                  </Badge>
                </div>
                <div className="mt-4 space-y-3">
                  <div className="rounded-lg border border-border/60 bg-foreground/[0.02] p-3">
                    <div className="num text-[10px] uppercase tracking-wider text-muted-foreground/60">
                      Test-mode trading limit
                    </div>
                    <div className="num mt-1 text-lg font-bold">
                      {fmtMoney(WALLET_BALANCE)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border/60 bg-foreground/[0.02] p-3">
                    <div>
                      <div className="num text-[10px] uppercase tracking-wider text-muted-foreground/60">
                        Quantity
                      </div>
                      <div className="num mt-1 text-lg font-bold">
                        {fmtTonnes(tonnes)} t
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={() => stepQty(-500)}
                        disabled={tonnes <= 100}
                      >
                        <X className="size-3.5 rotate-45" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={() => stepQty(500)}
                        disabled={tonnes >= 10_000}
                      >
                        <Plus className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="rounded-lg border border-primary/25 bg-primary/5 p-3">
                    <div className="num text-[10px] uppercase tracking-wider text-primary/80">
                      Expected cost
                    </div>
                    <div className="num mt-1 text-lg font-bold text-primary">
                      {fmtMoney(cost)}
                    </div>
                    <div className="num text-[11px] text-muted-foreground/70">
                      {fmtMoney(unit)} per tonne
                    </div>
                  </div>
                  {overBalance && (
                    <p className="text-xs text-red-400">
                      Cost exceeds the test-mode trading limit — lower the quantity.
                    </p>
                  )}
                  {selected && (
                    <p className="num text-[11px] text-muted-foreground/60">
                      {fmtTonnes(selected.volumeAvailable)} t listed ·{" "}
                      {fmtTonnes(selected.monthlyVolume)} t traded in 30d
                    </p>
                  )}
                  <div className="flex gap-3">
                    <Button
                      className="flex-1 gap-2"
                      onClick={() => setPhase("execute")}
                      disabled={overBalance}
                    >
                      <CreditCard className="size-4" /> Continue to payment
                    </Button>
                    <Button variant="outline" onClick={reset}>
                      Change
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {phase === "execute" && selected && (
            <div className="glass rounded-xl p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="size-4 text-primary" />
                  <h4 className="text-sm font-semibold">Secure checkout · Stripe</h4>
                </div>
                <Badge
                  variant="outline"
                  className="border-primary/30 bg-primary/10 text-[10px] text-primary"
                >
                  {STRIPE_MODE === "test" ? "TEST MODE" : "LIVE"} · pk_…{STRIPE_KEY_TAIL}
                </Badge>
              </div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                You'll be redirected to Stripe's hosted checkout to pay by card.
                {STRIPE_MODE === "test" && (
                  <>
                    {" "}
                    Use test card{" "}
                    <span className="num text-foreground/80">4242 4242 4242 4242</span> with any
                    future expiry and CVC — test mode never moves real funds.
                  </>
                )}{" "}
                The server verifies the session and writes the receipt to your account before the
                position is booked.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { label: "Credit", value: selected.id },
                  { label: "Company", value: selected.name },
                  { label: "Quantity", value: `${fmtTonnes(tonnes)} t` },
                  { label: "Price per tonne", value: fmtMoney(unit) },
                  { label: "Total due", value: fmtMoney(cost) },
                  { label: "Processor", value: "Stripe · card" },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-xl border border-border/60 bg-foreground/[0.02] p-3"
                  >
                    <div className="num text-[10px] uppercase tracking-wider text-muted-foreground/60">
                      {s.label}
                    </div>
                    <div className="num mt-1 truncate text-sm font-bold">{s.value}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-3">
                <Button className="flex-1 gap-2" onClick={startCheckout} disabled={paying}>
                  {paying ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <CreditCard className="size-4" />
                  )}
                  {paying ? "Opening Stripe…" : `Pay ${fmtMoney(cost)} with Stripe`}
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => setPhase("chosen")}
                  disabled={paying}
                >
                  <RefreshCw className="size-4" /> Back
                </Button>
              </div>
            </div>
          )}

          {phase === "settled" && (
            <div className="glass space-y-4 rounded-xl border border-emerald-300/25 p-5">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
                  <CheckCircle2 className="size-5" />
                </span>
                <div>
                  <h4 className="text-sm font-semibold">
                    Payment settled — position recorded to your account
                  </h4>
                  <p className="num text-[11px] text-muted-foreground/70">
                    Stripe {summary?.paymentIntent ?? "checkout"} · verified server-side ·
                    receipt issued
                  </p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { label: "Credit", value: summary?.creditId ?? selected?.id ?? "—" },
                  { label: "Amount", value: `${fmtTonnes(summary?.tonnes ?? tonnes)} t` },
                  { label: "Total paid", value: fmtMoney(summary?.amountUsd ?? cost) },
                  { label: "Method", value: "Stripe · card" },
                  { label: "Receipt", value: summary?.receipt ?? "—" },
                  { label: "Status", value: "PAID" },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-xl border border-border/60 bg-foreground/[0.02] p-3"
                  >
                    <div className="num text-[10px] uppercase tracking-wider text-muted-foreground/60">
                      {s.label}
                    </div>
                    <div className="num mt-1 truncate text-sm font-bold">{s.value}</div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild className="gap-2">
                  <Link to="/ledger">
                    Open custody ledger <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button variant="outline" className="gap-2" onClick={reset}>
                  <RefreshCw className="size-4" /> Run another trade
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="relative border-t border-border/60 py-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 text-xs text-muted-foreground/50 sm:flex-row sm:px-6">
          <span>CARBONIQ · financial intelligence, not investment advice</span>
          <span className="num">PILOT BUILD · SAMPLE DATA · STRIPE TEST MODE</span>
        </div>
      </footer>
    </div>
  );
}
