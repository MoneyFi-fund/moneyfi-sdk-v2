export interface MoneyFiSdkConfig {
  apiKey: string;
  /** Optional endpoint override for TEST keys only. LIVE keys always use MoneyFi production. */
  testBaseUrl?: string;
  fetch?: typeof globalThis.fetch;
  timeoutMs?: number;
}

export const PRODUCTION_BASE_URL = "https://be.moneyfi.fund";
export const DEFAULT_TIMEOUT_MS = 15_000;

const SDK_KEY = /^mf_sdk_(test|live)_[A-Za-z0-9_-]+$/;

export interface ResolvedConfig {
  apiKey: string;
  baseUrl: string;
  fetch: typeof globalThis.fetch;
  timeoutMs: number;
}

export function resolveConfig(config: MoneyFiSdkConfig): ResolvedConfig {
  if (SDK_KEY.exec(config.apiKey)?.[0] !== config.apiKey) {
    throw new TypeError("apiKey is not a valid MoneyFi SDK key");
  }

  const isTestKey = config.apiKey.startsWith("mf_sdk_test_");
  if (!isTestKey && config.testBaseUrl !== undefined) {
    throw new TypeError("testBaseUrl can only be used with a TEST SDK key");
  }
  if (
    config.timeoutMs !== undefined &&
    (!Number.isSafeInteger(config.timeoutMs) || config.timeoutMs <= 0)
  ) {
    throw new TypeError("timeoutMs must be a positive integer");
  }

  const fetchImplementation = config.fetch ?? globalThis.fetch;
  if (typeof fetchImplementation !== "function") {
    throw new TypeError("A Fetch API implementation is required");
  }

  return {
    apiKey: config.apiKey,
    baseUrl:
      isTestKey && config.testBaseUrl !== undefined
        ? normalizeTestBaseUrl(config.testBaseUrl)
        : PRODUCTION_BASE_URL,
    fetch: fetchImplementation,
    timeoutMs: config.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  };
}

function normalizeTestBaseUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new TypeError("testBaseUrl must be an absolute HTTP(S) URL");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new TypeError("testBaseUrl must use HTTP or HTTPS");
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new TypeError(
      "testBaseUrl must not contain credentials, query parameters, or a fragment",
    );
  }
  if (url.protocol === "http:" && !isLocalDevelopmentHost(url.hostname)) {
    throw new TypeError("testBaseUrl must use HTTPS except for local development");
  }
  return url.toString().replace(/\/$/, "");
}

function isLocalDevelopmentHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}
