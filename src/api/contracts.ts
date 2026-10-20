// Keep transport amounts as strings. Arithmetic belongs in the amount module.
export type DecimalString = string;
export type ClaimStatus = "pending" | "completed" | "failed";

export interface Balance {
  asset: string;
  decimals: number;
  available: DecimalString;
  pending: DecimalString;
  claiming: DecimalString;
  usdPrice: DecimalString;
}

export interface BalancesResponse {
  asOf: string;
  items: Balance[];
}

export interface ClaimOptions {
  asset: string;
  minAmount: DecimalString;
  fee: DecimalString;
  destinations: { id: string; label: string }[];
}

export interface CreateClaimRequest {
  readonly asset: string;
  readonly amount: DecimalString;
  readonly destinationId: string;
}

export interface Claim {
  id: string;
  asset: string;
  amount: DecimalString;
  fee: DecimalString;
  receiveAmount: DecimalString;
  destinationId: string;
  status: ClaimStatus;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClaimResult {
  claim: Claim;
  // The replay header may be hidden by CORS; the documented 200 status also
  // identifies a replay. A new claim is returned with 201.
  replayed: boolean;
}

interface ActivityBase {
  id: string;
  asset: string;
  amount: DecimalString;
  createdAt: string;
  relatedId: string | null;
}

export type ActivityItem = ActivityBase &
  (
    | {
        type: "accrual";
        status: "pending" | "confirmed";
        exchange: string;
      }
    | { type: "reversal"; status: "confirmed"; exchange: string }
    | { type: "claim"; status: ClaimStatus; exchange: null }
  );

export interface ActivityResponse {
  items: ActivityItem[];
  nextCursor: string | null;
}

export interface ActivityQuery {
  limit?: number;
  cursor?: string;
}

export interface RequestOptions {
  signal?: AbortSignal;
}
