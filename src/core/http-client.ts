import { resolveConfig, type MoneyFiSdkConfig } from "./config";
import { MoneyFiNetworkError, MoneyFiSdkError, type MoneyFiErrorBody } from "./errors";

export interface RequestOptions {
  method?: "GET" | "POST";
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  accessToken?: string;
}

export class HttpClient {
  readonly #apiKey: string;
  readonly #baseUrl: string;
  readonly #fetch: typeof globalThis.fetch;
  readonly #timeoutMs: number;

  constructor(config: MoneyFiSdkConfig) {
    const resolved = resolveConfig(config);
    this.#apiKey = resolved.apiKey;
    this.#baseUrl = resolved.baseUrl;
    this.#fetch = resolved.fetch;
    this.#timeoutMs = resolved.timeoutMs;
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const url = buildUrl(this.#baseUrl, path, options.query);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.#timeoutMs);

    try {
      const requestInit = buildRequestInit(this.#apiKey, controller.signal, options);
      const response = await this.#fetch(url, requestInit);
      const body = await readBody(response);
      if (!response.ok) {
        throw new MoneyFiSdkError(response.status, asErrorBody(body));
      }
      return body as T;
    } catch (error) {
      if (error instanceof MoneyFiSdkError || error instanceof MoneyFiNetworkError) throw error;
      if (controller.signal.aborted) {
        throw new MoneyFiNetworkError("MoneyFi API request timed out");
      }
      throw new MoneyFiNetworkError();
    } finally {
      clearTimeout(timeout);
    }
  }
}

function buildUrl(
  baseUrl: string,
  path: string,
  query: RequestOptions["query"],
): URL {
  const url = new URL(`${baseUrl}${path}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }
  return url;
}

function buildRequestInit(
  apiKey: string,
  signal: AbortSignal,
  options: RequestOptions,
): RequestInit {
  const requestInit: RequestInit = {
    method: options.method ?? "GET",
    redirect: "error",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-MoneyFi-SDK-Key": apiKey,
      ...(options.accessToken === undefined
        ? {}
        : { Authorization: `Bearer ${options.accessToken}` }),
    },
    signal,
  };
  if (options.body !== undefined) requestInit.body = JSON.stringify(options.body);
  return requestInit;
}

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    if (response.ok) throw new MoneyFiNetworkError("MoneyFi API returned invalid JSON");
    return {};
  }
}

function asErrorBody(value: unknown): MoneyFiErrorBody {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return {};
  return value as MoneyFiErrorBody;
}
