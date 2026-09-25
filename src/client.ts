import type { MoneyFiSdkConfig } from "./core/config";
import { HttpClient } from "./core/http-client";
import { UserSessionStore } from "./core/user-session";
import { TransactionsClient } from "./transactions/client";
import { UsersClient } from "./users/client";
import { VaultsClient } from "./vaults/client";

export class MoneyFiSdk {
  readonly users: UsersClient;
  readonly vaults: VaultsClient;
  readonly transactions: TransactionsClient;

  constructor(config: MoneyFiSdkConfig) {
    const http = new HttpClient(config);
    const sessions = new UserSessionStore();
    this.users = new UsersClient(http, sessions);
    this.vaults = new VaultsClient(http);
    this.transactions = new TransactionsClient(http, sessions);
  }
}
