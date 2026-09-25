import { MoneyFiValidationError } from "./errors";
import type { Address, Hex, PaginationInput, RawIntegerInput } from "./types";

const EVM_ADDRESS = /^0x[0-9a-fA-F]{40}$/;
const EVM_SIGNATURE = /^0x[0-9a-fA-F]{130}$/;

export function address(value: string, field = "address"): Address {
  if (!EVM_ADDRESS.test(value)) {
    throw new MoneyFiValidationError(`${field} must be a valid EVM address`);
  }
  return value.toLowerCase() as Address;
}

export function signature(value: string): Hex {
  if (!EVM_SIGNATURE.test(value)) {
    throw new MoneyFiValidationError("signature must be a 65-byte EVM signature");
  }
  return value as Hex;
}

export function pagination(input: PaginationInput | undefined): void {
  if (input?.page !== undefined && (!Number.isSafeInteger(input.page) || input.page < 1)) {
    throw new MoneyFiValidationError("page must be a positive integer");
  }
  if (
    input?.limit !== undefined &&
    (!Number.isSafeInteger(input.limit) || input.limit < 1 || input.limit > 100)
  ) {
    throw new MoneyFiValidationError("limit must be an integer between 1 and 100");
  }
}

export function positiveSafeInteger(value: number, field: string): number {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new MoneyFiValidationError(`${field} must be a positive safe integer`);
  }
  return value;
}

export function positiveEpochId(value: RawIntegerInput): string {
  if (typeof value === "number") return String(positiveSafeInteger(value, "epochId"));
  if (typeof value === "string" && !/^[1-9][0-9]*$/.test(value)) {
    throw new MoneyFiValidationError("epochId must be a positive decimal uint64");
  }
  if (typeof value !== "string" && typeof value !== "bigint") {
    throw new MoneyFiValidationError("epochId must be a positive decimal uint64");
  }
  const parsed = BigInt(value);
  if (parsed <= 0n || parsed > 18_446_744_073_709_551_615n) {
    throw new MoneyFiValidationError("epochId must be a positive decimal uint64");
  }
  return parsed.toString();
}
