import type { MetadataRoute } from "next";
import { abs } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/dashboard", "/markets", "/coach", "/community", "/journal", "/settings", "/learn", "/upgrade", "/debrief", "/api/"] }],
    sitemap: abs("/sitemap.xml"),
  };
}
