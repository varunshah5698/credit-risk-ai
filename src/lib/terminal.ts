/**
 * NLP answer engine for the CarbonIQ terminal.
 * Kept in lib (not in a component file) so both the full terminal screen and
 * the inline scan terminal can share it without breaking fast-refresh rules.
 */
import { fmtMoney, fmtPct, scoredCredits } from "@/lib/credits";

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

export function pickReply(q: string): { text: string; sources: string[] } {
  const s = q.toLowerCase();

  if (/(buy|cheap|accumulate|underpriced|discount)/.test(s)) {
    const candidates = scoredCredits.filter(
      (e) => e.risk.tier === "A" || e.risk.tier === "B",
    );
    const best = [...candidates].sort(
      (a, b) => a.risk.mispricingPct - b.risk.mispricingPct,
    )[0];
    return {
      text: `${best.credit.name} (${best.credit.id}) is the cleanest accumulation candidate: quoted ${fmtMoney(best.credit.price)} against a fair value of ${fmtMoney(best.risk.fairValue.point)} (${fmtPct(best.risk.mispricingPct)} vs the band), tier ${best.risk.tier} with a ${best.risk.score}/100 composite. Call: ${best.risk.recommendation} — ${best.risk.recommendationWhy}`,
      sources: best.risk.sources,
    };
  }

  if (/(overpriced|overvalue|avoid|expensive|sell)/.test(s)) {
    const worst = [...scoredCredits].sort(
      (a, b) => b.risk.mispricingPct - a.risk.mispricingPct,
    )[0];
    return {
      text: `${worst.credit.name} (${worst.credit.id}) is the most overpriced name on the book: ${fmtMoney(worst.credit.price)} vs fair value ${fmtMoney(worst.risk.fairValue.point)} — ${fmtPct(worst.risk.mispricingPct)} above the band, composite ${worst.risk.score}/100. Call: ${worst.risk.recommendation}. ${worst.risk.recommendationWhy}`,
      sources: worst.risk.sources,
    };
  }

  if (/(stress|downside|risk|worst|shock)/.test(s)) {
    const worst = scoredCredits
      .flatMap((e) => e.risk.stresses.map((x) => ({ ...x, entry: e })))
      .sort((a, b) => a.impactPct - b.impactPct)[0];
    return {
      text: `The largest modeled downside is "${worst.name}" on ${worst.entry.credit.id} (${worst.entry.credit.name}) at ${fmtPct(worst.impactPct)} of fair value — ${worst.detail}. Re-price the book under that shock in the what-if simulator on the Scans screen.`,
      sources: worst.entry.risk.sources,
    };
  }

  if (/(evidence|confiden|trust|verified)/.test(s)) {
    const ev = aggregateEvidence();
    const total = ev.verified + ev.estimated + ev.assumed + ev.uncertain;
    return {
      text: `${ev.verified} of ${total} evidence inputs (${Math.round((ev.verified / total) * 100)}%) are verified against primary sources; ${ev.assumed} are stated assumptions and ${ev.uncertain} remain open questions. The engine never upgrades an assumption into a fact — confidence tiers fall automatically as the open count rises.`,
      sources: ["Registry issuance ledger", "Verification reports", "Market trade tape"],
    };
  }

  if (/(fair value|worth|value|price)/.test(s)) {
    const top = scoredCredits[0];
    return {
      text: `Risk-adjusted fair value for ${top.credit.name} is ${fmtMoney(top.risk.fairValue.point)}/t (band ${fmtMoney(top.risk.fairValue.low)} – ${fmtMoney(top.risk.fairValue.high)}), derived from an evidence anchor discounted by its ${top.risk.score}/100 composite. Market quote: ${fmtMoney(top.credit.price)} — ${fmtPct(top.risk.mispricingPct)} vs fair value.`,
      sources: top.risk.sources,
    };
  }

  const tally = scoredCredits.reduce<Record<string, number>>((a, e) => {
    a[e.risk.recommendation] = (a[e.risk.recommendation] ?? 0) + 1;
    return a;
  }, {});
  const avg = Math.round(
    scoredCredits.reduce((a, e) => a + e.risk.score, 0) / scoredCredits.length,
  );
  return {
    text: `Book summary: ${scoredCredits.length} credits, average composite ${avg}/100. Calls: ${tally.BUY ?? 0} BUY · ${tally.HOLD ?? 0} HOLD · ${tally.NEGOTIATE ?? 0} NEGOTIATE · ${tally.AVOID ?? 0} AVOID. Ask me about mispricing, fair value, stress or evidence.`,
    sources: ["Registry issuance ledger", "Market trade tape"],
  };
}
