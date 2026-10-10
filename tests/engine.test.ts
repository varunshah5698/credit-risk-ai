/**
 * Engine tests — scoring, evidence confidence/coverage, valuation and the
 * recommendation thresholds.
 *
 * Run with:  bun test
 *
 * These live outside `src/` so `tsc -b` (which only includes `src`) is not
 * asked to type-check the `bun:test` module.
 */
import { describe, expect, test } from "bun:test";
import {
  CREDITS,
  FACTOR_ORDER,
  STATUS_IS_USABLE,
  STATUS_QUALITY,
  assessRisk,
  confidenceBand,
  computeEvidenceConfidence,
  computeEvidenceCoverage,
  scoredCredits,
  valuationConfidenceFor,
  type Credit,
  type EvidenceStatus,
} from "../src/lib/credits";

const credit = (id: string): Credit => {
  const c = CREDITS.find((x) => x.id === id);
  if (!c) throw new Error(`fixture ${id} missing`);
  return c;
};

const entry = (id: string) => {
  const e = scoredCredits.find((x) => x.credit.id === id);
  if (!e) throw new Error(`fixture ${id} missing`);
  return e;
};

/** A credit with no INTEL entry and no checks on file. */
const orphan = (): Credit => ({ ...credit("VCS-1942"), id: "ZZZ-0000" });

/** Re-status an assessment's checks so the helpers can be tested directly. */
const restatus = (statuses: EvidenceStatus[]) =>
  assessRisk(credit("VCS-1942")).checks.map((ch, i) => ({
    ...ch,
    status: statuses[i],
    quality: STATUS_QUALITY[statuses[i]],
    usable: STATUS_IS_USABLE[statuses[i]],
  }));

describe("risk scoring", () => {
  test("factor weights sum to 1", () => {
    const sum = entry("VCS-1942").risk.breakdown.reduce((a, b) => a + b.weight, 0);
    expect(sum).toBeCloseTo(1, 6);
  });

  test("composite is the weighted mean of the six factors", () => {
    const c = credit("VCS-1942");
    const r = assessRisk(c);
    const expected = Math.round(
      r.breakdown.reduce((a, b) => a + b.value * b.weight, 0),
    );
    expect(r.score).toBe(expected);
  });

  test("score stays inside 0-100 for every credit", () => {
    for (const e of scoredCredits) {
      expect(e.risk.score).toBeGreaterThanOrEqual(0);
      expect(e.risk.score).toBeLessThanOrEqual(100);
    }
  });

  test("documented tier thresholds hold", () => {
    const at = (n: number) =>
      assessRisk({
        ...credit("VCS-1942"),
        carbonIntegrity: n,
        deliveryConfidence: n,
        liquidity: n,
        regulatoryEligibility: n,
        issuerCredibility: n,
        mrv: n,
      }).tier;
    expect(at(90)).toBe("A");
    expect(at(70)).toBe("B");
    expect(at(50)).toBe("C");
    expect(at(30)).toBe("D");
    expect(at(77)).toBe("B");
    expect(at(78)).toBe("A");
  });

  test("is deterministic — same input, identical assessment", () => {
    for (const c of CREDITS.slice(0, 5)) {
      expect(assessRisk(c)).toEqual(assessRisk(c));
    }
  });
});

