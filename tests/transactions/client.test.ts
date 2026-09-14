import { describe, expect, it, vi } from "vitest";
import { MoneyFiSdk } from "../../src";
import {
  API_KEY,
  json,
  SDK_USER_TOKEN,
  SIGNATURE,
  TOKEN,
  USER,
  VAULT,
} from "../fixtures";

describe("transaction APIs", () => {
  it("serializes raw bigint amounts and signer-bound prepare payloads", async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(
        json({
          user: {
            address: USER,
            externalUserId: null,
            source: "SDK",
            createdAt: "2026-09-14T00:00:01Z",
          } as const,
          accessToken: SDK_USER_TOKEN,
          tokenType: "Bearer",
          expiresAt: "2099-09-14T00:00:00Z",
        }),
      )
      .mockImplementation(async () => json({}));
    const sdk = new MoneyFiSdk({ apiKey: API_KEY, fetch });
    await sdk.users.registerSigned({
      address: USER,
      messageVersion: 1,
      issuedAt: "2026-09-14T00:00:00Z",
      expiresAt: "2026-09-14T00:10:00Z",
      signature: SIGNATURE,
    });
    await sdk.transactions.prepareDeposit({
      user: USER,
      chainId: 56,
      tokenAddress: TOKEN,
      vaultId: VAULT,
      amount: 100n,
    });
    await sdk.transactions.prepareRedeem({
      user: USER,
      chainId: 56,
      tokenAddress: TOKEN,
      vaultId: VAULT,
      shares: "9",
    });
    await sdk.transactions.prepareCancel({
      user: USER,
      chainId: 56,
      tokenAddress: TOKEN,
      vaultId: VAULT,
      epochId: 7,
      side: "DEPOSIT",
    });

    const bodies = fetch.mock.calls.slice(1).map(([, init]) => JSON.parse(String(init?.body)));
    expect(bodies[0]).toMatchObject({ user: USER, amount: "100", chainId: 56 });
    expect(bodies[1]).toMatchObject({ user: USER, shares: "9", chainId: 56 });
    expect(bodies[2]).toMatchObject({ user: USER, epochId: 7, side: "DEPOSIT" });
    expect(fetch.mock.calls.slice(1).map(([url]) => String(url))).toEqual([
      "https://be.moneyfi.fund/sdk/v2/transactions/deposit",
      "https://be.moneyfi.fund/sdk/v2/transactions/redeem",
      "https://be.moneyfi.fund/sdk/v2/transactions/cancel",
    ]);
    for (const [, init] of fetch.mock.calls.slice(1)) {
      expect(new Headers(init?.headers).get("Authorization")).toBe(
        `Bearer ${SDK_USER_TOKEN}`,
      );
    }
  });

  it("allows a VAULT self-address prepare request without a bearer session", async () => {
    const fetch = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => json({}));
    const sdk = new MoneyFiSdk({ apiKey: API_KEY, fetch });
    await sdk.transactions.prepareDeposit({
      user: USER,
      chainId: 56,
      tokenAddress: TOKEN,
      vaultId: VAULT,
      amount: 100n,
    });

    expect(new Headers(fetch.mock.calls[0]![1]?.headers).get("Authorization")).toBeNull();
  });
});
