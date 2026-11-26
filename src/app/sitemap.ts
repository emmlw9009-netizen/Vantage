import type { MetadataRoute } from "next";
import { ALL_LESSONS } from "@/lib/course";
import { LEGAL_PAGES } from "@/lib/legal";
import { abs } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["/", "/lessons", ...ALL_LESSONS.map((l) => `/lessons/${l.slug}`), "/tools/position-size-calculator", "/tools/reward-risk-calculator", ...LEGAL_PAGES.map((l) => l.href)];
  return paths.map((p) => ({ url: abs(p) }));
}
