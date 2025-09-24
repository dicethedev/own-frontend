import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/trade", "/lp", "/faucet"],
      disallow: ["/api/"],
    },
    sitemap: "https://www.iown.co/sitemap.xml",
  };
}
