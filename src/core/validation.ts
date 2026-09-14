import { MoneyFiValidationError } from "./errors";
import type { Address, Hex, PaginationInput } from "./types";

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

export function externalUserId(value: string | null | undefined): string | null | undefined {
  if (value === undefined || value === null) return value;
  if (value.length === 0 || value.trim() !== value || [...value].length > 255) {
    throw new MoneyFiValidationError(
      "externalUserId must contain 1 to 255 characters without surrounding whitespace",
    );
  }
  return value;
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
