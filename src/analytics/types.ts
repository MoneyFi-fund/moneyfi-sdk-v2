import type { Address, DateTimeString } from "../core/types";

export type PartnershipType = "AGENCY" | "VAULT";
export type PartnershipUserScope = "REFERRAL" | "MANAGED";

export interface PartnershipUserMetrics {
  total: number;
  funded: number;
  active: number;
}

export interface AnalyticsAssetMetric {
  chainId: number;
  tokenAddress: Address;
  symbol: string;
  decimals: number;
  currentAum: string;
  lifetimeDepositVolume: string;
  lifetimeRedeemVolume: string;
}

export interface AnalyticsVaultMetric extends AnalyticsAssetMetric {
  vaultId: Address;
  vaultName: string;
  projectionAsOf: DateTimeString;
}

export interface PartnershipAnalytics {
  partnershipType: PartnershipType;
  userScope: PartnershipUserScope;
  users: PartnershipUserMetrics;
  generatedAt: DateTimeString;
  byAsset: AnalyticsAssetMetric[];
  byVault: AnalyticsVaultMetric[];
}

export interface RevenueAssetMetric {
  chainId: number;
  tokenAddress: Address;
  symbol: string;
  decimals: number;
  realizedManagementFee: string;
  realizedPerformanceFee: string;
  grossMoneyFiFee: string;
  partnerRevenue: string;
}

export interface RevenueVaultMetric extends RevenueAssetMetric {
  vaultId: Address;
  vaultName: string;
  projectionAsOf: DateTimeString;
}

export interface PartnershipRevenue {
  calculationMode: "CURRENT_RATE_LIFETIME_REALIZED_PERFORMANCE_FEE";
  revenueShareBps: number;
  generatedAt: DateTimeString;
  byAsset: RevenueAssetMetric[];
  byVault: RevenueVaultMetric[];
}
