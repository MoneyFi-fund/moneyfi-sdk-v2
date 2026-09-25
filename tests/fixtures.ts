export const API_KEY = `mf_sdk_test_${"A".repeat(43)}`;
export const LIVE_API_KEY = `mf_sdk_live_${"B".repeat(43)}`;
export const USER = "0x1111111111111111111111111111111111111111";
export const VAULT = "0x2222222222222222222222222222222222222222";
export const TOKEN = "0x3333333333333333333333333333333333333333";
export const SIGNATURE = `0x${"ab".repeat(65)}` as `0x${string}`;
export const SDK_USER_TOKEN = "sdk-user-jwt";

export function json(body: unknown, status = 200): Response {
  return new Response(body === undefined ? undefined : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
