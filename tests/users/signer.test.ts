import { describe, expect, it, vi } from "vitest";
import {
  createEip1193Signer,
  MoneyFiValidationError,
  utf8ToHex,
} from "../../src";
import { SIGNATURE, USER } from "../fixtures";

describe("EIP-1193 signer", () => {
  it("requests personal_sign with UTF-8 hex and the economic owner", async () => {
    const request = vi.fn(async () => SIGNATURE);
    const signer = createEip1193Signer({ request });
    await expect(signer({ message: "MoneyFi ✓", address: USER })).resolves.toBe(SIGNATURE);
    expect(request).toHaveBeenCalledWith({
      method: "personal_sign",
      params: [utf8ToHex("MoneyFi ✓"), USER],
    });
  });

  it("rejects malformed wallet signatures", async () => {
    const signer = createEip1193Signer({ request: async () => "0x12" });
    await expect(signer({ message: "message", address: USER })).rejects.toBeInstanceOf(
      MoneyFiValidationError,
    );
  });
});
