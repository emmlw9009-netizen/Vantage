/** Absolute site URL for sitemap, canonical links and JSON-LD. Set NEXT_PUBLIC_SITE_URL in production. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
export const abs = (path: string) => `${SITE_URL}${path}`;
