import type { Address, DateTimeString } from "../core/types";

export interface VaultChain {
  chainId: number;
  name: string;
}

export interface VaultToken {
  chainId: number;
  address: Address;
  symbol: string | null;
  decimals: number | null;
}

export interface VaultCapabilities {
  depositMode: string;
  withdrawMode: string;
  estimateWithdrawalTime: string;
}

export interface Vault {
  vaultId: Address;
  vaultType: string;
  platform: string;
  name: string;
  description: string;
  chains: VaultChain[];
  primaryChainId: number | null;
  tokens: VaultToken[];
  status: string;
  depositEnabled: boolean;
  withdrawEnabled: boolean;
  apr?: string;
  apy?: string;
  tvl: string | null;
  investedAssets: string | null;
  realizedPnl: string | null;
  unrealizedPnl: string | null;
  totalPnl: string | null;
  capacity: string | null;
  minActiveVaultFundsize: string | null;
  riskScore: string | null;
  expectedIrrPct?: string;
  realizedIrrPct?: string;
  unrealizedIrrPct?: string;
  capabilities: VaultCapabilities;
}

export interface VaultList {
  vaults: Vault[];
}

export interface VaultPositionActions {
  canDeposit: boolean;
  canRequestWithdraw: boolean;
  canClaim: boolean;
  blockedReason: string | null;
}

export interface VaultPositionFeeMetrics {
  realizedManagementFee: string;
  realizedPerformanceFee: string;
  unrealizedManagementFee: string;
  unrealizedPerformanceFee: string;
  asOf: DateTimeString;
}

export interface VaultPositionMetrics {
  ownershipBps?: string;
  estimatedVaultNav?: string;
  estimatedUserValue?: string;
  investedAssets: string;
  realizedPnl: string | null;
  unrealizedPnl: string | null;
  totalPnl: string | null;
  claimedProfit: string;
  unclaimedProfit: string;
  realizedIrrPct: string | null;
  unrealizedIrrPct: string | null;
  totalDistributed: string;
  totalWithdrawnFromStrategy: string;
  fees: VaultPositionFeeMetrics | null;
}

export type VaultPositionDetails =
  | { type: "ASYNC_STRATEGY"; strategyAddress: Address; sharePrice: string | null }
  | { type: "EMPTY" };

export interface VaultPosition {
  vaultId: Address;
  platform: string;
  chainId: number | null;
  token: VaultToken | null;
  assets: string;
  shares: string;
  withdrawableAssets: string;
  pendingAssets: string;
  claimableAssets: string;
  pendingDepositAssets: string;
  pendingRedeemShares: string;
  claimableDepositShares: string;
  claimableRedeemAssets: string;
  status: string;
  actions: VaultPositionActions;
  metrics: VaultPositionMetrics | null;
  details: VaultPositionDetails;
}

export interface VaultPositions {
  positions: VaultPosition[];
}
