import { describe, expect, it, vi } from "vitest";
import { MoneyFiNetworkError, MoneyFiSdk, MoneyFiSdkError } from "../../src";
import { API_KEY, json, LIVE_API_KEY } from "../fixtures";

describe("MoneyFiSdk transport", () => {
  it("sends the SDK key only through the dedicated header", async () => {
    const fetch = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      json({ vaults: [] }),
    );
    const sdk = new MoneyFiSdk({ apiKey: API_KEY, testBaseUrl: "https://example.test/", fetch });
    await sdk.vaults.list();

    const [url, init] = fetch.mock.calls[0]!;
    expect(String(url)).toBe("https://example.test/sdk/v2/vaults");
    expect(new Headers(init?.headers).get("X-MoneyFi-SDK-Key")).toBe(API_KEY);
    expect(init?.redirect).toBe("error");
    expect(String(url)).not.toContain(API_KEY);
  });

  it("returns typed API errors without leaking the SDK key", async () => {
    const fetch = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      json({ code: 429, message: "Daily limit", errorCode: "LIMIT", used: 10 }, 429),
    );
    const sdk = new MoneyFiSdk({ apiKey: API_KEY, fetch });
    const error = await sdk.vaults.list().catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(MoneyFiSdkError);
    expect(error).toMatchObject({ status: 429, code: 429, errorCode: "LIMIT" });
    expect(String(error)).not.toContain(API_KEY);
    expect(JSON.stringify(error)).not.toContain(API_KEY);
  });

  it("normalizes network and timeout failures", async () => {
    const fetch = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => {
      throw new Error(`request with ${API_KEY} failed`);
    });
    const sdk = new MoneyFiSdk({ apiKey: API_KEY, fetch });
    const error = await sdk.vaults.list().catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(MoneyFiNetworkError);
    expect(String(error)).not.toContain(API_KEY);
  });

  it("fails closed on malformed successful JSON", async () => {
    const fetch = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      new Response("not-json", { status: 200, headers: { "Content-Type": "text/plain" } }),
    );
    const sdk = new MoneyFiSdk({ apiKey: API_KEY, fetch });
    await expect(sdk.vaults.list()).rejects.toMatchObject({
      name: "MoneyFiNetworkError",
      message: "MoneyFi API returned invalid JSON",
    });
  });

  it("rejects malformed credentials and config before a request", () => {
    expect(() => new MoneyFiSdk({ apiKey: "bad" })).toThrow(TypeError);
    expect(() => new MoneyFiSdk({ apiKey: API_KEY, testBaseUrl: "file:///tmp/api" })).toThrow(
      TypeError,
    );
    expect(() =>
      new MoneyFiSdk({ apiKey: API_KEY, testBaseUrl: "http://api.example.com" }),
    ).toThrow(TypeError);
    expect(() =>
      new MoneyFiSdk({ apiKey: API_KEY, testBaseUrl: "https://example.com?tenant=1" }),
    ).toThrow(TypeError);
    expect(() =>
      new MoneyFiSdk({ apiKey: API_KEY, testBaseUrl: "https://example.com#api" }),
    ).toThrow(TypeError);
    expect(() =>
      new MoneyFiSdk({ apiKey: API_KEY, testBaseUrl: "http://127.0.0.1:8080" }),
    ).not.toThrow();
    expect(() =>
      new MoneyFiSdk({ apiKey: LIVE_API_KEY, testBaseUrl: "https://staging.example.com" }),
    ).toThrow(TypeError);
    expect(() => new MoneyFiSdk({ apiKey: API_KEY, timeoutMs: 0 })).toThrow(TypeError);
  });

  it("always uses the fixed production URL for LIVE keys", async () => {
    const fetch = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      json({ vaults: [] }),
    );
    const sdk = new MoneyFiSdk({ apiKey: LIVE_API_KEY, fetch });
    await sdk.vaults.list();
    expect(String(fetch.mock.calls[0]![0])).toBe("https://be.moneyfi.fund/sdk/v2/vaults");
  });
});
