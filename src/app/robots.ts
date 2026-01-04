import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/protocol/lp"],
      disallow: ["/api/"],
    },
    sitemap: "https://wwww.ownfinance.org/sitemap.xml",
  };
}
