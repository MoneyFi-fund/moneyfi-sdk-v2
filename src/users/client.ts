import type { HttpClient, RequestOptions } from "../core/http-client";
import type { Address } from "../core/types";
import { UserSessionStore } from "../core/user-session";
import type { Paginated } from "../core/types";
import { address, externalUserId, pagination, signature } from "../core/validation";
import type { VaultPositions } from "../vaults/types";
import type {
  Activity,
  RegisterUserInput,
  RegistrationMessage,
  RegistrationMessageInput,
  SdkUser,
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
      body: registrationIdentity(input),
    });
  }

  registerSigned(input: SignedRegistrationInput): Promise<SdkUserSession> {
    const identity = registrationIdentity(input);
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
      this.sessions.set({
        address: session.user.address,
        accessToken: session.accessToken,
        expiresAt: session.expiresAt,
      });
      return session;
    });
  }

  async register(input: RegisterUserInput): Promise<SdkUserSession> {
    const identity = registrationIdentity(input);
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

  /** Check active membership in this partnership integration; 404 means not registered here, not that the MoneyFi wallet is unknown. */
  get(userAddress: string): Promise<SdkUser> {
    return this.http.request(`/sdk/v2/users/${address(userAddress)}`);
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

function registrationIdentity(input: RegistrationMessageInput): RegistrationMessageInput {
  const external = externalUserId(input.externalUserId);
  return {
    address: address(input.address),
    ...(external !== undefined ? { externalUserId: external } : {}),
  };
}
