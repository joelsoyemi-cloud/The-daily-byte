import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/editor", "/dashboard", "/login", "/signup", "/forgot-password", "/reset-password", "/unauthorized", "/feedback", "/auth", "/api"] }],
    sitemap: siteUrl("/sitemap.xml"),
  };
}
