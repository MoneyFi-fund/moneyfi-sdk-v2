import { MoneyFiValidationError } from "../core/errors";
import type { Hex } from "../core/types";
import type { SignRegistrationMessage } from "./types";

export interface Eip1193Provider {
  request(args: { method: string; params?: readonly unknown[] }): Promise<unknown>;
}

export function createEip1193Signer(provider: Eip1193Provider): SignRegistrationMessage {
  return async ({ message, address }) => {
    const result = await provider.request({
      method: "personal_sign",
      params: [utf8ToHex(message), address],
    });
    if (typeof result !== "string" || !/^0x[0-9a-fA-F]{130}$/.test(result)) {
      throw new MoneyFiValidationError("wallet returned an invalid EIP-191 signature");
    }
    return result as Hex;
  };
}

export function utf8ToHex(value: string): Hex {
  const bytes = new TextEncoder().encode(value);
  return `0x${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}
