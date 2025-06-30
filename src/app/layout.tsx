import type { Metadata } from "next";
import "./globals.css";

import { Providers } from "@/components/providers";
import StructuredData from "@/components/StructuredData";
import {
  SITE_DESCRIPTION,
  SITE_IMAGE_CLOUDINARY_URL,
  SITE_NAME,
  SITE_URL,
  SITE_NAME_URL,
  SITE_ICON_URL,
} from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
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
    "Own Real Assets On-Chain",
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
    creator: "@iownco",
    images: [
      {
        url: SITE_IMAGE_CLOUDINARY_URL,
        width: 1200,
        height: 630,
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: SITE_ICON_URL,
    description: SITE_DESCRIPTION,
  };

  return (
    <html lang="en">
      <head>
        <StructuredData data={organizationSchema} />
      </head>
      <body>
        <Providers>
          <>{children}</>
        </Providers>
      </body>
    </html>
  );
}
