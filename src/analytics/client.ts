import type { HttpClient } from "../core/http-client";
import type { PartnershipAnalytics, PartnershipRevenue } from "./types";

export class AnalyticsClient {
  constructor(private readonly http: HttpClient) {}

  getOverview(): Promise<PartnershipAnalytics> {
    return this.http.request("/sdk/v2/analytics");
  }

  getRevenue(): Promise<PartnershipRevenue> {
    return this.http.request("/sdk/v2/revenue");
  }
}
