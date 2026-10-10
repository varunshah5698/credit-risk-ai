/**
 * CarbonLens v1 — mock dataset + transparent risk scoring engine.
 * All data is illustrative sample data for the v1 prototype.
 */

export type Registry = "Verra (VCS)" | "Gold Standard" | "ACR" | "CAR";
export type ProjectType =
  | "REDD+"
  | "ARR"
  | "Cookstoves"
  | "Biochar"
  | "Improved Forest Management"
  | "Direct Air Capture"
  | "Wind";
export type Region =
  | "Latin America"
  | "Africa"
  | "Southeast Asia"
  | "North America"
  | "Europe";

export interface Credit {
  id: string;
  name: string;
  registry: Registry;
  type: ProjectType;
  region: Region;
  country: string;
  /** USD per tonne CO2e — current visible market price */
  price: number;
  /** 12-month price change, percent */
  priceChange: number;
  /** Monthly midpoint prices, last 12 months */
  priceHistory: number[];
  /** tonnes CO2e currently listed */
  volumeAvailable: number;
  /** 30-day traded tonnes on marketplaces */
  monthlyVolume: number;
  /** vintages available */
  vintages: number[];
  /** 0–100: quality & integrity of issued credits */
  carbonIntegrity: number;
  /** 0–100: delivery probability of the emission reduction */
  deliveryConfidence: number;
  /** 0–100: how easily you can exit the position */
  liquidity: number;
  /** 0–100: alignment with CORSIA/ICVCM/voluntary-market rules */
  regulatoryEligibility: number;
  /** 0–100: issuer & developer track record */
  issuerCredibility: number;
  /** 0–100: strength & independence of MRV (monitoring, reporting, verification) */
  mrv: number;
  /** 0–100: resilience to natural, political & market shocks */
  stability: number;
  /** short analyst notes surfaced on the card */
  flags: string[];
}

export interface ScoreBreakdown {
  key: string;
  label: string;
  value: number;
  weight: number;
}

export interface EvidenceLayer {
  /** items verified against primary sources */
  verified: number;
  /** model-derived estimates */
  estimated: number;
  /** stated assumptions */
  assumed: number;
  /** open questions / unresolved */
  uncertain: number;
}

export interface StressScenario {
  name: string;
  detail: string;
  /** impact on fair value, percent (negative = downside) */
  impactPct: number;
}

export type Recommendation = "BUY" | "HOLD" | "NEGOTIATE" | "AVOID";

/* ------------------------------------------------------------------ *
 * Three deliberately separate measurements.
 *
 * 1. score / tier   — how RISKY the credit looks (higher score = safer).
 * 2. evidenceConfidence — how RELIABLE the supporting evidence is.
 * 3. evidenceCoverage   — how many required checks have usable evidence.
 *
 * (2) and (3) are computed ONLY from the per-factor evidence checks, never
 * from the risk tier. A high-scoring credit with thin evidence must show weak
 * confidence, and a low-scoring credit backed by primary records must show
 * strong confidence. Missing evidence never earns a reassuring number.
 * ------------------------------------------------------------------ */

export type FactorKey =
  | "carbonIntegrity"
  | "deliveryConfidence"
  | "liquidity"
  | "regulatoryEligibility"
  | "issuerCredibility"
  | "mrv";

/** Ordered list of the six required checks behind every assessment. */
export const FACTOR_ORDER: FactorKey[] = [
  "carbonIntegrity",
  "deliveryConfidence",
  "liquidity",
  "regulatoryEligibility",
  "issuerCredibility",
  "mrv",
];

export const FACTOR_LABELS: Record<FactorKey, string> = {
  carbonIntegrity: "Carbon integrity",
  deliveryConfidence: "Delivery confidence",
  liquidity: "Liquidity",
  regulatoryEligibility: "Regulatory eligibility",
  issuerCredibility: "Issuer credibility",
  mrv: "MRV quality",
};

/**
 * Evidence state for one required check.
 * `uncertain` = an open question, `missing` = nothing on file. Neither counts
 * as usable evidence for coverage, and neither earns confidence.
 */
export type EvidenceStatus =
  | "verified"
  | "estimated"
  | "assumed"
  | "uncertain"
  | "missing";

/** How much a single check contributes to evidence confidence (0–1). */
export const STATUS_QUALITY: Record<EvidenceStatus, number> = {
  verified: 1,
  estimated: 0.6,
  assumed: 0.3,
  uncertain: 0.1,
  missing: 0,
};

/** Evidence counts as usable when there is *something* on file for the check. */
export const STATUS_IS_USABLE: Record<EvidenceStatus, boolean> = {
  verified: true,
  estimated: true,
  assumed: true,
  uncertain: false,
  missing: false,
};

export interface CheckRecord {
  key: FactorKey;
  label: string;
  status: EvidenceStatus;
  /** the risk factor's own 0–100 input, for context next to its evidence */
  factorValue: number;
  weight: number;
  quality: number;
  usable: boolean;
}

export type ValuationConfidence = "sufficient" | "limited" | "insufficient";

export interface ValuationAdjustment {
  label: string;
  detail: string;
  /** USD/t applied to move from anchor to fair value (null = context row) */
  effectUsd: number | null;
}

/**
 * Everything a reviewer needs to reproduce and challenge one valuation.
 * Every field maps to a real step in the calculation — nothing illustrative.
 */
export interface ValuationDetail {
  /** `market` means the quote was used as its own anchor (circular — not defensible) */
  anchorKind: "evidence" | "market" | "none";
  anchorSource: string;
  anchorValueUsd: number | null;
  adjustments: ValuationAdjustment[];
  pointUsd: number;
  lowUsd: number;
  highUsd: number;
  marketQuoteUsd: number;
  /** ISO date the quote refers to */
  quoteAsOf: string;
  quoteIsSample: boolean;
  /** null when confidence is insufficient — no defensible mispricing exists */
  mispricingPct: number | null;
  mispricingRule: string;
  recommendationRule: string;
  confidence: ValuationConfidence;
  confidenceWhy: string;
  missingEvidence: string[];
  assumptions: string[];
}

export interface RiskAssessment {
  score: number; // 0–100, higher = safer
  tier: "A" | "B" | "C" | "D";
  tierLabel: "Prime" | "Investment Grade" | "Watch" | "High Risk";
  breakdown: ScoreBreakdown[];
  /** derived from evidenceConfidence, NOT from the tier */
  confidence: "High" | "Medium" | "Low";
  /** 0–100 — reliability/sufficiency of the evidence behind the assessment */
  evidenceConfidence: number;
  /** 0–100 — share of required checks carrying usable evidence */
  evidenceCoverage: number;
  /** per-check evidence state, drives confidence and coverage */
  checks: CheckRecord[];
  /** risk-adjusted fair value range, USD per tonne */
  fairValue: { low: number; point: number; high: number };
  /** + = market priced above fair value (overpriced). Mechanical value — gate UI on `valuation.confidence`. */
  mispricingPct: number;
  recommendation: Recommendation;
  recommendationWhy: string;
  valuation: ValuationDetail;
  evidence: EvidenceLayer;
  stresses: StressScenario[];
  /** primary sources feeding this assessment */
  sources: string[];
}

const WEIGHTS = {
  carbonIntegrity: 0.22,
  deliveryConfidence: 0.2,
  liquidity: 0.16,
  regulatoryEligibility: 0.16,
  issuerCredibility: 0.14,
  mrv: 0.12,
} as const;