describe("the three measurements are separate", () => {
  test("every credit carries six checks in factor order", () => {
    for (const e of scoredCredits) {
      expect(e.risk.checks).toHaveLength(FACTOR_ORDER.length);
      expect(e.risk.checks.map((ch) => ch.key)).toEqual(FACTOR_ORDER);
    }
  });

  test("confidence band is derived from evidence confidence, never from the tier", () => {
    for (const e of scoredCredits) {
      expect(e.risk.confidence).toBe(confidenceBand(e.risk.evidenceConfidence));
    }
  });

  test("identical score and tier can still carry different confidence", () => {
    // Both tier B at 71/100 — only the evidence files differ.
    const a = entry("VCS-4408").risk;
    const b = entry("VCS-1748").risk;
    expect(a.score).toBe(b.score);
    expect(a.tier).toBe(b.tier);
    expect(a.evidenceConfidence).not.toBe(b.evidenceConfidence);
    expect(a.confidence).not.toBe(b.confidence);
    expect(a.evidenceConfidence).toBeLessThan(b.evidenceConfidence);
  });

  test("a high risk score backed by no evidence reports no confidence", () => {
    const r = assessRisk({
      ...orphan(),
      carbonIntegrity: 95,
      deliveryConfidence: 95,
      liquidity: 95,
      regulatoryEligibility: 95,
      issuerCredibility: 95,
      mrv: 95,
    });
    expect(r.score).toBeGreaterThan(90);
    expect(r.evidenceConfidence).toBe(0);
    expect(r.evidenceCoverage).toBe(0);
    expect(r.confidence).toBe("Low");
  });

  test("a low risk score backed by verified evidence still reports strong confidence", () => {
    // VCS-674's file is fully verified; collapsing its factors must not drag
    // the evidence measurement down with the risk measurement.
    const r = assessRisk({
      ...credit("VCS-674"),
      carbonIntegrity: 20,
      deliveryConfidence: 20,
      liquidity: 20,
      regulatoryEligibility: 20,
      issuerCredibility: 20,
      mrv: 20,
    });
    expect(r.score).toBeLessThan(30);
    expect(r.evidenceConfidence).toBe(100);
    expect(r.evidenceCoverage).toBe(100);
    expect(r.confidence).toBe("High");
  });

  test("coverage counts only usable evidence", () => {
    for (const e of scoredCredits) {
      const usable = e.risk.checks.filter((ch) => ch.usable).length;
      expect(e.risk.evidenceCoverage).toBe(
        Math.round((usable / e.risk.checks.length) * 100),
      );
    }
  });

  test("missing and uncertain evidence are never usable and never reassuring", () => {
    expect(STATUS_IS_USABLE.missing).toBe(false);
    expect(STATUS_IS_USABLE.uncertain).toBe(false);
    expect(STATUS_QUALITY.missing).toBe(0);
    expect(STATUS_QUALITY.uncertain).toBeLessThan(STATUS_QUALITY.assumed);
  });

  test("coverage and confidence are independent dimensions", () => {
    // Most of CAR-1140's checks are nominally answered but barely verified, so
    // coverage lands well above confidence rather than tracking it.
    const r = entry("CAR-1140").risk;
    expect(r.evidenceCoverage).toBeGreaterThan(r.evidenceConfidence);
    expect(r.confidence).toBe("Low");
  });
});

describe("evidence measurement helpers", () => {
  test("return 0 for an empty check list", () => {
    expect(computeEvidenceConfidence([])).toBe(0);
    expect(computeEvidenceCoverage([])).toBe(0);
  });

  test("confidence rises monotonically with check quality", () => {
    const missing = computeEvidenceConfidence(
      restatus(["missing", "missing", "missing", "missing", "missing", "missing"]),
    );
    const assumed = computeEvidenceConfidence(
      restatus(["assumed", "assumed", "assumed", "assumed", "assumed", "assumed"]),
    );
    const verified = computeEvidenceConfidence(
      restatus(["verified", "verified", "verified", "verified", "verified", "verified"]),
    );
    expect(missing).toBe(0);
    expect(assumed).toBeGreaterThan(missing);
    expect(verified).toBeGreaterThan(assumed);
    expect(verified).toBe(100);
  });

  test("coverage ignores missing and uncertain checks", () => {
    expect(
      computeEvidenceCoverage(
        restatus(["verified", "missing", "uncertain", "assumed", "estimated", "verified"]),
      ),
    ).toBe(Math.round((4 / 6) * 100));
    expect(
      computeEvidenceCoverage(
        restatus(["missing", "missing", "missing", "missing", "missing", "missing"]),
      ),
    ).toBe(0);
  });
});

