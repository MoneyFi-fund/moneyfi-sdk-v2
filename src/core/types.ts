export type Address = `0x${string}`;
export type Hex = `0x${string}`;
export type DateTimeString = string;
export type RawAmountInput = string | bigint;
export type RequestSide = "DEPOSIT" | "REDEEM";

export interface PaginationInput {
  page?: number;
  limit?: number;
}

export interface Paginated<T> {
  total: number;
  page: number;
  limit: number;
  nodes: T[];
}