function tierFor(score: number): RiskAssessment["tier"] {
  if (score >= 78) return "A";
  if (score >= 62) return "B";
  if (score >= 45) return "C";
  return "D";
}

function tierMeta(tier: RiskAssessment["tier"]): Pick<RiskAssessment, "tierLabel"> {
  switch (tier) {
    case "A":
      return { tierLabel: "Prime" as const };
    case "B":
      return { tierLabel: "Investment Grade" as const };
    case "C":
      return { tierLabel: "Watch" as const };
    case "D":
      return { tierLabel: "High Risk" as const };
  }
}

/**
 * Evidence confidence is derived from the per-factor checks alone.
 * It deliberately ignores the risk score and tier: a Prime credit backed only
 * by assumptions still scores low here.
 */
export function computeEvidenceConfidence(checks: CheckRecord[]): number {
  if (checks.length === 0) return 0;
  // Checks are weighted by their risk-engine importance, so a thin MRV file on
  // an MRV-heavy credit costs more confidence than a thin liquidity file.
  const totalWeight = checks.reduce((a, c) => a + c.weight, 0) || 1;
  const weighted = checks.reduce((a, c) => a + c.quality * c.weight, 0);
  return Math.round((weighted / totalWeight) * 100);
}

/** Share of required checks carrying usable (non-missing, non-uncertain) evidence. */
export function computeEvidenceCoverage(checks: CheckRecord[]): number {
  if (checks.length === 0) return 0;
  return Math.round(
    (checks.filter((c) => c.usable).length / checks.length) * 100,
  );
}

/** Confidence band. Independent of score and tier by construction. */
export function confidenceBand(evidenceConfidence: number): "High" | "Medium" | "Low" {
  if (evidenceConfidence >= 70) return "High";
  if (evidenceConfidence >= 45) return "Medium";
  return "Low";
}

/** Thresholds at which a fair-value estimate may be presented as defensible. */
const VALUATION_SUFFICIENT_CONF = 60;
const VALUATION_SUFFICIENT_COVER = 80;
const VALUATION_LIMITED_CONF = 40;
const VALUATION_LIMITED_COVER = 50;

export function valuationConfidenceFor(
  anchorKind: ValuationDetail["anchorKind"],
  evidenceConfidence: number,
  evidenceCoverage: number,
): ValuationConfidence {
  // Without an independent anchor the quote is its own benchmark, so no
  // mispricing claim can be made no matter how good the evidence file is.
  if (anchorKind === "none" || anchorKind === "market") return "insufficient";
  if (
    evidenceConfidence >= VALUATION_SUFFICIENT_CONF &&
    evidenceCoverage >= VALUATION_SUFFICIENT_COVER
  ) {
    return "sufficient";
  }
  if (
    evidenceConfidence >= VALUATION_LIMITED_CONF &&
    evidenceCoverage >= VALUATION_LIMITED_COVER
  ) {
    return "limited";
  }
  return "insufficient";
}

function buildChecks(
  statuses: readonly EvidenceStatus[],
  breakdown: ScoreBreakdown[],
): CheckRecord[] {
  return breakdown.map((b, i) => {
    const key = b.key as FactorKey;
    const status: EvidenceStatus = statuses[i] ?? "missing";
    return {
      key,
      label: b.label,
      status,
      factorValue: b.value,
      weight: b.weight,
      quality: STATUS_QUALITY[status],
      usable: STATUS_IS_USABLE[status],
    };
  });
}

/** Quote date shared by every sample quote in the static dataset. */
export const SAMPLE_QUOTE_AS_OF = new Date().toISOString().slice(0, 10);

/** Per-credit financial-intelligence inputs (illustrative sample data). */
interface CreditIntel {
  /**
   * Evidence-anchored intrinsic value before risk adjustment, USD/t.
   * `null` means no independent anchor exists — valuation is then flagged
   * insufficient rather than quietly falling back to the market quote.
   */
  anchorValue: number | null;
  /** half-width of the fair-value band, fraction */
  spread: number;
  evidence: EvidenceLayer;
  stresses: StressScenario[];
  /** override the rule-derived recommendation where the story demands it */
  rec?: Recommendation;
  recWhy: string;
  sources: string[];
}

/**
 * Used only for a credit id that has no intel entry on file. Deliberately has
 * no anchor: falling back to the market quote would let the quote "prove" its
 * own mispricing, which is the failure mode this model refuses to run.
 */
const DEFAULT_INTEL: CreditIntel = {
  anchorValue: null,
  spread: 0.12,
  evidence: { verified: 0, estimated: 0, assumed: 0, uncertain: 0 },
  stresses: [],
  recWhy:
    "No independent valuation anchor is on file for this credit, so no fair-value or mispricing call is made.",
  sources: ["No source records on file"],
};

