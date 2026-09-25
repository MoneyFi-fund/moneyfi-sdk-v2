const assert = require("node:assert/strict");
const { MoneyFiSdk } = require("@moneyfi/sdk-v2");

const sdk = new MoneyFiSdk({ apiKey: `mf_sdk_test_${"A".repeat(48)}` });
assert.equal(typeof sdk.vaults.list, "function");
assert.equal(typeof sdk.transactions.prepareCancel, "function");
