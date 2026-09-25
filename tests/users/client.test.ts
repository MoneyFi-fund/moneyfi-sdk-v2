import { describe, expect, it, vi } from "vitest";
import { MoneyFiSdk, MoneyFiValidationError } from "../../src";
import { API_KEY, json, SDK_USER_TOKEN, SIGNATURE, USER, VAULT } from "../fixtures";

describe("user APIs", () => {
  it("orchestrates the canonical EIP-191 registration without changing the message", async () => {
    const issued = {
      messageVersion: 1 as const,
      message: "MoneyFi Partner User Registration\nVersion: 1",
      issuedAt: "2026-09-14T00:00:00Z",
      expiresAt: "2026-09-14T00:10:00Z",
    };
    const responseUser = {
      address: USER,
      externalUserId: "Customer-A",
      source: "SDK",
      createdAt: "2026-09-14T00:00:01Z",
    } as const;
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(json(issued))
      .mockResolvedValueOnce(
        json(
          {
            user: responseUser,
            accessToken: SDK_USER_TOKEN,
            tokenType: "Bearer",
            expiresAt: "2099-09-14T00:00:00Z",
          },
          201,
        ),
      );
    const signMessage = vi.fn(async () => SIGNATURE as `0x${string}`);
    const sdk = new MoneyFiSdk({ apiKey: API_KEY, fetch });

    await expect(
      sdk.users.register({
        address: USER.toUpperCase().replace("0X", "0x") as `0x${string}`,
        externalUserId: "Customer-A",
        signMessage,
      }),
    ).resolves.toMatchObject({ user: responseUser, accessToken: SDK_USER_TOKEN });
    expect(signMessage).toHaveBeenCalledWith({ message: issued.message, address: USER });
    expect(JSON.parse(String(fetch.mock.calls[1]![1]?.body))).toEqual({
      address: USER,
      externalUserId: "Customer-A",
      messageVersion: 1,
      issuedAt: issued.issuedAt,
      expiresAt: issued.expiresAt,
      signature: SIGNATURE,
    });
    expect(sdk.users.isAuthenticated(USER)).toBe(true);
  });

  it("builds membership lookup, position, request and activity routes", async () => {
    const responseUser = {
      address: USER,
      externalUserId: null,
      source: "SDK",
      createdAt: "2026-09-14T00:00:01Z",
    } as const;
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(
        json({
          user: responseUser,
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
    await sdk.users.get(USER);
    await sdk.users.positions(USER, { vaultId: VAULT });
    await sdk.users.requests(USER, {
      vaultId: VAULT,
      status: "DONE",
      side: "REDEEM",
      page: 3,
      limit: 7,
    });
    await sdk.users.activity(USER, { vaultId: VAULT, page: 4, limit: 9 });

    const urls = fetch.mock.calls.map(([url]) => String(url));
    expect(urls[1]).toBe(`https://be.moneyfi.fund/sdk/v2/users/${USER}`);
    expect(urls[2]).toContain(`/positions?vaultId=${VAULT}`);
    expect(urls[3]).toContain("status=DONE");
    expect(urls[3]).toContain("side=REDEEM");
    expect(urls[4]).toContain("page=4");

    expect(new Headers(fetch.mock.calls[1]![1]?.headers).get("Authorization")).toBeNull();
    for (const index of [2, 3, 4]) {
      expect(new Headers(fetch.mock.calls[index]![1]?.headers).get("Authorization")).toBe(
        `Bearer ${SDK_USER_TOKEN}`,
      );
    }

    sdk.users.disconnect(USER);
    expect(sdk.users.isAuthenticated(USER)).toBe(false);
  });

  it("validates user inputs locally", () => {
    const sdk = new MoneyFiSdk({ apiKey: API_KEY, fetch: vi.fn() });
    expect(() => sdk.users.get("not-an-address")).toThrow(MoneyFiValidationError);
    expect(() =>
      sdk.users.registerSigned({
        address: USER,
        messageVersion: 1,
        issuedAt: "now",
        expiresAt: "later",
        signature: "0x12",
      }),
    ).toThrow(MoneyFiValidationError);
  });

  it("omits the bearer token when no session exists for a VAULT self-address flow", async () => {
    const fetch = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      json({ positions: [] }),
    );
    const sdk = new MoneyFiSdk({ apiKey: API_KEY, fetch });
    await sdk.users.positions(USER);
    expect(new Headers(fetch.mock.calls[0]![1]?.headers).get("Authorization")).toBeNull();
  });

  it("can restore a still-valid user session after recreating the SDK client", async () => {
    const fetch = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      json({ positions: [] }),
    );
    const sdk = new MoneyFiSdk({ apiKey: API_KEY, fetch });
    sdk.users.restoreSession({
      user: {
        address: USER,
        externalUserId: null,
        source: "SDK",
        createdAt: "2026-09-14T00:00:00Z",
      },
      accessToken: SDK_USER_TOKEN,
      tokenType: "Bearer",
      expiresAt: "2099-09-14T00:00:00Z",
    });

    await sdk.users.positions(USER);
    expect(new Headers(fetch.mock.calls[0]![1]?.headers).get("Authorization")).toBe(
      `Bearer ${SDK_USER_TOKEN}`,
    );
  });
});
