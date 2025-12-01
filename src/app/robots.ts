import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/protocol/trade", "/protocol/lp", "/protocol/faucet"],
      disallow: ["/api/"],
    },
    sitemap: "https://wwww.ownfinance.org/sitemap.xml",
  };
}
