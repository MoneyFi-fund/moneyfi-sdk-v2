# @moneyfi/sdk-v2

TypeScript SDK for integrating MoneyFi Vaults into Agency and Vault partnership applications.

The SDK key identifies the partnership. Agency users receive an additional wallet-scoped session
after signing a canonical EIP-191 message. A Vault partnership instead operates on the addresses
registered by its owner, which may be EOAs, contracts, multisigs, or smart accounts. MoneyFi never
receives a private key and the SDK never signs or submits an on-chain transaction.

## Installation

```bash
pnpm add @moneyfi/sdk-v2
```

## Create the client

```ts
import { MoneyFiSdk } from "@moneyfi/sdk-v2";

const moneyfi = new MoneyFiSdk({
  apiKey: MONEYFI_SDK_KEY,
});
```

Create one `MoneyFiSdk` instance for the application and reuse it.

## Connect a wallet

MoneyFi currently supports EOA ownership verification. Pass any wallet integration that can sign
an EIP-191 message:

```ts
const session = await moneyfi.users.register({
  address: walletAddress,
  externalUserId: currentUser.id, // optional, case-sensitive partner identifier
  signMessage: async ({ message, address }) => {
    return walletClient.signMessage({
      account: address,
      message,
    });
  },
});

console.log(session.user);
console.log(session.expiresAt);
```

`register()` creates the Agency mapping when needed and acts as an idempotent login when the exact
mapping already exists. The returned JWT is scoped to the wallet and Agency for 24 hours. The SDK
keeps it in memory and automatically attaches it only to owner-protected calls.

For an EIP-1193 provider:

```ts
import { createEip1193Signer } from "@moneyfi/sdk-v2";

const session = await moneyfi.users.register({
  address: walletAddress,
  signMessage: createEip1193Signer(window.ethereum),
});
```

If the application persists the returned session, restore it after recreating the SDK client:

```ts
moneyfi.users.restoreSession(savedSession);
```

Remove the local wallet session on logout:

```ts
moneyfi.users.disconnect(walletAddress);
```

## Vault partnership identity

A Vault partnership does not call `users.register()`. Its owner registers managed addresses in the
MoneyFi partnership dashboard. Read and prepare methods use one of those addresses and send only
the SDK key:

```ts
const positions = await moneyfi.users.positions(vaultAccountAddress);

const prepared = await moneyfi.transactions.prepareRedeem({
  user: vaultAccountAddress,
  chainId: 56,
  tokenAddress,
  vaultId,
  shares: parseUnits("1", 18),
});
```

MoneyFi rejects addresses outside the partnership's managed allowlist. Each managed address may
execute the returned calldata through its own EOA, contract, Safe, or smart-account execution flow.

## Read Agency users

These calls require only the SDK key:

```ts
const users = await moneyfi.users.list({
  page: 1,
  limit: 20,
});

const user = await moneyfi.users.get(walletAddress);
```

`users.get()` can be used to check whether a wallet is registered with the Agency. The user list
contains only users whose immutable MoneyFi referral belongs to the Agency.

## Read Vaults

Vault catalog and detail calls require only the SDK key:

```ts
const { vaults } = await moneyfi.vaults.list();
const vault = await moneyfi.vaults.get(vaults[0].vaultId);
```

## Partnership analytics and revenue

Analytics calls use only the partnership SDK key. Amounts are returned as exact human-readable
decimal strings in each asset's decimals:

```ts
const overview = await moneyfi.analytics.getOverview();
console.log(overview.users.active, overview.byVault);

const revenue = await moneyfi.analytics.getRevenue();
console.log(revenue.calculationMode, revenue.byVault);
```

Revenue is a current-rate view: MoneyFi applies the partnership's current revenue-share BPS only
to lifetime realized performance fees. Realized management fees remain visible but are excluded
from partner revenue. It is not a paid or payable balance.

## Read beneficiary data

Agency users must have an active SDK user session. A Vault partnership uses a registered managed
address without a bearer session:

```ts
const positions = await moneyfi.users.positions(walletAddress);

const requests = await moneyfi.users.requests(walletAddress, {
  vaultId,
  status: "PENDING",
  side: "DEPOSIT",
  page: 1,
  limit: 20,
});

const activity = await moneyfi.users.activity(walletAddress, {
  vaultId,
  page: 1,
  limit: 20,
});
```

For an Agency, the JWT wallet must exactly match the requested address. For a Vault partnership,
the requested address must exist in its managed allowlist.

## Deposit

Amounts passed to prepare methods are raw integer units. Use `parseUnits()` for human-readable
input. Agency prepares require the matching user session; Vault prepares require a registered
managed address:

```ts
import { parseUnits } from "@moneyfi/sdk-v2";

const prepared = await moneyfi.transactions.prepareDeposit({
  user: walletAddress,
  chainId: 56,
  tokenAddress,
  vaultId,
  amount: parseUnits("100", tokenDecimals),
});

if (prepared.approval) {
  await walletClient.sendTransaction({
    account: walletAddress,
    to: prepared.approval.to,
    data: prepared.approval.data,
    value: BigInt(prepared.approval.value),
  });
}

await walletClient.sendTransaction({
  account: walletAddress,
  to: prepared.transaction.to,
  data: prepared.transaction.data,
  value: BigInt(prepared.transaction.value),
});
```

## Redeem

```ts
const prepared = await moneyfi.transactions.prepareRedeem({
  user: walletAddress,
  chainId: 56,
  tokenAddress,
  vaultId,
  shares: parseUnits("1", 18),
});

await walletClient.sendTransaction({
  account: walletAddress,
  to: prepared.transaction.to,
  data: prepared.transaction.data,
  value: BigInt(prepared.transaction.value),
});
```

MoneyFi validates the wallet's live share balance and returns the current asset estimate in
`prepared.decoded.quote`.

## Cancel a request

```ts
const prepared = await moneyfi.transactions.prepareCancel({
  user: walletAddress,
  chainId: 56,
  tokenAddress,
  vaultId,
  epochId: 7,
  side: "DEPOSIT", // or "REDEEM"
});

await walletClient.sendTransaction({
  account: walletAddress,
  to: prepared.transaction.to,
  data: prepared.transaction.data,
  value: BigInt(prepared.transaction.value),
});
```

A request can be cancelled only when it is still pending in the current open epoch.

## Error handling

```ts
import {
  MoneyFiNetworkError,
  MoneyFiSdkError,
  MoneyFiValidationError,
} from "@moneyfi/sdk-v2";

try {
  await moneyfi.users.positions(walletAddress);
} catch (error) {
  if (error instanceof MoneyFiValidationError) {
    // Invalid local input.
  } else if (error instanceof MoneyFiSdkError) {
    // A 401 on an Agency beneficiary call requires users.register() again.
    console.error(error.status, error.errorCode, error.message);
  } else if (error instanceof MoneyFiNetworkError) {
    // Retry according to the application's network policy.
  }
}
```
