import { describe, expect, it, vi } from "vitest";
import { MoneyFiSdk } from "../../src";
import { API_KEY, json, VAULT } from "../fixtures";

describe("vault APIs", () => {
  it("builds both vault routes", async () => {
    const fetch = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      json({ vaults: [] }),
    );
    const sdk = new MoneyFiSdk({ apiKey: API_KEY, fetch });
    await sdk.vaults.list();
    await sdk.vaults.get(VAULT.toUpperCase().replace("0X", "0x"));
    expect(String(fetch.mock.calls[1]![0])).toBe(`https://be.moneyfi.fund/sdk/v2/vaults/${VAULT}`);
  });
});
