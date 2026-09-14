import { MoneyFiValidationError } from "../core/errors";
import type { RawAmountInput } from "../core/types";

const UNSIGNED_INTEGER = /^(0|[1-9]\d*)$/;

export function toRawAmount(value: RawAmountInput, field = "amount"): string {
  const raw = typeof value === "bigint" ? value.toString() : value;
  if (!UNSIGNED_INTEGER.test(raw) || raw === "0") {
    throw new MoneyFiValidationError(`${field} must be a positive raw integer`);
  }
  return raw;
}

export function parseUnits(value: string, decimals: number): bigint {
  assertDecimals(decimals);
  if (!/^(0|[1-9]\d*)(\.\d+)?$/.test(value)) {
    throw new MoneyFiValidationError("value must be an unsigned decimal string");
  }
  const [whole = "0", fraction = ""] = value.split(".");
  if (fraction.length > decimals) {
    throw new MoneyFiValidationError(`value has more than ${decimals} decimal places`);
  }
  return BigInt(whole) * 10n ** BigInt(decimals) + BigInt(fraction.padEnd(decimals, "0") || "0");
}

export function formatUnits(value: bigint | string, decimals: number): string {
  assertDecimals(decimals);
  const raw = typeof value === "bigint" ? value : parseRawUnsigned(value);
  if (raw < 0n) throw new MoneyFiValidationError("value must be unsigned");
  if (decimals === 0) return raw.toString();
  const padded = raw.toString().padStart(decimals + 1, "0");
  const whole = padded.slice(0, -decimals);
  const fraction = padded.slice(-decimals).replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole;
}

function parseRawUnsigned(value: string): bigint {
  if (!UNSIGNED_INTEGER.test(value)) {
    throw new MoneyFiValidationError("value must be an unsigned raw integer");
  }
  return BigInt(value);
}

function assertDecimals(decimals: number): void {
  if (!Number.isSafeInteger(decimals) || decimals < 0 || decimals > 255) {
    throw new MoneyFiValidationError("decimals must be an integer between 0 and 255");
  }
}
