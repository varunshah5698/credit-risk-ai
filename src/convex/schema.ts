import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;
export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove
      createdAt: v.optional(v.number()),
    }).index("email", ["email"]),

    // Portfolio aggregate rollups the dashboard surfaces without extra queries.
    portfolioAggregates: defineTable({
      userId: v.string(),
      creditId: v.string(),
      quantityHeld: v.number(),
      averageCostPerTon: v.number(),
      currentValue: v.number(),
      costBasis: v.number(),
      realizedPnl: v.number(),
      unrealizedPnl: v.number(),
      unrealizedPnlPct: v.number(),
      lastTick: v.number(),
      updatedAt: v.number(),
    })
      .index("by_user", ["userId"])
      .index("by_credit", ["creditId"]),

    // Every executed buy / sell / retire action. This is the audit trail + history.
    transactions: defineTable({
      userId: v.string(),
      creditId: v.string(),
      type: v.union(v.literal("buy"), v.literal("sell"), v.literal("retire"), v.literal("spend")),
      quantity: v.number(), // tonnes
      pricePerTon: v.number(),
      notional: v.number(),
      currency: v.string(),
      walletAddress: v.optional(v.string()),
      walletAsset: v.optional(v.string()),
      reference: v.optional(v.string()), // order id / receipt id
      status: v.union(
        v.literal("pending"),
        v.literal("settled"),
        v.literal("cancelled"),
        v.literal("retired"),
        v.literal("rejected"),
      ),
      executedAt: v.number(),
      note: v.optional(v.string()),
    })
      .index("by_user", ["userId"])
      .index("by_credit", ["creditId"])
      .index("by_time", ["executedAt"])
      .index("by_status", ["status"]),

    // Retirement state: what is out of circulation and when it was retired.
    retirements: defineTable({
      userId: v.string(),
      transactionId: v.id("transactions"),
      creditId: v.string(),
      quantity: v.number(),
      vintage: v.number(),
      reason: v.optional(v.string()),
      certificateId: v.optional(v.string()),
      retiredAt: v.number(),
    })
      .index("by_user", ["userId"])
      .index("by_credit", ["creditId"])
      .index("by_transaction", ["transactionId"]),

    // Stripe checkout records for credit purchases (server-verified payments).
    payments: defineTable({
      userId: v.string(),
      creditId: v.string(),
      creditName: v.string(),
      tonnes: v.number(),
      pricePerTonne: v.number(),
      amountUsd: v.number(),
      currency: v.string(),
      stripeSessionId: v.string(),
      stripePaymentIntent: v.optional(v.string()),
      receiptId: v.string(),
      status: v.union(v.literal("paid"), v.literal("refunded"), v.literal("failed")),
      createdAt: v.number(),
    })
      .index("by_session", ["stripeSessionId"])
      .index("by_user", ["userId"])
      .index("by_time", ["createdAt"]),

    // Environmental + satellite evidence feeds wired into evidence confidence.
    evidenceFeeds: defineTable({
      creditId: v.string(),
      source: v.union(
        v.literal("registry"),
        v.literal("satellite"),
        v.literal("sensor"),
        v.literal("audited"),
        v.literal("drone"),
        v.literal("field"),
      ),
      metric: v.string(),
      value: v.number(),
      unit: v.string(),
      quality: v.number(),
      timestamp: v.number(),
      provider: v.string(),
    })
      .index("by_credit", ["creditId"])
      .index("by_time", ["timestamp"]),

    // Continuous monitoring: a simulated live feed of registry + market + risk signals.
    monitoring: defineTable({
      creditId: v.string(),
      source: v.union(v.literal("registry"), v.literal("satellite"), v.literal("market"), v.literal("risk")),
      severity: v.union(v.literal("info"), v.literal("warning"), v.literal("critical")),
      signal: v.string(),
      detail: v.string(),
      value: v.optional(v.number()),
      at: v.number(),
    })
      .index("by_credit", ["creditId"])
      .index("by_time", ["at"]),

    // Fraud detection: pattern flags raised against a specific credit.
    fraudFlags: defineTable({
      userId: v.string(),
      creditId: v.string(),
      pattern: v.string(),
      severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
      confidence: v.number(),
      evidence: v.string(),
      createdAt: v.number(),
    })
      .index("by_user", ["userId"])
      .index("by_credit", ["creditId"])
      .index("by_severity", ["severity"]),

    // Evidence conflict detection: two sources disagree on a metric.
    evidenceConflicts: defineTable({
      creditId: v.string(),
      metric: v.string(),
      sourceA: v.string(),
      valueA: v.number(),
      sourceB: v.string(),
      valueB: v.number(),
      discrepancyPct: v.number(),
      severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
      createdAt: v.number(),
    })
      .index("by_credit", ["creditId"])
      .index("by_time", ["createdAt"]),

    // Negotiation intelligence: comms + bid/ask signals per credit.
    negotiationIntelligence: defineTable({
      creditId: v.string(),
      counterparty: v.string(),
      offer: v.number(), // USD per tonne
      ask: v.number(),
      quantity: v.number(),
      updatedAt: v.number(),
      intent: v.optional(v.string()),
      reason: v.optional(v.string()),
    })
      .index("by_credit", ["creditId"])
      .index("by_time", ["updatedAt"]),

    // What-if simulator results per user run.
    whatIfRuns: defineTable({
      userId: v.string(),
      creditId: v.optional(v.string()),
      scenario: v.string(),
      beforeValue: v.number(),
      afterValue: v.number(),
      beforePnl: v.number(),
      afterPnl: v.number(),
      runsAt: v.number(),
    })
      .index("by_user", ["userId"])
      .index("by_time", ["runsAt"]),

    // Portfolio optimization: efficient-frontier-ish output per user.
    portfolioOptimizations: defineTable({
      userId: v.string(),
      optimizedAt: v.number(),
      targetRisk: v.number(),
      targetReturn: v.number(),
      allocations: v.array(
        v.object({
          creditId: v.string(),
          weightPct: v.number(),
          expectedReturn: v.number(),
          risk: v.number(),
          notional: v.number(),
        }),
      ),
      expectedPortfolioReturn: v.number(),
      expectedPortfolioRisk: v.number(),
    })
      .index("by_user", ["userId"])
      .index("by_time", ["optimizedAt"]),

    // Portfolio risk aggregation per user.
    portfolioRisk: defineTable({
      userId: v.string(),
      portfolioId: v.optional(v.string()),
      totalNotional: v.number(),
      expectedReturn: v.number(),
      trackingError: v.number(),
      var95: v.number(),
      worstCase: v.number(),
      concentration: v.number(),
      updatedAt: v.number(),
    })
      .index("by_user", ["userId"])
      .index("by_time", ["updatedAt"]),

    // Regulatory alerts.
    regulatoryAlerts: defineTable({
      userId: v.string(),
      creditId: v.optional(v.string()),
      severity: v.union(v.literal("info"), v.literal("warning"), v.literal("critical")),
      title: v.string(),
      body: v.string(),
      source: v.string(),
      disclosedAt: v.number(),
    })
      .index("by_user", ["userId"])
      .index("by_time", ["disclosedAt"]),

    // AI agent activity timeline.
    agentActivity: defineTable({
      userId: v.string(),
      creditId: v.optional(v.string()),
      agent: v.string(),
      action: v.string(),
      summary: v.string(),
      detail: v.string(),
      at: v.number(),
    })
      .index("by_user", ["userId"])
      .index("by_time", ["at"]),

    // Marketplace analytics aggregates.
    marketplaceAnalytics: defineTable({
      period: v.string(), // e.g. "2026-09"
      tradedTonnes: v.number(),
      avgPrice: v.number(),
      volumeWeightedPrice: v.number(),
      listings: v.number(),
      retirements: v.number(),
      buyers: v.number(),
      sellers: v.number(),
      updatedAt: v.number(),
    })
      .index("by_period", ["period"]),

    // Digital ownership receipt for a settled transaction.
    ownershipReceipts: defineTable({
      transactionId: v.id("transactions"),
      creditId: v.string(),
      certificateId: v.string(),
      owner: v.string(),
      quantity: v.number(),
      issuedAt: v.number(),
      status: v.union(v.literal("active"), v.literal("transferred"), v.literal("retired")),
    }).index("by_transaction", ["transactionId"]),
  },
  { schemaValidation: false },
);

export default schema;
