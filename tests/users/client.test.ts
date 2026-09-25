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
      source: "SDK",
      createdAt: "2026-09-14T00:00:01Z",
    } as const;
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(json(issued))
      .mockResolvedValueOnce(
        json(
          {
            user: { ...responseUser, internalOnly: "not-public" },
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
        signMessage,
      }),
    ).resolves.toEqual({
      user: responseUser,
      accessToken: SDK_USER_TOKEN,
      tokenType: "Bearer",
      expiresAt: "2099-09-14T00:00:00Z",
    });
    expect(signMessage).toHaveBeenCalledWith({ message: issued.message, address: USER });
    expect(JSON.parse(String(fetch.mock.calls[0]![1]?.body))).toEqual({ address: USER });
    expect(JSON.parse(String(fetch.mock.calls[1]![1]?.body))).toEqual({
      address: USER,
      messageVersion: 1,
      issuedAt: issued.issuedAt,
      expiresAt: issued.expiresAt,
      signature: SIGNATURE,
    });
    expect(sdk.users.isAuthenticated(USER)).toBe(true);
  });

  it("rejects unsupported registration fields before sending a request", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>();
    const sdk = new MoneyFiSdk({ apiKey: API_KEY, fetch });
    const identity = { address: USER as `0x${string}`, metadata: "injected" };

    expect(() => sdk.users.registrationMessage(identity)).toThrow(MoneyFiValidationError);
    expect(() =>
      sdk.users.registerSigned({
        ...identity,
        messageVersion: 1,
        issuedAt: "2026-09-14T00:00:00Z",
        expiresAt: "2026-09-14T00:10:00Z",
        signature: SIGNATURE,
      }),
    ).toThrow(MoneyFiValidationError);
    await expect(
      sdk.users.register({ ...identity, signMessage: async () => SIGNATURE }),
    ).rejects.toThrow(MoneyFiValidationError);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects an unsupported registration message version before sending a request", () => {
    const fetch = vi.fn<typeof globalThis.fetch>();
    const sdk = new MoneyFiSdk({ apiKey: API_KEY, fetch });

    expect(() =>
      sdk.users.registerSigned({
        address: USER,
        messageVersion: 2 as 1,
        issuedAt: "2026-09-14T00:00:00Z",
        expiresAt: "2026-09-14T00:10:00Z",
        signature: SIGNATURE,
      }),
    ).toThrow("messageVersion must be 1");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("builds registration, position, request and activity routes", async () => {
    const responseUser = {
      address: USER,
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
      .mockResolvedValueOnce(json({ registered: true }))
      .mockImplementation(async () => json({}));
    const sdk = new MoneyFiSdk({ apiKey: API_KEY, fetch });
    await sdk.users.registerSigned({
      address: USER,
      messageVersion: 1,
      issuedAt: "2026-09-14T00:00:00Z",
      expiresAt: "2026-09-14T00:10:00Z",
      signature: SIGNATURE,
    });
    await expect(sdk.users.isRegistered(USER)).resolves.toBe(true);
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
    expect(urls[1]).toBe(`https://be.moneyfi.fund/sdk/v2/users/${USER}/registration`);
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

  it("validates user inputs locally", async () => {
    const sdk = new MoneyFiSdk({ apiKey: API_KEY, fetch: vi.fn() });
    await expect(sdk.users.isRegistered("not-an-address")).rejects.toThrow(
      MoneyFiValidationError,
    );
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

  it("returns false for an unregistered wallet without a user session", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async () => json({ registered: false }));
    const sdk = new MoneyFiSdk({ apiKey: API_KEY, fetch });

    await expect(sdk.users.isRegistered(USER)).resolves.toBe(false);
    expect(new Headers(fetch.mock.calls[0]![1]?.headers).get("Authorization")).toBeNull();
  });

  it("keeps invalid SDK keys as authentication errors", async () => {
    const fetch = vi.fn(async () => json({ code: 401, message: "Unauthorized" }, 401));
    const sdk = new MoneyFiSdk({ apiKey: API_KEY, fetch });

    await expect(sdk.users.isRegistered(USER)).rejects.toMatchObject({
      name: "MoneyFiSdkError",
      status: 401,
    });
  });

  it("rejects a malformed registration response instead of treating it as false", async () => {
    const sdk = new MoneyFiSdk({ apiKey: API_KEY, fetch: vi.fn(async () => json({})) });

    await expect(sdk.users.isRegistered(USER)).rejects.toMatchObject({
      name: "MoneyFiNetworkError",
    });
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
