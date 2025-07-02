import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";
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
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
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
    "Own Real Assets onchain",
  ],
  applicationName: SITE_NAME,
  authors: [{ name: "Own Protocol Team" }],
  creator: "Own Protocol",
  publisher: "Own Protocol",
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    type: "website",
    locale: "en_US",
    images: [
      {
        url: SITE_IMAGE_CLOUDINARY_URL,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} - Own Real Assets onchain`,
      },
    ],
    siteName: SITE_NAME_URL,
  },
  twitter: {
    card: "summary_large_image",
    site: "@iownco",
    creator: "@iownco",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: SITE_IMAGE_CLOUDINARY_URL,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} - Own Real Assets onchain`,
      },
    ],
  },
  category: "technology",
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
    logo: {
      "@type": "ImageObject",
      url: SITE_ICON_URL,
    },
    description: SITE_DESCRIPTION,
    sameAs: ["https://twitter.com/iownco", "https://github.com/own-protocol"],
    foundingDate: "2024",
  };

  return (
    <html lang="en">
      <head>
        <StructuredData data={organizationSchema} />
        {/* Google Search Console Verification */}
        <meta
          name="google-site-verification"
          content="c3_2vbTjsFCOnjvCgbLa8M0Ts-KJzzomAJ4OeDbbON0"
        />

        {/** Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-4M5WGZT39P"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
           window.dataLayer = window.dataLayer || [];
           function gtag(){dataLayer.push(arguments);}
           gtag('js', new Date());

           gtag('config', 'G-4M5WGZT39P');
        `}
        </Script>
      </head>
      <body>
        <Providers>
          <>{children}</>
        </Providers>
      </body>
    </html>
  );
}
