import "@rainbow-me/rainbowkit/styles.css";
import {
  getDefaultWallets,
  RainbowKitProvider,
  darkTheme,
} from "@rainbow-me/rainbowkit";
import { configureChains, createConfig, WagmiConfig } from "wagmi";
import { mainnet, polygon, optimism, arbitrum, base, bsc } from "wagmi/chains";
import { canto } from "@/const/CustomChain";
import { publicProvider } from "wagmi/providers/public";
const { chains, publicClient } = configureChains(
  [mainnet, polygon, optimism, arbitrum, base, bsc, canto],
  [publicProvider()]
);

const { connectors } = getDefaultWallets({
  appName: "Kontolzero",
  projectId: "6cb49f1f899718098078493f866b05e6",
  chains,
});

import { ConnectButton } from "@rainbow-me/rainbowkit";

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
});

import CardSwap from "./CardSwap";

export default function RainbowConnect() {
  return (
    <>
      <section className="relative bg-black flex h-screen w-screen">
        <div className="relative z-10 max-w-screen-xl mx-auto px-4 py-28 md:px-8">
          <div className="space-y-5 max-w-4xl mx-auto text-center">
            <h3 className="text-3xl text-white font-extrabold mx-auto md:text-3xl">
              Bridge OFT | OnaniChain
            </h3>

            <WagmiConfig config={wagmiConfig}>
              <RainbowKitProvider
                chains={chains}
                theme={darkTheme()}
                showRecentTransactions={true}
              >
                <div className="mb-3">
                  <ConnectButton />
                </div>
                <CardSwap />
              </RainbowKitProvider>
            </WagmiConfig>
          </div>
        </div>
        <div
          className="absolute inset-0 m-auto max-w-xs h-[357px] blur-[118px] sm:max-w-md md:max-w-lg"
          style={{
            background:
              "linear-gradient(106.89deg, rgba(192, 132, 252, 0.11) 15.73%, rgba(14, 165, 233, 0.41) 15.74%, rgba(232, 121, 249, 0.26) 56.49%, rgba(79, 70, 229, 0.4) 115.91%)",
          }}
        ></div>
      </section>
    </>
  );
}
