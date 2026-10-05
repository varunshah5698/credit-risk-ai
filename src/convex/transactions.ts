import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Records a Stripe-paid credit purchase in the custody ledger.
 *
 * Idempotent per Stripe checkout session id, so refreshing the success URL
 * cannot double-book the same lot. Returns the human-readable receipt id.
 */
export const recordPurchase = mutation({
  args: {
    sessionId: v.string(),
    creditId: v.string(),
    creditName: v.string(),
    tonnes: v.number(),
    pricePerTonne: v.number(),
    amountUsd: v.number(),
    paymentIntent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Sign in to record a purchase.");
    }

    const existing = await ctx.db
      .query("payments")
      .withIndex("by_session", (q) => q.eq("stripeSessionId", args.sessionId))
      .first();
    if (existing) {
      return { paymentId: existing._id, receipt: existing.receiptId, deduped: true };
    }

    const now = Date.now();
    const stamp = new Date(now).toISOString().slice(0, 10).replace(/-/g, "");
    const receiptId = `RCPT-${stamp}-${args.sessionId.slice(-6).toUpperCase()}`;

    const paymentId = await ctx.db.insert("payments", {
      userId,
      creditId: args.creditId,
      creditName: args.creditName,
      tonnes: args.tonnes,
      pricePerTonne: args.pricePerTonne,
      amountUsd: args.amountUsd,
      currency: "usd",
      stripeSessionId: args.sessionId,
      stripePaymentIntent: args.paymentIntent,
      receiptId,
      status: "paid",
      createdAt: now,
    });

    await ctx.db.insert("transactions", {
      userId,
      creditId: args.creditId,
      type: "buy",
      quantity: args.tonnes,
      pricePerTon: args.pricePerTonne,
      notional: args.amountUsd,
      currency: "usd",
      reference: receiptId,
      status: "settled",
      executedAt: now,
      note: `Stripe Checkout ${args.sessionId}`,
    });

    return { paymentId, receipt: receiptId, deduped: false };
  },
});
