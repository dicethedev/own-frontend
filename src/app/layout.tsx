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
      <head>
        <title>Own Protocol</title>
        <meta
          name="description"
          content="First fully decentralized protocol for synthetic stocks. Users can mint synthetic stocks and LPs earn yield for backing these assets."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#1F2937" />

        {/* Favicon */}
        <link rel="icon" type="image/svg+xml" href="/own_white_mini.svg" />
        <link rel="shortcut icon" href="/own_white_mini.svg" />
        <link rel="apple-touch-icon" href="/own_white_mini.svg" />

        {/* Open Graph */}
        <meta property="og:title" content="Own Protocol" />
        <meta
          property="og:description"
          content="First fully decentralized protocol for synthetic stocks. Trade synthetic stocks with full decentralization."
        />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/own_white.svg" />
        <meta property="og:site_name" content="Own Protocol" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Own Protocol" />
        <meta
          name="twitter:description"
          content="First fully decentralized protocol for synthetic stocks."
        />
        <meta name="twitter:image" content="/own_white.svg" />
        <meta name="twitter:creator" content="@iownco" />

        {/* Additional Meta Tags */}
        <meta
          name="keywords"
          content="DeFi, decentralized finance, synthetic assets, synthetic stocks, real-world assets, RWA, tokenized stocks, liquidity provider, blockchain, Own Protocol"
        />
        <meta name="author" content="Own Protocol" />
        <meta name="robots" content="index, follow" />

        {/* Manifest */}
        <link rel="manifest" href="/site.webmanifest" />
      </head>
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