const INTEL: Record<string, CreditIntel> = {
  "VCS-1942": {
    anchorValue: 13.1,
    spread: 0.1,
    evidence: { verified: 34, estimated: 9, assumed: 4, uncertain: 2 },
    stresses: [
      { name: "Methodology revision", detail: "VCS REDD+ methodology tightened", impactPct: -12 },
      { name: "Market-wide selloff", detail: "Segment prices fall 30%", impactPct: -18 },
    ],
    recWhy: "Verified delivery history and deep 30-day turnover keep exit risk low, and the quote sits only a hair above fair value — close enough that the premium argues for negotiating rather than paying the ask.",
    sources: ["Registry issuance ledger", "2024 verification report", "Market trade tape"],
  },
  "GS-7703": {
    anchorValue: 11.4,
    spread: 0.14,
    evidence: { verified: 18, estimated: 11, assumed: 7, uncertain: 6 },
    stresses: [
      { name: "Methodology downgrade", detail: "Revision removes baseline improvements", impactPct: -31 },
      { name: "Leakage event", detail: "Deforestation displaces to buffer zone", impactPct: -24 },
    ],
    recWhy: "Trades near the top of its fair-value band while a methodology revision is still unresolved — the market has not priced the downside.",
    sources: ["Registry issuance ledger", "Methodology consultation draft", "Trade tape"],
  },
  "GS-3311": {
    anchorValue: 13.6,
    spread: 0.12,
    evidence: { verified: 26, estimated: 12, assumed: 5, uncertain: 4 },
    stresses: [
      { name: "Usage audit miss", detail: "Daily-use surveys fall below 60% benchmark", impactPct: -22 },
      { name: "Distribution audit", detail: "Serialised stove IDs unverified for 18% of units", impactPct: -15 },
    ],
    recWhy: "Priced far above risk-adjusted value for the evidence behind it: the issuer is credible, but usage-survey evidence is thinner than peers' and does not support the premium the tape is asking.",
    sources: ["Registry issuance ledger", "Independent usage survey", "Issuer disclosures"],
  },
  "ACR-5529": {
    anchorValue: 17.2,
    spread: 0.09,
    evidence: { verified: 31, estimated: 8, assumed: 3, uncertain: 2 },
    stresses: [
      { name: "Wildfire reversal", detail: "Buffer pool contribution rises", impactPct: -9 },
      { name: "Demand shift", detail: "Buyers move to durable removals", impactPct: -14 },
    ],
    recWhy: "Inventory-verified carbon stock and a long permanence buffer make this one of the strongest credits on the book — but the quote already pays well above the risk-adjusted value for that quality. The quality is not the issue, the entry price is.",
    sources: ["Registry inventory audit", "Verification report", "Market trade tape"],
  },
  "VCS-8817": {
    anchorValue: 88.0,
    spread: 0.16,
    evidence: { verified: 29, estimated: 10, assumed: 4, uncertain: 3 },
    stresses: [
      { name: "Offtake non-renewal", detail: "Anchor corporate buyer exits", impactPct: -27 },
      { name: "Liquidity shock", detail: "Exit discount widens to 20%", impactPct: -21 },
    ],
    recWhy: "Premium quality, but the current quote sits well above fair value and the float is too thin to exit quickly at scale.",
    sources: ["Registry issuance ledger", "Offtake disclosures", "Broker quotes"],
  },
  "CAR-1140": {
    anchorValue: 12.6,
    spread: 0.18,
    evidence: { verified: 9, estimated: 14, assumed: 11, uncertain: 9 },
    stresses: [
      { name: "Improper-improvement finding", detail: "Regulator questions baseline claims", impactPct: -44 },
      { name: "Wildfire year", detail: "Two large reversal events", impactPct: -26 },
      { name: "Vintage discount widens", detail: "Old vintages trade at 40% off", impactPct: -18 },
    ],
    recWhy: "Even the cheap quote is expensive: integrity findings, aged vintages and heavy oversupply put fair value far below the market.",
    sources: ["Regulatory findings", "Registry retirement data", "Trade tape"],
  },
  "GS-9902": {
    anchorValue: 7.1,
    spread: 0.11,
    evidence: { verified: 22, estimated: 10, assumed: 6, uncertain: 5 },
    stresses: [
      { name: "Additionality challenge", detail: "Review rules issuance ineligible", impactPct: -38 },
      { name: "Grid-factor revision", detail: "Baseline emissions fall", impactPct: -16 },
    ],
    recWhy: "An additionality review is open and would invalidate future issuance — the tail risk is not reflected in the quote.",
    sources: ["Registry review docket", "Grid emission factors", "Trade tape"],
  },
  "VCS-4408": {
    anchorValue: 19.4,
    spread: 0.13,
    evidence: { verified: 21, estimated: 13, assumed: 6, uncertain: 5 },
    stresses: [
      { name: "Typhoon season", detail: "Plantation loss above buffer capacity", impactPct: -29 },
      { name: "Track-record haircut", detail: "Third year of issuance missed", impactPct: -19 },
    ],
    recWhy: "Strong co-benefits and eligible methodology, but a two-year-old project with cyclone exposure deserves a wider discount than the market is giving.",
    sources: ["Registry issuance ledger", "Satellite canopy indices", "Developer disclosures"],
  },
  "ACR-8861": {
    anchorValue: 305.0,
    spread: 0.2,
    evidence: { verified: 24, estimated: 12, assumed: 4, uncertain: 2 },
    stresses: [
      { name: "Cost curve drop", detail: "DAC energy costs fall 40%", impactPct: -18 },
      { name: "Policy retreat", detail: "Purchase incentives lapse", impactPct: -23 },
    ],
    recWhy: "Highest-integrity removal on the board, and nothing about the project itself is in question — but the quote sits well above what even that quality supports, and with very thin float the premium is hard to exit. Quality is not the issue, the entry price is.",
    sources: ["Registry issuance ledger", "Storage certification", "Broker quotes"],
  },
  "VCS-2260": {
    anchorValue: 9.8,
    spread: 0.15,
    evidence: { verified: 14, estimated: 12, assumed: 8, uncertain: 7 },
    stresses: [
      { name: "Audit finding", detail: "Developer audit confirms over-issuance", impactPct: -34 },
      { name: "Fire season", detail: "Reversal exceeds buffer pool", impactPct: -22 },
    ],
    recWhy: "An open developer audit and rising fire exposure cap what this credit is worth — negotiate hard or walk.",
    sources: ["Audit engagement letter", "Registry issuance ledger", "Satellite fire alerts"],
  },

  /* ---- second cohort: 12 real-world projects and programmes ---- */
  "VCS-674": {
    anchorValue: 12.9,
    spread: 0.1,
    evidence: { verified: 38, estimated: 9, assumed: 3, uncertain: 2 },
    stresses: [
      { name: "Registry suspension scare", detail: "Issuance halted pending review, later reinstated", impactPct: -15 },
      { name: "REDD+ segment discount", detail: "Buyers rotate into removals", impactPct: -20 },
      { name: "Buffer-pool release", detail: "Unplanned peat reversal draw", impactPct: -8 },
    ],
    recWhy: "ICVCM CCP endorsement and one of the deepest floats in REDD+ keep it close to fair value; the 2024 registry halt is a reminder that policy risk is live.",
    sources: ["Verra registry record VCS-674", "ICVCM assessment", "Market trade tape"],
  },
  "VCS-612": {
    anchorValue: 10.2,
    spread: 0.11,
    evidence: { verified: 33, estimated: 10, assumed: 4, uncertain: 3 },
    stresses: [
      { name: "Benefit-sharing dispute", detail: "Community revenue split challenged in court", impactPct: -18 },
      { name: "Wildlife corridor encroachment", detail: "Charcoal pressure on the corridor", impactPct: -12 },
    ],
    recWhy: "The original VCS REDD+ project with a verified delivery record, but the quote has drifted above the band — negotiate rather than chase.",
    sources: ["Verra registry record VCS-612", "Wildlife Works disclosures", "Market trade tape"],
  },
  "VCS-902": {
    anchorValue: 6.4,
    spread: 0.22,
    evidence: { verified: 8, estimated: 12, assumed: 10, uncertain: 14 },
    stresses: [
      { name: "Investigation findings", detail: "Over-crediting probe settles against the project", impactPct: -45 },
      { name: "Buyer contract cancellations", detail: "Anchor offtakers walk away", impactPct: -30 },
      { name: "Legal disputes", detail: "Carbon-revenue litigation in multiple venues", impactPct: -22 },
    ],
    rec: "AVOID",
    recWhy: "The 2023 over-crediting investigation still caps what these certificates can be worth — any quote in the mid single digits is paying for integrity the market has not finished repricing.",
    sources: ["Investigation reporting", "Registry review docket", "Distressed sell-side tape"],
  },
  "VCS-1748": {
    anchorValue: 12.6,
    spread: 0.14,
    evidence: { verified: 24, estimated: 11, assumed: 6, uncertain: 6 },
    stresses: [
      { name: "Rights review", detail: "Independent human-rights findings trigger safeguards audit", impactPct: -26 },
      { name: "Enforcement funding gap", detail: "Ranger programme funding lapses", impactPct: -18 },
    ],
    recWhy: "CCP approval supports the value, but the outstanding rights review keeps a discount attached — hold near fair value, don't pay a premium.",
    sources: ["Verra registry record VCS-1748", "Safeguards audit filings", "Wildlife Alliance reporting"],
  },
  "VCS-934": {
    anchorValue: 5.4,
    spread: 0.2,
    evidence: { verified: 10, estimated: 12, assumed: 9, uncertain: 12 },
    stresses: [
      { name: "Investigation outcome", detail: "Over-issuance findings force credit cancellations", impactPct: -35 },
      { name: "Community displacement claims", detail: "Free, prior and informed consent failings", impactPct: -25 },
      { name: "Vintage overhang selloff", detail: "Legacy vintages flood the tape", impactPct: -20 },
    ],
    rec: "AVOID",
    recWhy: "Even a discounted quote is too high: over-issuance findings, consent failures and a legacy-vintage overhang put fair value near the low single digits.",
    sources: ["Investigation reporting", "Registry issuance ledger", "Market trade tape"],
  },
  "VCS-985": {
    anchorValue: 15.1,
    spread: 0.1,
    evidence: { verified: 36, estimated: 9, assumed: 4, uncertain: 2 },
    stresses: [
      { name: "Road infrastructure pressure", detail: "New access roads lift deforestation inside the buffer", impactPct: -14 },
      { name: "Concession policy shift", detail: "Protected-area rules loosen", impactPct: -11 },
    ],
    recWhy: "Trades essentially at risk-adjusted value: an elite delivery record across a 3.4M-hectare park, with infrastructure pressure inside the buffer as the live watch item.",
    sources: ["Verra registry record VCS-985", "Park authority monitoring reports", "Satellite canopy index"],
  },
  "VCS-944": {
    anchorValue: 13.3,
    spread: 0.12,
    evidence: { verified: 28, estimated: 10, assumed: 5, uncertain: 4 },
    stresses: [
      { name: "Coffee expansion", detail: "Smallholder planting pressure at the forest edge", impactPct: -16 },
      { name: "Road access & migration", detail: "New access routes raise settlement pressure", impactPct: -12 },
    ],
    recWhy: "Eight years below baseline is a strong record, but pricing is ahead of the band — negotiate toward the low-$11s before committing.",
    sources: ["Verra registry record VCS-944", "Conservation International disclosures", "Satellite canopy index"],
  },
  "VCS-2250": {
    anchorValue: 29.0,
    spread: 0.13,
    evidence: { verified: 30, estimated: 11, assumed: 5, uncertain: 3 },
    stresses: [
      { name: "Monsoon die-back", detail: "Planted mangroves lost above buffer capacity", impactPct: -17 },
      { name: "Sea-level & salinity shift", detail: "Delta hydrology changes faster than modelled", impactPct: -15 },
      { name: "Blue-carbon premium softening", detail: "Corporate demand rotates to cheaper removals", impactPct: -19 },
    ],
    recWhy: "The blue-carbon premium is real but the quote has run ahead of delivery data — negotiate toward the mid-$25s.",
    sources: ["Verra registry record VCS-2250", "Delta restoration monitoring", "Market trade tape"],
  },
  "VCS-1402": {
    anchorValue: 12.9,
    spread: 0.13,
    evidence: { verified: 25, estimated: 10, assumed: 6, uncertain: 5 },
    stresses: [
      { name: "Drought & livestock pressure", detail: "Multi-year drought lifts grazing intensity", impactPct: -20 },
      { name: "Benefit-sharing disputes", detail: "Landowner revenue split renegotiated", impactPct: -15 },
    ],
    recWhy: "Fairly priced for a community-led project with a transparent revenue model; drought years are the swing factor, not the price.",
    sources: ["Verra registry record VCS-1402", "Maasai landowner agreements", "Rainfall & pasture indices"],
  },
  "VCS-1052": {
    anchorValue: 17.8,
    spread: 0.11,
    evidence: { verified: 32, estimated: 9, assumed: 4, uncertain: 3 },
    stresses: [
      { name: "Wildfire season severity", detail: "Record fire weather reverses forest gains", impactPct: -22 },
      { name: "Harvest-rule changes", detail: "Provincial logging policy shifts", impactPct: -13 },
    ],
    recWhy: "Premium management quality under First Nations stewardship, but the quote is ahead of the band — wildfire severity is the discount driver.",
    sources: ["Verra registry record VCS-1052", "Provincial harvest data", "Fire-weather indices"],
  },
  "VCS-1737": {
    anchorValue: 11.2,
    spread: 0.17,
    evidence: { verified: 19, estimated: 12, assumed: 7, uncertain: 8 },
    stresses: [
      { name: "Carbon-rights litigation", detail: "State and developer claims over credit ownership", impactPct: -28 },
      { name: "Enforcement gap", detail: "Illegal clearing rises inside the project", impactPct: -19 },
      { name: "Vintage discount", detail: "Older vintages trade at a widening spread", impactPct: -14 },
    ],
    recWhy: "The cash price sits inside the band, but Pará carbon-rights litigation keeps the bottom of the range uncertain — hold until title risk clears.",
    sources: ["Court docket summaries", "Registry issuance ledger", "Deforestation alerts"],
  },
  "VCS-1627": {
    anchorValue: 17.0,
    spread: 0.16,
    evidence: { verified: 22, estimated: 11, assumed: 6, uncertain: 5 },
    stresses: [
      { name: "Hurricane exposure", detail: "Storm damage exceeds buffer allocation", impactPct: -24 },
      { name: "Harvest-timing slippage", detail: "Rotation pushes delivery past contract dates", impactPct: -15 },
    ],
    recWhy: "Timber-backed removals with genuine co-benefits, but buyers are paying above delivery-probability-adjusted value — negotiate.",
    sources: ["Verra registry record VCS-1627", "FSC & CCB audits", "Nursery survival surveys"],
  },
};

