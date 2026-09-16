import { describe, expect, it, vi } from "vitest";
import { MoneyFiSdk } from "../../src";
import { API_KEY, json } from "../fixtures";

describe("analytics APIs", () => {
  it("loads overview and revenue using only the SDK key", async () => {
    const overview = {
      partnershipType: "AGENCY",
      userScope: "REFERRAL",
      users: { total: 2, funded: 1, active: 1 },
      generatedAt: "2026-09-16T00:00:00Z",
      byAsset: [],
      byVault: [],
    };
    const revenue = {
      calculationMode: "CURRENT_RATE_LIFETIME_REALIZED_PERFORMANCE_FEE",
      revenueShareBps: 3000,
      generatedAt: "2026-09-16T00:00:00Z",
      byAsset: [],
      byVault: [],
    };
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(json(overview))
      .mockResolvedValueOnce(json(revenue));
    const sdk = new MoneyFiSdk({ apiKey: API_KEY, fetch });

    await expect(sdk.analytics.getOverview()).resolves.toEqual(overview);
    await expect(sdk.analytics.getRevenue()).resolves.toEqual(revenue);

    expect(String(fetch.mock.calls[0]![0])).toBe(
      "https://be.moneyfi.fund/sdk/v2/analytics",
    );
    expect(String(fetch.mock.calls[1]![0])).toBe(
      "https://be.moneyfi.fund/sdk/v2/revenue",
    );
    for (const [, init] of fetch.mock.calls) {
      const headers = new Headers(init?.headers);
      expect(headers.get("X-MoneyFi-SDK-Key")).toBe(API_KEY);
      expect(headers.has("Authorization")).toBe(false);
    }
  });
});
