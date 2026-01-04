import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";
import { RootProviders } from "@/provider";
import {
  SITE_DESCRIPTION,
  SITE_IMAGE_CLOUDINARY_URL,
  SITE_NAME,
  SITE_URL,
  SITE_NAME_URL,
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
        alt: `${SITE_NAME} - Invest in tokenized US ETFs`,
      },
    ],
    siteName: SITE_NAME_URL,
  },

  twitter: {
    card: "summary_large_image",
    site: "@ownfinance",
    creator: "@ownfinance",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: SITE_IMAGE_CLOUDINARY_URL,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} - Invest in tokenized US ETFs`,
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

  alternates: {
    canonical: SITE_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <meta name="robots" content="index, follow" />

        <title>Own Finance</title>
        <meta name="description" content="Invest in tokenized US ETFs" />

        <meta
          name="keywords"
          content="Own, tokenized stocks, tokenized ETFs, RWA, onchain assets, Web3, Own Protocol, DeFi, tokenized stocks powered by blockchain, real-world assets, synthetic equity, mint synthetic stocks, onchain, decentralized protocol, stocks, Own Real Assets Onchain"
        />

        <meta name="application-name" content="Own Finance" />
        <meta name="author" content="Own Finance" />
        <meta name="publisher" content="Own Finance" />

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
      <body suppressHydrationWarning={true}>
        <RootProviders>
          <main>{children}</main>
        </RootProviders>
      </body>
    </html>
  );
}