/**
 * Evidence state for the six required checks on every credit, in FACTOR_ORDER.
 *
 * This map is the ONLY input to evidenceConfidence and evidenceCoverage — which
 * is what keeps those two measurements independent of the risk score and tier.
 * Sample data: statuses describe what is on file in this prototype's evidence
 * file, not a live registry feed.
 *
 * `uncertain` = open question, `missing` = nothing on file. Neither counts as
 * usable evidence, and neither earns confidence — a gap is never reassuring.
 */
const CHECKS_BY_ID: Record<string, readonly EvidenceStatus[]> = {
  /* ---- original cohort ---- */
  "VCS-1942": ["verified", "verified", "estimated", "verified", "verified", "verified"],
  "GS-7703": ["estimated", "estimated", "assumed", "uncertain", "estimated", "assumed"],
  "GS-3311": ["verified", "estimated", "estimated", "verified", "verified", "uncertain"],
  "ACR-5529": ["verified", "verified", "estimated", "verified", "verified", "verified"],
  "VCS-8817": ["verified", "verified", "assumed", "verified", "estimated", "verified"],
  "CAR-1140": ["uncertain", "assumed", "assumed", "missing", "assumed", "uncertain"],
  "GS-9902": ["uncertain", "verified", "assumed", "uncertain", "estimated", "assumed"],
  "VCS-4408": ["verified", "assumed", "estimated", "verified", "estimated", "estimated"],
  "ACR-8861": ["verified", "verified", "assumed", "verified", "verified", "verified"],
  "VCS-2260": ["uncertain", "assumed", "assumed", "estimated", "uncertain", "assumed"],

  /* ---- second cohort: 12 real-world projects and programmes ---- */
  "VCS-674": ["verified", "verified", "verified", "verified", "verified", "verified"],
  "VCS-612": ["verified", "verified", "verified", "verified", "verified", "verified"],
  "VCS-902": ["uncertain", "uncertain", "assumed", "missing", "uncertain", "missing"],
  "VCS-1748": ["verified", "estimated", "assumed", "verified", "estimated", "estimated"],
  "VCS-934": ["uncertain", "uncertain", "missing", "assumed", "uncertain", "missing"],
  "VCS-985": ["verified", "verified", "verified", "verified", "verified", "verified"],
  "VCS-944": ["verified", "verified", "verified", "verified", "verified", "verified"],
  "VCS-2250": ["verified", "verified", "verified", "verified", "verified", "verified"],
  "VCS-1402": ["verified", "estimated", "assumed", "verified", "verified", "estimated"],
  "VCS-1052": ["verified", "verified", "verified", "verified", "verified", "verified"],
  "VCS-1737": ["uncertain", "estimated", "assumed", "uncertain", "uncertain", "assumed"],
  "VCS-1627": ["verified", "estimated", "assumed", "verified", "assumed", "estimated"],
};

