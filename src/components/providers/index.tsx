"use client";

import { Toaster } from "react-hot-toast";
import { WalletProvider } from "./WalletProvider";
import { darkTheme, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { RefreshProvider } from "@/context/RefreshContext";
import "@rainbow-me/rainbowkit/styles.css";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WalletProvider>
      <RainbowKitProvider
        theme={darkTheme({
          accentColor: "#3B82F6", // Blue-500 to match your theme
          accentColorForeground: "white",
          borderRadius: "medium",
          fontStack: "system",
          overlayBlur: "small",
        })}
        showRecentTransactions={true}
        appInfo={{
          appName: "Own Protocol",
          learnMoreUrl: "https://own-protocol.gitbook.io/docs",
        }}
      >
        <RefreshProvider>
          <>{children}</>
          <Toaster position="top-right" />
        </RefreshProvider>
      </RainbowKitProvider>
    </WalletProvider>
  );
}
