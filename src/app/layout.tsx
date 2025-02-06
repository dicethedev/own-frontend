import "./globals.css";
import type { Metadata } from "next";
import { WalletProvider } from "@/components/providers/WalletProvider";

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
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  );
}
