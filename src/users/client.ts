import type { HttpClient, RequestOptions } from "../core/http-client";
import { MoneyFiNetworkError, MoneyFiValidationError } from "../core/errors";
import type { Address } from "../core/types";
import { UserSessionStore } from "../core/user-session";
import type { Paginated } from "../core/types";
import { address, pagination, signature } from "../core/validation";
import type { VaultPositions } from "../vaults/types";
import type {
  Activity,
  RegisterUserInput,
  RegistrationMessage,
  RegistrationMessageInput,
  SdkUserSession,
  SignedRegistrationInput,
  UserActivityInput,
  UserPositionsInput,
  UserRequestsInput,
  VaultRequest,
} from "./types";

export class UsersClient {
  constructor(
    private readonly http: HttpClient,
    private readonly sessions: UserSessionStore,
  ) {}

  registrationMessage(input: RegistrationMessageInput): Promise<RegistrationMessage> {
    return this.http.request("/sdk/v2/users/registration-message", {
      method: "POST",
      body: registrationIdentity(input, ["address"]),
    });
  }

  registerSigned(input: SignedRegistrationInput): Promise<SdkUserSession> {
    const identity = registrationIdentity(input, [
      "address",
      "messageVersion",
      "issuedAt",
      "expiresAt",
      "signature",
    ]);
    if (input.messageVersion !== 1) throw new TypeError("messageVersion must be 1");
    return this.http.request<SdkUserSession>("/sdk/v2/users", {
      method: "POST",
      body: {
        ...identity,
        messageVersion: 1,
        issuedAt: input.issuedAt,
        expiresAt: input.expiresAt,
        signature: signature(input.signature),
      },
    }).then((session) => {
      const publicSession: SdkUserSession = {
        user: {
          address: address(session.user.address),
          source: session.user.source,
          createdAt: session.user.createdAt,
        },
        accessToken: session.accessToken,
        tokenType: session.tokenType,
        expiresAt: session.expiresAt,
      };
      this.sessions.set({
        address: publicSession.user.address,
        accessToken: publicSession.accessToken,
        expiresAt: publicSession.expiresAt,
      });
      return publicSession;
    });
  }

  async register(input: RegisterUserInput): Promise<SdkUserSession> {
    const identity = registrationIdentity(input, ["address", "signMessage"]);
    const proof = await this.registrationMessage(identity);
    const signed = await input.signMessage({ message: proof.message, address: identity.address });
    return this.registerSigned({
      ...identity,
      messageVersion: proof.messageVersion,
      issuedAt: proof.issuedAt,
      expiresAt: proof.expiresAt,
      signature: signed,
    });
  }

  /** Check active registration in this partnership without exposing mapping metadata. */
  async isRegistered(userAddress: string): Promise<boolean> {
    const result = await this.http.request<{ registered: boolean }>(
      `/sdk/v2/users/${address(userAddress)}/registration`,
    );
    if (typeof result?.registered !== "boolean") {
      throw new MoneyFiNetworkError("MoneyFi API returned an invalid registration status");
    }
    return result.registered;
  }

  positions(userAddress: string, input: UserPositionsInput = {}): Promise<VaultPositions> {
    const user = address(userAddress);
    return this.http.request(`/sdk/v2/users/${user}/positions`, {
      ...userAuthorization(this.sessions, user),
      query: {
        vaultId: input.vaultId === undefined ? undefined : address(input.vaultId, "vaultId"),
      },
    });
  }

  requests(userAddress: string, input: UserRequestsInput = {}): Promise<Paginated<VaultRequest>> {
    pagination(input);
    const user = address(userAddress);
    return this.http.request(`/sdk/v2/users/${user}/requests`, {
      ...userAuthorization(this.sessions, user),
      query: {
        vaultId: input.vaultId === undefined ? undefined : address(input.vaultId, "vaultId"),
        status: input.status,
        side: input.side,
        page: input.page,
        limit: input.limit,
      },
    });
  }

  activity(userAddress: string, input: UserActivityInput = {}): Promise<Paginated<Activity>> {
    pagination(input);
    const user = address(userAddress);
    return this.http.request(`/sdk/v2/users/${user}/activity`, {
      ...userAuthorization(this.sessions, user),
      query: {
        vaultId: input.vaultId === undefined ? undefined : address(input.vaultId, "vaultId"),
        page: input.page,
        limit: input.limit,
      },
    });
  }

  disconnect(userAddress: string): void {
    this.sessions.delete(address(userAddress));
  }

  isAuthenticated(userAddress: string): boolean {
    return this.sessions.has(address(userAddress));
  }

  restoreSession(session: SdkUserSession): void {
    this.sessions.set({
      address: address(session.user.address),
      accessToken: session.accessToken,
      expiresAt: session.expiresAt,
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

function registrationIdentity(
  input: RegistrationMessageInput,
  allowedFields: readonly string[],
): RegistrationMessageInput {
  if (Object.keys(input).some((key) => !allowedFields.includes(key))) {
    throw new MoneyFiValidationError("Unsupported registration input field");
  }
  return { address: address(input.address) };
}
