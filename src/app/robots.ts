import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/app", "/lp", "/faucet"],
      disallow: ["/api/"],
    },
    sitemap: "https://www.iown.co/sitemap.xml",
  };
}
