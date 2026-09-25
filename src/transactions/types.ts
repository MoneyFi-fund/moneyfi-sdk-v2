import type { Address, Hex, RawAmountInput, RawIntegerInput, RequestSide } from "../core/types";

export interface TransactionPayload {
  to: Address;
  data: Hex;
  value: string;
  chainId: number;
}

export interface PreparedTransaction {
  requiredSigner: Address;
  chainId: number;
  vaultId: Address;
  tokenAddress: Address;
  approval: TransactionPayload | null;
  transaction: TransactionPayload;
  decoded: {
    contract: string;
    method: "requestDeposit" | "requestRedeem" | "cancelDeposit" | "cancelRedeem";
    args: Record<string, unknown>;
    quote?: Record<string, string>;
  };
  tracking: { payloadVersion: 2 };
}

export interface PrepareDepositInput {
  user: Address;
  chainId: number;
  tokenAddress: Address;
  vaultId: Address;
  amount: RawAmountInput;
}

export interface PrepareRedeemInput {
  user: Address;
  chainId: number;
  tokenAddress: Address;
  vaultId: Address;
  shares: RawAmountInput;
}

export interface PrepareCancelInput {
  user: Address;
  chainId: number;
  tokenAddress: Address;
  vaultId: Address;
  epochId: RawIntegerInput;
  side: RequestSide;
}
