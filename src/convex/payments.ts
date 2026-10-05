"use node";

import Stripe from "stripe";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";

/**
 * Stripe payments for credit purchases.
 *
 * Runs in Convex's Node runtime so the secret key (`STRIPE_SECRET_KEY`, set on
 * the deployment) never reaches the browser. The client only receives the
 * hosted Checkout URL and mirrors the result after Stripe redirects back.
 */

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set on this Convex deployment (run `npx convex env set STRIPE_SECRET_KEY sk_test_...`).",
    );
  }
  return new Stripe(key);
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export const createCheckoutSession = action({
  args: {
    creditId: v.string(),
    creditName: v.string(),
    registry: v.string(),
    tonnes: v.number(),
    pricePerTonne: v.number(),
    origin: v.string(),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ sessionId: string; url: string; amountUsd: number }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Sign in before starting a checkout.");
    }

    if (!Number.isFinite(args.tonnes) || args.tonnes <= 0 || args.tonnes > 1_000_000) {
      throw new Error("Quantity must be between 0 and 1,000,000 tonnes.");
    }
    if (!Number.isFinite(args.pricePerTonne) || args.pricePerTonne <= 0) {
      throw new Error("Invalid price per tonne.");
    }

    const amountUsd = round2(args.tonnes * args.pricePerTonne);
    const amountCents = Math.round(amountUsd * 100);
    if (amountCents < 100) {
      throw new Error("Order total must be at least $1.00.");
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: amountCents,
            product_data: {
              name: `${args.creditName} — ${args.tonnes.toLocaleString("en-US")} t CO2e`,
              description: `${args.creditId} · ${args.registry} · $${args.pricePerTonne.toFixed(2)}/t`,
            },
          },
        },
      ],
      success_url: `${args.origin}/portfolio/new?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${args.origin}/portfolio/new?checkout=cancelled&credit=${encodeURIComponent(args.creditId)}`,
      metadata: {
        userId: identity.subject,
        creditId: args.creditId,
        creditName: args.creditName,
        tonnes: String(args.tonnes),
        pricePerTonne: String(args.pricePerTonne),
      },
    });

    if (!session.url) {
      throw new Error("Stripe did not return a checkout URL.");
    }

    return { sessionId: session.id, url: session.url, amountUsd };
  },
});

export const confirmCheckoutSession = action({
  args: { sessionId: v.string() },
  handler: async (
    ctx,
    args,
  ): Promise<{
    paid: boolean;
    status: string;
    creditId: string | null;
    creditName: string | null;
    tonnes: number;
    amountUsd: number;
    receipt: string | null;
    paymentIntent: string | null;
  }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Sign in to confirm a payment.");
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(args.sessionId, {
      expand: ["payment_intent"],
    });

    // A session can only be claimed by the account that created it.
    if (session.metadata?.userId !== identity.subject) {
      throw new Error("This checkout session belongs to a different account.");
    }

    const paid = session.payment_status === "paid";
    const tonnes = Number(session.metadata?.tonnes ?? 0);
    const pricePerTonne = Number(session.metadata?.pricePerTonne ?? 0);
    const amountUsd = round2((session.amount_total ?? 0) / 100);
    const creditId = session.metadata?.creditId ?? null;
    const creditName = session.metadata?.creditName ?? null;
    const paymentIntent =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : (session.payment_intent?.id ?? null);

    let receipt: string | null = null;
    if (paid && creditId && tonnes > 0) {
      const recorded: { receipt: string } = await ctx.runMutation(
        api.transactions.recordPurchase,
        {
          sessionId: session.id,
          creditId,
          creditName: creditName ?? creditId,
          tonnes,
          pricePerTonne,
          amountUsd,
          paymentIntent: paymentIntent ?? undefined,
        },
      );
      receipt = recorded.receipt;
    }

    return {
      paid,
      status: session.status ?? "unknown",
      creditId,
      creditName,
      tonnes,
      amountUsd,
      receipt,
      paymentIntent,
    };
  },
});
