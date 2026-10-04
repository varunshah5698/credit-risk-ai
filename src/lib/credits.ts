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

export interface RiskAssessment {
  score: number; // 0–100, higher = safer
  tier: "A" | "B" | "C" | "D";
  tierLabel: "Prime" | "Investment Grade" | "Watch" | "High Risk";
  breakdown: ScoreBreakdown[];
  confidence: "High" | "Medium" | "Low";
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

function tierMeta(tier: RiskAssessment["tier"]): Pick<RiskAssessment, "tierLabel" | "confidence"> {
  switch (tier) {
    case "A":
      return { tierLabel: "Prime", confidence: "High" as const };
    case "B":
      return { tierLabel: "Investment Grade", confidence: "Medium" as const };
    case "C":
      return { tierLabel: "Watch", confidence: "Medium" as const };
    case "D":
      return { tierLabel: "High Risk", confidence: "Low" as const };
  }
}

/** Deterministic, explainable composite score. Higher = lower risk. */
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
  const { tierLabel, confidence } = tierMeta(tier);
  return { score, tier, tierLabel, breakdown, confidence };
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
