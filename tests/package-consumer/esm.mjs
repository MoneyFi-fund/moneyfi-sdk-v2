import assert from "node:assert/strict";
import { MoneyFiSdk } from "@moneyfi/sdk-v2";

const sdk = new MoneyFiSdk({ apiKey: `mf_sdk_test_${"A".repeat(48)}` });
assert.equal(typeof sdk.users.isRegistered, "function");
assert.equal(typeof sdk.transactions.prepareCancel, "function");
