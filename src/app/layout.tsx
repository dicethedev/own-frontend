"use client";

import "./globals.css";
import { WalletProvider } from "@/components/providers/WalletProvider";
import { RefreshProvider } from "@/context/RefreshContext";
import { Toaster } from "react-hot-toast";
import { darkTheme, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
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
              {children}
              <Toaster position="top-right" />
            </RefreshProvider>
          </RainbowKitProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
