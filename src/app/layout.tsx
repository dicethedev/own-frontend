import type { Metadata } from "next";
import "./globals.css";

import { Providers } from "@/components/providers";
import {
  SITE_DESCRIPTION,
  SITE_IMAGE_CLOUDINARY_URL,
  SITE_NAME,
  SITE_URL,
  SITE_NAME_URL,
} from "@/lib/site";

export const metadata: Metadata = {
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  icons: {
    icon: "/own_white_mini.svg", // default favicon
    shortcut: "/own_white_mini.svg", // for legacy support
    apple: "/own_white_mini.svg", // Apple devices
  },
  keywords: [
    "DeFi",
    "decentralized finance",
    "Synthetic Stocks on Blockchain",
    "synthetic assets",
    "synthetic stocks",
    "stocks",
    "real-world assets",
    "RWA",
    "tokenized stocks",
    "liquidity provider",
    "blockchain",
    "Own Protocol",
    "Own",
    "Web3",
    "onchain",
    "offchain",
    "mint synthetic stocks",
    "onchain liquidity",
    "tokenized stocks powered by blockchain",
    "decentralized protocol",
    "crypto assets",
    "permissionless trading",
    "onchain finance",
    "synthetic equity",
    "DeFi platform",
    "crypto trading",
    "tokenized equity",
    "Web3 finance",
    "financial inclusion",
    "non-custodial trading",
  ],

  applicationName: SITE_NAME,
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    type: "website",
    images: [
      {
        url: SITE_IMAGE_CLOUDINARY_URL,
        width: 1200,
        height: 630,
      },
    ],
    siteName: SITE_NAME_URL,
  },
  twitter: {
    card: "summary_large_image",
    site: SITE_URL,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: SITE_IMAGE_CLOUDINARY_URL,
        width: 1200,
        height: 630,
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <>{children}</>
        </Providers>
      </body>
    </html>
  );
}