/** Default for a credit with no checks on file: every check missing. */
const NO_CHECKS: readonly EvidenceStatus[] = [
  "missing",
  "missing",
  "missing",
  "missing",
  "missing",
  "missing",
];

/** Local money formatter. `fmtMoney` is a const declared later in this module, so
 *  calling it from `assessRisk` (which runs while `scoredCredits` initialises)
 *  would hit the temporal dead zone. Function declarations hoist, consts don't. */
function usd(n: number): string {
  return `$${n.toLocaleString("en-US", {
    minimumFractionDigits: n < 20 ? 2 : 0,
    maximumFractionDigits: n < 20 ? 2 : 0,
  })}`;
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const round1 = (n: number) => Math.round(n * 10) / 10;

/** Deterministic, explainable composite score + financial assessment. Higher score = lower risk. */
export function assessRisk(c: Credit): RiskAssessment {
  const breakdown: ScoreBreakdown[] = [
    { key: "carbonIntegrity", label: "Carbon integrity", value: c.carbonIntegrity, weight: WEIGHTS.carbonIntegrity },
    { key: "deliveryConfidence", label: "Delivery confidence", value: c.deliveryConfidence, weight: WEIGHTS.deliveryConfidence },
    { key: "liquidity", label: "Liquidity", value: c.liquidity, weight: WEIGHTS.liquidity },
    { key: "regulatoryEligibility", label: "Regulatory eligibility", value: c.regulatoryEligibility, weight: WEIGHTS.regulatoryEligibility },
    { key: "issuerCredibility", label: "Issuer credibility", value: c.issuerCredibility, weight: WEIGHTS.issuerCredibility },
    { key: "mrv", label: "MRV quality", value: c.mrv, weight: WEIGHTS.mrv },
  ];
  const score = Math.round(
    breakdown.reduce((acc, b) => acc + b.value * b.weight, 0),
  );
  const tier = tierFor(score);
  const { tierLabel } = tierMeta(tier);

  const intel = INTEL[c.id] ?? DEFAULT_INTEL;
  const checks = buildChecks(CHECKS_BY_ID[c.id] ?? NO_CHECKS, breakdown);

  /* ---- measurements 2 and 3: evidence confidence and coverage ----
   * Derived from `checks` only. Nothing here reads `score` or `tier`, so a
   * Prime credit with a thin file still reports low confidence. */
  const evidenceConfidence = computeEvidenceConfidence(checks);
  const evidenceCoverage = computeEvidenceCoverage(checks);
  const confidence = confidenceBand(evidenceConfidence);

  /* ---- valuation ---- */
  const anchorKind: ValuationDetail["anchorKind"] =
    intel.anchorValue == null ? "none" : "evidence";
  const anchorSource = intel.sources[0] ?? "No source record on file";
  const anchor = intel.anchorValue;
  const riskFactor = 0.4 + 0.6 * (score / 100);

  // With no independent anchor the quote is not discounted, it is simply not
  // benchmarked. Falling back to the quote here would let it prove itself, so
  // no band is invented either: without an anchor there is no range to claim.
  const point = anchor == null ? c.price : anchor * riskFactor;
  const fairValue =
    anchor == null
      ? { low: round2(c.price), point: round2(c.price), high: round2(c.price) }
      : {
          low: round2(point * (1 - intel.spread)),
          point: round2(point),
          high: round2(point * (1 + intel.spread)),
        };
  const mispricingPct = point === 0 ? 0 : ((c.price - point) / point) * 100;

  const valuationConfidence = valuationConfidenceFor(
    anchorKind,
    evidenceConfidence,
    evidenceCoverage,
  );

  const missingEvidence = checks
    .filter((ch) => ch.status === "missing" || ch.status === "uncertain")
    .map((ch) =>
      ch.status === "missing"
        ? `${ch.label}: no record on file`
        : `${ch.label}: open question`,
    );

  const confidenceWhy =
    anchorKind === "none"
      ? "No independent valuation anchor is on file, so the market quote cannot be benchmarked against itself."
      : valuationConfidence === "sufficient"
        ? `Evidence confidence ${evidenceConfidence}/100 with ${evidenceCoverage}% of required checks usable, meeting the sufficiency thresholds (at least 60 confidence and 80 coverage).`
        : valuationConfidence === "limited"
          ? `Evidence confidence ${evidenceConfidence}/100 with ${evidenceCoverage}% of required checks usable, below the sufficiency thresholds (60 confidence, 80 coverage), so the range is indicative rather than decision-grade.`
          : `Evidence confidence ${evidenceConfidence}/100 with only ${evidenceCoverage}% of required checks usable, below the minimum (40 confidence, 50 coverage), so no defensible fair value or mispricing figure exists.`;

  const adjustments: ValuationAdjustment[] =
    anchor == null
      ? [
          {
            label: "Evidence anchor",
            detail: "none on file, no risk discount applied",
            effectUsd: null,
          },
          {
            label: "Market quote",
            detail: `${usd(c.price)} per t, sample quote as of ${SAMPLE_QUOTE_AS_OF}`,
            effectUsd: null,
          },
        ]
      : [
          {
            label: "Evidence anchor",
            detail: `${anchorSource}, ${usd(anchor)} per t`,
            effectUsd: round2(anchor),
          },
          {
            label: "Composite risk discount",
            detail: `x${riskFactor.toFixed(2)} = 0.40 + 0.60 x (${score}/100)`,
            effectUsd: round2(point - anchor),
          },
          {
            label: "Evidence spread",
            detail: `+/-${Math.round(intel.spread * 100)}% around the point estimate`,
            effectUsd: null,
          },
          {
            label: "Market quote",
            detail: `${usd(c.price)} per t, sample quote as of ${SAMPLE_QUOTE_AS_OF}`,
            effectUsd: null,
          },
        ];

  const assumptions = [
    ...checks
      .filter((ch) => ch.status === "assumed")
      .map((ch) => `${ch.label}: stated assumption, not verified`),
    "Fair value = evidence anchor x (0.40 + 0.60 x composite/100).",
    `Fair-value band is +/-${Math.round(intel.spread * 100)}% around the point estimate.`,
    "Market quotes, price history and volumes are sample data for this pilot build.",
  ];

  const mispricingRule =
    valuationConfidence === "insufficient"
      ? "Not reported: no defensible anchor exists for this credit."
      : "(market quote - fair-value point) / fair-value point x 100";

  /* ---- recommendation ---- */
  let recommendation: Recommendation;
  if (mispricingPct > 12) recommendation = "AVOID";
  else if (mispricingPct > 4) recommendation = "NEGOTIATE";
  // A valuation we cannot defend may still warn against overpaying, but it is
  // never allowed to declare a bargain: that claim needs a real anchor.
  else if (mispricingPct < -8 && valuationConfidence !== "insufficient") {
    recommendation = "BUY";
  } else recommendation = "HOLD";

  const intelOverrideApplied =
    intel.rec !== undefined && valuationConfidence !== "insufficient";
  if (intelOverrideApplied) recommendation = intel.rec as Recommendation;

  const recommendationRule =
    (valuationConfidence === "insufficient"
      ? "Valuation insufficient: above 12% of anchor means AVOID, above 4% means NEGOTIATE, otherwise HOLD; BUY is withheld without a defensible anchor."
      : "Above 12% of fair value means AVOID, above 4% means NEGOTIATE, below -8% means BUY, otherwise HOLD.") +
    (intelOverrideApplied ? " Per-credit intel override applied." : "");

  let recommendationWhy: string;
  if (valuationConfidence === "insufficient") {
    const gaps = missingEvidence.length
      ? ` Checks not usable: ${missingEvidence.join("; ")}.`
      : "";
    recommendationWhy = `Valuation confidence is insufficient. ${confidenceWhy}${gaps} The ${recommendation} call rests on the ${score}/100 risk composite and the open items on file, not on a fair-value comparison.`;
  } else if (valuationConfidence === "limited") {
    recommendationWhy = `${intel.recWhy} (Valuation confidence is limited: ${confidenceWhy})`;
  } else {
    recommendationWhy = intel.recWhy;
  }

  const valuation: ValuationDetail = {
    anchorKind,
    anchorSource,
    anchorValueUsd: anchor == null ? null : round2(anchor),
    adjustments,
    pointUsd: fairValue.point,
    lowUsd: fairValue.low,
    highUsd: fairValue.high,
    marketQuoteUsd: c.price,
    quoteAsOf: SAMPLE_QUOTE_AS_OF,
    quoteIsSample: true,
    mispricingPct:
      valuationConfidence === "insufficient" ? null : round1(mispricingPct),
    mispricingRule,
    recommendationRule,
    confidence: valuationConfidence,
    confidenceWhy,
    missingEvidence,
    assumptions,
  };

  return {
    score,
    tier,
    tierLabel,
    breakdown,
    confidence,
    evidenceConfidence,
    evidenceCoverage,
    checks,
    fairValue,
    mispricingPct,
    recommendation,
    recommendationWhy,
    valuation,
    evidence: intel.evidence,
    stresses: intel.stresses,
    sources: intel.sources,
  };
}

export const RISK_WEIGHTS_SUMMARY: ScoreBreakdown[] = [
  { key: "carbonIntegrity", label: "Carbon integrity", value: 22, weight: 0.22 },
  { key: "deliveryConfidence", label: "Delivery confidence", value: 20, weight: 0.2 },
  { key: "liquidity", label: "Liquidity", value: 16, weight: 0.16 },
  { key: "regulatoryEligibility", label: "Regulatory eligibility", value: 16, weight: 0.16 },
  { key: "issuerCredibility", label: "Issuer credibility", value: 14, weight: 0.14 },
  { key: "mrv", label: "MRV quality", value: 12, weight: 0.12 },
];

const hist = (...v: number[]) => v;

export const CREDITS: Credit[] = [
  {
    id: "VCS-1942",
    name: "Katingan Peatland Restoration",
    registry: "Verra (VCS)",
    type: "REDD+",
    region: "Southeast Asia",
    country: "Indonesia",
    price: 12.4,
    priceChange: 6.8,
    priceHistory: hist(11.1, 11.3, 11.2, 11.5, 11.4, 11.6, 11.9, 11.8, 12.0, 12.1, 12.3, 12.4),
    volumeAvailable: 184_000,
    monthlyVolume: 96_500,
    vintages: [2019, 2020, 2021, 2022],
    carbonIntegrity: 84,
    deliveryConfidence: 81,
    liquidity: 88,
    regulatoryEligibility: 90,
    issuerCredibility: 86,
    mrv: 80,
    stability: 78,
    flags: ["ICVCM-approved methodology", "Deep 30-day trade volume", "Buffett-backed developer"],
  },
  {
    id: "GS-7703",
    name: "Acre Amazon Rainforest REDD+",
    registry: "Gold Standard",
    type: "REDD+",
    region: "Latin America",
    country: "Brazil",
    price: 9.15,
    priceChange: -11.2,
    priceHistory: hist(10.8, 10.9, 10.7, 10.5, 10.4, 10.6, 10.3, 10.0, 9.8, 9.6, 9.3, 9.15),
    volumeAvailable: 92_000,
    monthlyVolume: 18_400,
    vintages: [2020, 2021],
    carbonIntegrity: 66,
    deliveryConfidence: 70,
    liquidity: 42,
    regulatoryEligibility: 55,
    issuerCredibility: 62,
    mrv: 58,
    stability: 60,
    flags: ["Price down 11% in 12m", "Thin recent trading", "Methodology revision pending"],
  },
  {
    id: "GS-3311",
    name: "Clean Cookstoves Programme",
    registry: "Gold Standard",
    type: "Cookstoves",
    region: "Africa",
    country: "Kenya",
    price: 14.2,
    priceChange: 3.1,
    priceHistory: hist(13.2, 13.4, 13.5, 13.3, 13.6, 13.8, 14.0, 13.9, 14.1, 14.0, 14.15, 14.2),
    volumeAvailable: 41_000,
    monthlyVolume: 12_800,
    vintages: [2022, 2023, 2024],
    carbonIntegrity: 76,
    deliveryConfidence: 74,
    liquidity: 58,
    regulatoryEligibility: 72,
    issuerCredibility: 80,
    mrv: 71,
    stability: 69,
    flags: ["Strong SDG co-benefits", "Daily-use surveys below benchmark"],
  },
  {
    id: "ACR-5529",
    name: "Mississippi Valley Afforestation",
    registry: "ACR",
    type: "ARR",
    region: "North America",
    country: "United States",
    price: 18.6,
    priceChange: 9.4,
    priceHistory: hist(16.4, 16.6, 16.5, 16.9, 17.1, 17.0, 17.4, 17.6, 17.8, 18.1, 18.4, 18.6),
    volumeAvailable: 27_500,
    monthlyVolume: 9_100,
    vintages: [2021, 2022, 2023],
    carbonIntegrity: 88,
    deliveryConfidence: 85,
    liquidity: 61,
    regulatoryEligibility: 83,
    issuerCredibility: 84,
    mrv: 86,
    stability: 82,
    flags: ["Registry-verified inventory", "Growing demand", "Long permanence buffer"],
  },
  {
    id: "VCS-8817",
    name: "Delta Biochar Removals",
    registry: "Verra (VCS)",
    type: "Biochar",
    region: "North America",
    country: "Canada",
    price: 96.5,
    priceChange: 21.7,
    priceHistory: hist(72, 74, 76, 75, 79, 82, 84, 87, 90, 92, 94.5, 96.5),
    volumeAvailable: 8_200,
    monthlyVolume: 6_400,
    vintages: [2023, 2024],
    carbonIntegrity: 92,
    deliveryConfidence: 89,
    liquidity: 38,
    regulatoryEligibility: 88,
    issuerCredibility: 90,
    mrv: 91,
    stability: 87,
    flags: ["Durable removal", "Low float — exit may take weeks", "Corporate offtake-backed"],
  },
  {
    id: "CAR-1140",
    name: "Sierra Forest Improvement",
    registry: "CAR",
    type: "Improved Forest Management",
    region: "North America",
    country: "United States",
    price: 7.8,
    priceChange: -18.5,
    priceHistory: hist(10.2, 10.0, 9.7, 9.5, 9.2, 9.0, 8.8, 8.6, 8.4, 8.2, 8.0, 7.8),
    volumeAvailable: 310_000,
    monthlyVolume: 7_200,
    vintages: [2015, 2016, 2017],
    carbonIntegrity: 34,
    deliveryConfidence: 52,
    liquidity: 29,
    regulatoryEligibility: 25,
    issuerCredibility: 44,
    mrv: 40,
    stability: 38,
    flags: ["Oversupply of aged vintages", "Discounted vs. peers", "Frequent wildfire events"],
  },
  {
    id: "GS-9902",
    name: "Rift Valley Geothermal Offset",
    registry: "Gold Standard",
    type: "Wind",
    region: "Africa",
    country: "Ethiopia",
    price: 6.4,
    priceChange: 1.2,
    priceHistory: hist(6.1, 6.15, 6.2, 6.18, 6.22, 6.25, 6.3, 6.28, 6.32, 6.35, 6.38, 6.4),
    volumeAvailable: 145_000,
    monthlyVolume: 33_000,
    vintages: [2018, 2019, 2020, 2021],
    carbonIntegrity: 61,
    deliveryConfidence: 77,
    liquidity: 74,
    regulatoryEligibility: 68,
    issuerCredibility: 66,
    mrv: 72,
    stability: 71,
    flags: ["Grid-connected baseline", "Additionality challenged in review"],
  },
  {
    id: "VCS-4408",
    name: "Mekong Mangrove Blue Carbon",
    registry: "Verra (VCS)",
    type: "ARR",
    region: "Southeast Asia",
    country: "Vietnam",
    price: 22.3,
    priceChange: 14.6,
    priceHistory: hist(17.9, 18.4, 18.8, 19.2, 19.6, 20.1, 20.4, 20.9, 21.3, 21.7, 22.0, 22.3),
    volumeAvailable: 19_800,
    monthlyVolume: 11_300,
    vintages: [2022, 2023, 2024],
    carbonIntegrity: 79,
    deliveryConfidence: 68,
    liquidity: 55,
    regulatoryEligibility: 81,
    issuerCredibility: 73,
    mrv: 70,
    stability: 58,
    flags: ["Coastal community co-benefits", "Typhoon exposure", "Young project — short track record"],
  },
  {
    id: "ACR-8861",
    name: "Basel Direct Air Capture Hub",
    registry: "ACR",
    type: "Direct Air Capture",
    region: "Europe",
    country: "Switzerland",
    price: 318.0,
    priceChange: 4.9,
    priceHistory: hist(288, 292, 295, 297, 299, 301, 304, 306, 310, 313, 315, 318),
    volumeAvailable: 3_400,
    monthlyVolume: 2_900,
    vintages: [2024],
    carbonIntegrity: 95,
    deliveryConfidence: 90,
    liquidity: 24,
    regulatoryEligibility: 93,
    issuerCredibility: 92,
    mrv: 94,
    stability: 91,
    flags: ["Permanent storage", "Institutional buyers only", "Very low float"],
  },
  {
    id: "VCS-2260",
    name: "Guatemala Highland Reforestation",
    registry: "Verra (VCS)",
    type: "ARR",
    region: "Latin America",
    country: "Guatemala",
    price: 10.9,
    priceChange: -4.4,
    priceHistory: hist(11.9, 11.8, 11.7, 11.6, 11.5, 11.4, 11.2, 11.15, 11.1, 11.05, 11.0, 10.9),
    volumeAvailable: 57_000,
    monthlyVolume: 15_600,
    vintages: [2020, 2021, 2022],
    carbonIntegrity: 58,
    deliveryConfidence: 63,
    liquidity: 47,
    regulatoryEligibility: 60,
    issuerCredibility: 51,
    mrv: 55,
    stability: 57,
    flags: ["Developer audit ongoing", "Rising forest-fire exposure"],
  },

  /* ---- second cohort: 12 real-world projects and programmes ---- */
  {
    id: "VCS-674",
    name: "Rimba Raya Biodiversity Reserve",
    registry: "Verra (VCS)",
    type: "REDD+",
    region: "Southeast Asia",
    country: "Indonesia",
    price: 11.8,
    priceChange: 8.2,
    priceHistory: hist(10.9, 11.0, 10.95, 11.1, 11.2, 11.15, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8),
    volumeAvailable: 420_000,
    monthlyVolume: 88_000,
    vintages: [2019, 2020, 2021, 2022, 2023],
    carbonIntegrity: 88,
    deliveryConfidence: 84,
    liquidity: 82,
    regulatoryEligibility: 92,
    issuerCredibility: 87,
    mrv: 85,
    stability: 80,
    flags: ["ICVCM CCP-approved", "Orangutan habitat co-benefits", "Deep two-way float"],
  },
  {
    id: "VCS-612",
    name: "Kasigau Corridor REDD+",
    registry: "Verra (VCS)",
    type: "REDD+",
    region: "Africa",
    country: "Kenya",
    price: 9.6,
    priceChange: 5.4,
    priceHistory: hist(9.1, 9.15, 9.2, 9.18, 9.25, 9.3, 9.35, 9.4, 9.45, 9.5, 9.55, 9.6),
    volumeAvailable: 260_000,
    monthlyVolume: 74_000,
    vintages: [2018, 2019, 2020, 2021, 2022, 2023],
    carbonIntegrity: 85,
    deliveryConfidence: 82,
    liquidity: 78,
    regulatoryEligibility: 84,
    issuerCredibility: 86,
    mrv: 83,
    stability: 76,
    flags: ["First verified REDD+ project under VCS", "Wildlife Works stewardship", "Community & wildlife co-benefits"],
  },
  {
    id: "VCS-902",
    name: "Kariba REDD+",
    registry: "Verra (VCS)",
    type: "REDD+",
    region: "Africa",
    country: "Zimbabwe",
    price: 5.2,
    priceChange: -34.0,
    priceHistory: hist(7.9, 7.6, 7.2, 6.9, 6.5, 6.2, 5.9, 5.6, 5.4, 5.3, 5.25, 5.2),
    volumeAvailable: 900_000,
    monthlyVolume: 12_000,
    vintages: [2016, 2017, 2018, 2019, 2020],
    carbonIntegrity: 36,
    deliveryConfidence: 48,
    liquidity: 22,
    regulatoryEligibility: 30,
    issuerCredibility: 40,
    mrv: 38,
    stability: 34,
    flags: ["Over-crediting investigation (2023)", "Issuance halted pending review", "Distressed sellers on the tape"],
  },
  {
    id: "VCS-1748",
    name: "Southern Cardamom REDD+",
    registry: "Verra (VCS)",
    type: "REDD+",
    region: "Southeast Asia",
    country: "Cambodia",
    price: 10.4,
    priceChange: 12.4,
    priceHistory: hist(9.25, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9, 10.0, 10.1, 10.2, 10.3, 10.4),
    volumeAvailable: 140_000,
    monthlyVolume: 26_000,
    vintages: [2020, 2021, 2022, 2023],
    carbonIntegrity: 74,
    deliveryConfidence: 72,
    liquidity: 55,
    regulatoryEligibility: 78,
    issuerCredibility: 70,
    mrv: 73,
    stability: 62,
    flags: ["ICVCM CCP-approved", "Wildlife Alliance enforcement", "Rights review under way"],
  },
  {
    id: "VCS-934",
    name: "Mai Ndombe REDD+",
    registry: "Verra (VCS)",
    type: "REDD+",
    region: "Africa",
    country: "DR Congo",
    price: 4.6,
    priceChange: -28.0,
    priceHistory: hist(6.4, 6.1, 5.8, 5.5, 5.3, 5.1, 4.95, 4.8, 4.7, 4.65, 4.62, 4.6),
    volumeAvailable: 780_000,
    monthlyVolume: 9_000,
    vintages: [2016, 2017, 2018, 2019, 2020],
    carbonIntegrity: 42,
    deliveryConfidence: 52,
    liquidity: 18,
    regulatoryEligibility: 35,
    issuerCredibility: 45,
    mrv: 44,
    stability: 40,
    flags: ["Over-issuance investigation", "Legacy-vintage overhang", "Thin secondary liquidity"],
  },
  {
    id: "VCS-985",
    name: "Cordillera Azul National Park",
    registry: "Verra (VCS)",
    type: "REDD+",
    region: "Latin America",
    country: "Peru",
    price: 13.9,
    priceChange: 7.8,
    priceHistory: hist(12.9, 13.0, 13.05, 13.1, 13.2, 13.3, 13.35, 13.5, 13.6, 13.7, 13.8, 13.9),
    volumeAvailable: 190_000,
    monthlyVolume: 42_000,
    vintages: [2019, 2020, 2021, 2022, 2023, 2024],
    carbonIntegrity: 89,
    deliveryConfidence: 86,
    liquidity: 71,
    regulatoryEligibility: 88,
    issuerCredibility: 85,
    mrv: 88,
    stability: 84,
    flags: ["3.4M-hectare park buffer", "Long verified delivery record", "Park-authority MRV"],
  },
  {
    id: "VCS-944",
    name: "Alto Mayo Protected Forest",
    registry: "Verra (VCS)",
    type: "REDD+",
    region: "Latin America",
    country: "Peru",
    price: 12.6,
    priceChange: 6.1,
    priceHistory: hist(11.9, 12.0, 12.05, 12.1, 12.15, 12.2, 12.25, 12.35, 12.4, 12.5, 12.55, 12.6),
    volumeAvailable: 160_000,
    monthlyVolume: 31_000,
    vintages: [2018, 2019, 2020, 2021, 2022, 2023],
    carbonIntegrity: 82,
    deliveryConfidence: 80,
    liquidity: 62,
    regulatoryEligibility: 80,
    issuerCredibility: 78,
    mrv: 79,
    stability: 74,
    flags: ["Coffee-cooperative conservation agreements", "CI-backed implementation", "Eight years below baseline"],
  },
  {
    id: "VCS-2250",
    name: "Delta Blue Carbon",
    registry: "Verra (VCS)",
    type: "ARR",
    region: "Southeast Asia",
    country: "Pakistan",
    price: 27.5,
    priceChange: 18.4,
    priceHistory: hist(23.2, 23.8, 24.1, 24.5, 25.0, 25.4, 25.9, 26.3, 26.6, 26.9, 27.2, 27.5),
    volumeAvailable: 65_000,
    monthlyVolume: 38_000,
    vintages: [2021, 2022, 2023, 2024],
    carbonIntegrity: 90,
    deliveryConfidence: 82,
    liquidity: 58,
    regulatoryEligibility: 86,
    issuerCredibility: 84,
    mrv: 88,
    stability: 74,
    flags: ["World's largest mangrove restoration", "Indus Delta community ownership", "Blue-carbon premium demand"],
  },
  {
    id: "VCS-1402",
    name: "Chyulu Hills REDD+",
    registry: "Verra (VCS)",
    type: "REDD+",
    region: "Africa",
    country: "Kenya",
    price: 10.8,
    priceChange: 4.2,
    priceHistory: hist(10.4, 10.45, 10.42, 10.5, 10.55, 10.6, 10.62, 10.68, 10.7, 10.74, 10.77, 10.8),
    volumeAvailable: 120_000,
    monthlyVolume: 24_000,
    vintages: [2019, 2020, 2021, 2022, 2023],
    carbonIntegrity: 78,
    deliveryConfidence: 76,
    liquidity: 52,
    regulatoryEligibility: 74,
    issuerCredibility: 81,
    mrv: 75,
    stability: 66,
    flags: ["Maasai landowner partnership", "Transparent revenue sharing", "Rainfall variability"]
  },
  {
    id: "VCS-1052",
    name: "Great Bear Forest Carbon Project",
    registry: "Verra (VCS)",
    type: "Improved Forest Management",
    region: "North America",
    country: "Canada",
    price: 16.9,
    priceChange: 9.7,
    priceHistory: hist(15.4, 15.6, 15.7, 15.8, 16.0, 16.1, 16.2, 16.4, 16.5, 16.6, 16.8, 16.9),
    volumeAvailable: 95_000,
    monthlyVolume: 21_000,
    vintages: [2018, 2019, 2020, 2021, 2022, 2023],
    carbonIntegrity: 86,
    deliveryConfidence: 84,
    liquidity: 60,
    regulatoryEligibility: 88,
    issuerCredibility: 83,
    mrv: 84,
    stability: 82,
    flags: ["First Nations-led stewardship (BC)", "Old-growth protection covenants", "IFM methodology"],
  },
  {
    id: "VCS-1737",
    name: "Jari Pará REDD+",
    registry: "Verra (VCS)",
    type: "REDD+",
    region: "Latin America",
    country: "Brazil",
    price: 8.4,
    priceChange: -6.5,
    priceHistory: hist(9.0, 8.9, 8.85, 8.8, 8.7, 8.65, 8.6, 8.55, 8.5, 8.48, 8.44, 8.4),
    volumeAvailable: 210_000,
    monthlyVolume: 28_000,
    vintages: [2019, 2020, 2021, 2022],
    carbonIntegrity: 68,
    deliveryConfidence: 70,
    liquidity: 48,
    regulatoryEligibility: 62,
    issuerCredibility: 63,
    mrv: 66,
    stability: 58,
    flags: ["Carbon-rights litigation in Pará", "Amazon deforestation pressure", "Adequate vintage supply"],
  },
  {
    id: "VCS-1627",
    name: "Nicaforest High Impact Reforestation",
    registry: "Verra (VCS)",
    type: "ARR",
    region: "Latin America",
    country: "Nicaragua",
    price: 14.8,
    priceChange: 11.3,
    priceHistory: hist(13.3, 13.5, 13.6, 13.75, 13.9, 14.0, 14.15, 14.3, 14.4, 14.55, 14.7, 14.8),
    volumeAvailable: 34_000,
    monthlyVolume: 8_600,
    vintages: [2022, 2023, 2024],
    carbonIntegrity: 80,
    deliveryConfidence: 72,
    liquidity: 41,
    regulatoryEligibility: 76,
    issuerCredibility: 68,
    mrv: 77,
    stability: 64,
    flags: ["Smallholder teak reforestation", "FSC & CCB co-benefits", "Thin secondary float"],
  },
];

export const scoredCredits = CREDITS.map((c) => ({
  credit: c,
  risk: assessRisk(c),
})).sort((a, b) => b.risk.score - a.risk.score);

/* ---------- formatters ---------- */

export const fmtMoney = (n: number) =>
  `$${n.toLocaleString("en-US", {
    minimumFractionDigits: n < 20 ? 2 : 0,
    maximumFractionDigits: n < 20 ? 2 : 0,
  })}`;

export const fmtTonnes = (n: number) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
      ? `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`
      : `${n}`;

export const fmtPct = (n: number) => `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;
