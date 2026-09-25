import { describe, expect, it } from "vitest";
import { formatUnits, MoneyFiValidationError, parseUnits, toRawAmount } from "../../src";

describe("amount helpers", () => {
  it("converts human decimals without floating-point arithmetic", () => {
    expect(parseUnits("123.456", 6)).toBe(123456000n);
    expect(parseUnits("0.000000000000000001", 18)).toBe(1n);
    expect(formatUnits(123456000n, 6)).toBe("123.456");
    expect(formatUnits("1000000000000000000", 18)).toBe("1");
  });

  it("rejects precision loss, exponent notation, signs, floats and zero raw mutations", () => {
    expect(() => parseUnits("1.0000001", 6)).toThrow(MoneyFiValidationError);
    expect(() => parseUnits("1e18", 18)).toThrow(MoneyFiValidationError);
    expect(() => parseUnits("-1", 18)).toThrow(MoneyFiValidationError);
    expect(() => toRawAmount("1.2")).toThrow(MoneyFiValidationError);
    expect(() => toRawAmount("0")).toThrow(MoneyFiValidationError);
    expect(() => toRawAmount(0n)).toThrow(MoneyFiValidationError);
  });

  it("preserves arbitrarily large raw integers", () => {
    const value = 2n ** 255n;
    expect(toRawAmount(value)).toBe(value.toString());
    expect(formatUnits(value, 0)).toBe(value.toString());
  });
});
