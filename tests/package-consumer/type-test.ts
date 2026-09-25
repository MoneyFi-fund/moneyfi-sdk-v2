import { MoneyFiSdk, type PrepareCancelInput } from "@moneyfi/sdk-v2";

const sdk = new MoneyFiSdk({ apiKey: "mf_sdk_test_example" });
const cancel: PrepareCancelInput = {
  user: "0x1111111111111111111111111111111111111111",
  chainId: 56,
  tokenAddress: "0x2222222222222222222222222222222222222222",
  vaultId: "0x3333333333333333333333333333333333333333",
  epochId: "18446744073709551615",
  side: "DEPOSIT",
};

void sdk.transactions.prepareCancel(cancel);
