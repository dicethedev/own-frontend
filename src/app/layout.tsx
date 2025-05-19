import "./globals.css";
import type { Metadata } from "next";
import { WalletProvider } from "@/components/providers/WalletProvider";
import { RefreshProvider } from "@/context/RefreshContext";

export const metadata: Metadata = {
  title: "Own",
  description:
    "First fully decentralized protocol for tokenized real-world assets.",
  icons: {
    icon: [
      {
        url: "./own_white_mini.svg",
        type: "image/svg+xml",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <WalletProvider>
          <RefreshProvider>{children}</RefreshProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
