import type { Address, DateTimeString } from "./types";

interface StoredUserSession {
  address: Address;
  accessToken: string;
  expiresAt: DateTimeString;
}

export class UserSessionStore {
  readonly #sessions = new Map<string, StoredUserSession>();

  set(session: StoredUserSession): void {
    this.#sessions.set(normalized(session.address), session);
  }

  get(userAddress: Address): string | undefined {
    const session = this.#sessions.get(normalized(userAddress));
    if (!session || !Number.isFinite(Date.parse(session.expiresAt))) {
      return undefined;
    }
    if (Date.now() >= Date.parse(session.expiresAt)) {
      this.#sessions.delete(normalized(userAddress));
      return undefined;
    }
    return session.accessToken;
  }

  delete(userAddress: Address): void {
    this.#sessions.delete(normalized(userAddress));
  }

  has(userAddress: Address): boolean {
    return this.get(userAddress) !== undefined;
  }
}

function normalized(value: string): string {
  return value.toLowerCase();
}
