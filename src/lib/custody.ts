/**
 * Simulated custody book — illustrative sample data shared by the ledger screen,
 * the buy/sell workspace and the scan panels (audit trail + receipts).
 */
import { scoredCredits } from "@/lib/credits";

const QTY = [12_000, 8_000, 5_000, 3_000, 1_500];

export const POSITIONS = scoredCredits.slice(0, 5).map((e, i) => ({
  credit: e.credit,
  risk: e.risk,
  tonnes: QTY[i],
  costBasis: Math.round(e.credit.price * (0.9 + i * 0.035) * 100) / 100,
}));

export type TxnType = "BUY" | "SELL" | "RETIRE";

export interface Txn {
  hash: string;
  type: TxnType;
  id: string;
  tonnes: number;
  usd: number;
  date: string;
  status: string;
}

export const TRANSACTIONS: Txn[] = [
  { hash: "0x9f2c…a41d", type: "BUY", id: "VCS-1942", tonnes: 12_000, usd: 148_800, date: "2026-09-28 14:02 UTC", status: "SETTLED" },
  { hash: "0x71ab…09e2", type: "BUY", id: "ACR-5529", tonnes: 8_000, usd: 140_600, date: "2026-09-21 09:47 UTC", status: "SETTLED" },
  { hash: "0x3d80…bb17", type: "SELL", id: "GS-7703", tonnes: 4_500, usd: 42_975, date: "2026-09-14 16:20 UTC", status: "SETTLED" },
  { hash: "0xc44e…5f90", type: "RETIRE", id: "CAR-1140", tonnes: 2_000, usd: 15_600, date: "2026-09-02 11:08 UTC", status: "RETIRED" },
  { hash: "0x2a19…7c63", type: "BUY", id: "VCS-4408", tonnes: 3_000, usd: 61_200, date: "2026-08-25 08:31 UTC", status: "SETTLED" },
  { hash: "0x8e57…d2aa", type: "BUY", id: "GS-3311", tonnes: 1_500, usd: 20_400, date: "2026-08-11 13:55 UTC", status: "SETTLED" },
];
