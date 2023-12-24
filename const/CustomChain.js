export const canto = {
  id: 7_700,
  name: "Canto",
  network: "canto",
  iconUrl:
    "https://raw.githubusercontent.com/cosmos/chain-registry/master/canto/images/canto.svg",
  iconBackground: "#fff",
  nativeCurrency: {
    decimals: 18,
    name: "Canto",
    symbol: "CANTO",
  },
  rpcUrls: {
    public: { http: ["https://jsonrpc.canto.nodestake.top"] },
    default: { http: ["https://canto.gravitychain.io"] },
  },
  blockExplorers: {
    default: { name: "Tuber", url: "https://tuber.build/" },
    etherscan: { name: "Tuber", url: "https://tuber.build/" },
  },
  contracts: {
    multicall3: {
      address: "0xcA11bde05977b3631167028862bE2a173976CA11",
      blockCreated: 2_905_789,
    },
  },
  testnet: false,
};
