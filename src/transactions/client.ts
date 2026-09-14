import { address, positiveSafeInteger } from "../core/validation";
import type { HttpClient, RequestOptions } from "../core/http-client";
import type { Address } from "../core/types";
import { UserSessionStore } from "../core/user-session";
import { toRawAmount } from "../utils/amounts";
import type {
  PrepareCancelInput,
  PrepareDepositInput,
  PreparedTransaction,
  PrepareRedeemInput,
} from "./types";

export class TransactionsClient {
  constructor(
    private readonly http: HttpClient,
    private readonly sessions: UserSessionStore,
  ) {}

  prepareDeposit(input: PrepareDepositInput): Promise<PreparedTransaction> {
    const user = address(input.user, "user");
    return this.http.request("/sdk/v2/transactions/deposit", {
      method: "POST",
      ...userAuthorization(this.sessions, user),
      body: transactionIdentity(input, { amount: toRawAmount(input.amount) }),
    });
  }

  prepareRedeem(input: PrepareRedeemInput): Promise<PreparedTransaction> {
    const user = address(input.user, "user");
    return this.http.request("/sdk/v2/transactions/redeem", {
      method: "POST",
      ...userAuthorization(this.sessions, user),
      body: transactionIdentity(input, { shares: toRawAmount(input.shares, "shares") }),
    });
  }

  prepareCancel(input: PrepareCancelInput): Promise<PreparedTransaction> {
    const user = address(input.user, "user");
    return this.http.request("/sdk/v2/transactions/cancel", {
      method: "POST",
      ...userAuthorization(this.sessions, user),
      body: transactionIdentity(input, {
        epochId: positiveSafeInteger(input.epochId, "epochId"),
        side: input.side,
      }),
    });
  }
}

function userAuthorization(
  sessions: UserSessionStore,
  user: Address,
): Pick<RequestOptions, "accessToken"> {
  const accessToken = sessions.get(user);
  return accessToken === undefined ? {} : { accessToken };
}

function transactionIdentity<
  T extends { user: string; chainId: number; tokenAddress: string; vaultId: string },
>(input: T, rest: Record<string, unknown>): Record<string, unknown> {
  return {
    user: address(input.user, "user"),
    chainId: positiveSafeInteger(input.chainId, "chainId"),
    tokenAddress: address(input.tokenAddress, "tokenAddress"),
    vaultId: address(input.vaultId, "vaultId"),
    ...rest,
  };
}