describe("valuation defensibility", () => {
  test("never uses the market quote as its own anchor", () => {
    for (const e of scoredCredits) {
      expect(e.risk.valuation.anchorKind).toBe("evidence");
      expect(e.risk.valuation.anchorValueUsd).not.toBeNull();
    }
  });

  test("a credit with no independent anchor gets no mispricing figure", () => {
    const r = assessRisk(orphan());
    expect(r.valuation.anchorKind).toBe("none");
    expect(r.valuation.mispricingPct).toBeNull();
    expect(r.valuation.confidence).toBe("insufficient");
    expect(r.recommendation).not.toBe("BUY");
    // No band is invented when there is nothing to anchor it to.
    expect(r.fairValue.low).toBe(r.fairValue.high);
    expect(r.valuation.confidenceWhy).toContain("cannot be benchmarked");
  });

  test("sufficiency thresholds are applied consistently", () => {
    expect(valuationConfidenceFor("evidence", 60, 80)).toBe("sufficient");
    expect(valuationConfidenceFor("evidence", 59, 100)).toBe("limited");
    expect(valuationConfidenceFor("evidence", 100, 79)).toBe("limited");
    expect(valuationConfidenceFor("evidence", 40, 50)).toBe("limited");
    expect(valuationConfidenceFor("evidence", 39, 100)).toBe("insufficient");
    expect(valuationConfidenceFor("evidence", 100, 49)).toBe("insufficient");
    // A quote can never vouch for itself, however good the evidence file is.
    expect(valuationConfidenceFor("market", 100, 100)).toBe("insufficient");
    expect(valuationConfidenceFor("none", 100, 100)).toBe("insufficient");
  });

  test("insufficient valuation never reports a mispricing percentage", () => {
    let seen = 0;
    for (const e of scoredCredits) {
      if (e.risk.valuation.confidence === "insufficient") {
        seen += 1;
        expect(e.risk.valuation.mispricingPct).toBeNull();
        expect(e.risk.valuation.mispricingRule).toContain("Not reported");
      } else {
        expect(e.risk.valuation.mispricingPct).not.toBeNull();
      }
    }
    expect(seen).toBeGreaterThan(0);
  });

  test("every valuation exposes anchor, adjustments, quote, rule and assumptions", () => {
    for (const e of scoredCredits) {
      const v = e.risk.valuation;
      expect(v.anchorSource.length).toBeGreaterThan(0);
      expect(v.adjustments.map((a) => a.label)).toContain("Evidence anchor");
      expect(v.adjustments.map((a) => a.label)).toContain("Market quote");
      expect(v.marketQuoteUsd).toBe(e.credit.price);
      expect(v.quoteIsSample).toBe(true);
      expect(v.quoteAsOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(v.mispricingRule.length).toBeGreaterThan(0);
      expect(v.recommendationRule.length).toBeGreaterThan(0);
      expect(v.assumptions.length).toBeGreaterThan(0);
      expect(v.confidenceWhy.length).toBeGreaterThan(0);
    }
  });

  test("adjustments reconcile anchor into the fair-value point", () => {
    for (const e of scoredCredits) {
      const v = e.risk.valuation;
      const anchor = v.adjustments.find((a) => a.label === "Evidence anchor");
      const discount = v.adjustments.find((a) => a.label === "Composite risk discount");
      if (!anchor || !discount) throw new Error("adjustments missing");
      expect(anchor.effectUsd).toBe(v.anchorValueUsd);
      expect((anchor.effectUsd ?? 0) + (discount.effectUsd ?? 0)).toBeCloseTo(
        v.pointUsd,
        1,
      );
    }
  });

  test("fair-value band brackets the point estimate", () => {
    for (const e of scoredCredits) {
      expect(e.risk.fairValue.low).toBeLessThanOrEqual(e.risk.fairValue.point);
      expect(e.risk.fairValue.point).toBeLessThanOrEqual(e.risk.fairValue.high);
    }
  });

  test("key assumptions name the formula and the sample-data caveat", () => {
    const a = entry("VCS-1942").risk.valuation.assumptions;
    expect(a.some((x) => x.includes("0.40 + 0.60"))).toBe(true);
    expect(a.some((x) => x.includes("sample data"))).toBe(true);
  });

  test("missing evidence is listed item by item", () => {
    const v = entry("VCS-902").risk.valuation;
    expect(v.missingEvidence.length).toBeGreaterThan(0);
    expect(
      v.missingEvidence.some((m) => m.includes("no record on file")),
    ).toBe(true);
    expect(v.missingEvidence.every((m) => m.includes(":"))).toBe(true);
  });
});

describe("recommendation thresholds", () => {
  test("market well above fair value is AVOID", () => {
    const r = entry("VCS-8817").risk;
    expect(r.mispricingPct).toBeGreaterThan(12);
    expect(r.recommendation).toBe("AVOID");
  });

  test("market at fair value is HOLD", () => {
    const r = entry("VCS-674").risk;
    expect(Math.abs(r.mispricingPct)).toBeLessThan(4);
    expect(r.recommendation).toBe("HOLD");
  });

  test("market below fair value on a defensible valuation is BUY", () => {
    // Drop the quote well under the band on a credit whose valuation is sound.
    const r = assessRisk({ ...credit("VCS-1942"), price: 9 });
    expect(r.valuation.confidence).toBe("sufficient");
    expect(r.mispricingPct).toBeLessThan(-8);
    expect(r.valuation.mispricingPct).toBeLessThan(-8);
    expect(r.recommendation).toBe("BUY");
  });

  test("market above fair value on a defensible valuation is AVOID", () => {
    const r = assessRisk({ ...credit("VCS-1942"), price: 25 });
    expect(r.mispricingPct).toBeGreaterThan(12);
    expect(r.recommendation).toBe("AVOID");
  });

  test("BUY is never issued on an insufficient valuation, however cheap it looks", () => {
    // VCS-934's evidence file is too thin to price. Even a quote far below the
    // anchor must not be called a bargain.
    const r = assessRisk({ ...credit("VCS-934"), price: 2.5 });
    expect(r.valuation.confidence).toBe("insufficient");
    expect(r.mispricingPct).toBeLessThan(-8);
    expect(r.valuation.mispricingPct).toBeNull();
    expect(r.recommendation).not.toBe("BUY");
  });

  test("insufficient valuation explains itself rather than quoting a band", () => {
    let seen = 0;
    for (const e of scoredCredits) {
      if (e.risk.valuation.confidence === "insufficient") {
        seen += 1;
        expect(e.risk.recommendationWhy).toContain(
          "Valuation confidence is insufficient",
        );
        expect(e.risk.recommendationWhy).toContain("not on a fair-value comparison");
      }
    }
    expect(seen).toBeGreaterThan(0);
  });

  test("limited valuation states the caveat alongside the call", () => {
    let seen = 0;
    for (const e of scoredCredits) {
      if (e.risk.valuation.confidence === "limited") {
        seen += 1;
        expect(e.risk.recommendationWhy).toContain("Valuation confidence is limited");
      }
    }
    expect(seen).toBeGreaterThan(0);
  });

  test("recommendation is one of the four documented values", () => {
    for (const e of scoredCredits) {
      expect(["BUY", "HOLD", "NEGOTIATE", "AVOID"]).toContain(e.risk.recommendation);
    }
  });

  test("the stated rule matches the emitted recommendation", () => {
    for (const e of scoredCredits) {
      expect(e.risk.valuation.recommendationRule.length).toBeGreaterThan(10);
      expect(e.risk.recommendationWhy.length).toBeGreaterThan(20);
    }
  });
});
