/**
 * Stripe client-side configuration (TEST MODE).
 *
 * The publishable key is designed to ship in the browser bundle — it can only
 * create payment sessions, never move money. The matching secret key lives
 * exclusively on the Convex deployment (`STRIPE_SECRET_KEY`) and is used inside
 * the `payments` Convex actions.
 */
export const STRIPE_PUBLISHABLE_KEY =
  "pk_test_51UJrnGKk3CcNQ0yGMu4YvSKASUEycj6g31hlCzsuy356IJ3y0RgfVbriVr53KeuqItkmBI6o9jDZ8GYcpAs1h2MR00naV3iId2";

export const STRIPE_MODE: "test" | "live" = STRIPE_PUBLISHABLE_KEY.startsWith("pk_live")
  ? "live"
  : "test";

/** Last 6 characters of the publishable key, for status badges. */
export const STRIPE_KEY_TAIL = STRIPE_PUBLISHABLE_KEY.slice(-6);
