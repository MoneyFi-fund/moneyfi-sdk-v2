import type {
  Address,
  DateTimeString,
  Hex,
  PaginationInput,
  RequestSide,
} from "../core/types";

export type PartnershipUserSource = "REF_CODE" | "SDK" | "MANUAL" | "SELF";
export type RequestStatus = "PENDING" | "SETTLEMENT" | "DONE" | "CANCEL";
export type ActivityType =
  | "DEPOSIT_REQUESTED"
  | "REDEEM_REQUESTED"
  | "DEPOSIT_CANCELLED"
  | "REDEEM_CANCELLED"
  | "DEPOSIT_CLAIMED"
  | "REDEEM_CLAIMED"
  | "DEPOSIT_REFUNDED"
  | "REDEEM_REFUNDED";

export interface SdkUser {
  address: Address;
  externalUserId: string | null;
  source: PartnershipUserSource;
  createdAt: DateTimeString;
}

export interface SdkUserSession {
  user: SdkUser;
  accessToken: string;
  tokenType: "Bearer";
  expiresAt: DateTimeString;
}

export interface RegistrationMessageInput {
  address: Address;
  externalUserId?: string | null;
}

export interface RegistrationMessage {
  messageVersion: 1;
  message: string;
  issuedAt: DateTimeString;
  expiresAt: DateTimeString;
}

export interface SignedRegistrationInput extends RegistrationMessageInput {
  messageVersion: 1;
  issuedAt: DateTimeString;
  expiresAt: DateTimeString;
  signature: Hex;
}

export interface SignRegistrationMessageInput {
  message: string;
  address: Address;
}

export type SignRegistrationMessage = (
  input: SignRegistrationMessageInput,
) => Hex | Promise<Hex>;

export interface RegisterUserInput extends RegistrationMessageInput {
  signMessage: SignRegistrationMessage;
}

export interface UserPositionsInput {
  vaultId?: Address;
}

export interface RequestActions {
  canCancel: boolean;
  canClaim: boolean;
  canRefund: boolean;
}

export interface VaultRequest {
  requestId: number;
  vaultId: Address;
  chainId: number;
  side: RequestSide;
  epochId: string;
  status: RequestStatus;
  epochStatus: string;
  requestedInput: string;
  remainingInput: string;
  settledOutput: string;
  claimedOutput: string;
  refundedInput: string;
  inputUnit: "ASSET" | "SHARE";
  outputUnit: "ASSET" | "SHARE";
  txHash: Hex | null;
  createdAt: DateTimeString;
  updatedAt: DateTimeString;
  actions: RequestActions;
}

export interface UserRequestsInput extends PaginationInput {
  vaultId?: Address;
  status?: RequestStatus;
  side?: RequestSide;
}

export interface Activity {
  type: ActivityType;
  txHash: Hex;
  chainId: number;
  vaultId: Address;
  epochId: string;
  amount: string;
  unit: "ASSET" | "SHARE";
  token: Address;
  tokenDecimals: number;
  createdAt: DateTimeString;
}

export interface UserActivityInput extends PaginationInput {
  vaultId?: Address;
}
