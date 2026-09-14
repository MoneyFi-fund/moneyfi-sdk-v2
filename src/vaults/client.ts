import type { HttpClient } from "../core/http-client";
import { address } from "../core/validation";
import type { Vault, VaultList } from "./types";

export class VaultsClient {
  constructor(private readonly http: HttpClient) {}

  list(): Promise<VaultList> {
    return this.http.request("/sdk/v2/vaults");
  }

  get(vaultId: string): Promise<Vault> {
    return this.http.request(`/sdk/v2/vaults/${address(vaultId, "vaultId")}`);
  }
}
