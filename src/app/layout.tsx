import type { Metadata, Viewport } from "next";
import "@fontsource-variable/archivo/wdth.css";
import "@fontsource-variable/literata/opsz.css";
import "@fontsource-variable/literata/opsz-italic.css";
import { BRAND } from "@/lib/brand";
import { CookieConsent } from "@/components/cookie-consent";
import "./globals.css";

const DESCRIPTION = "Practice investing in a simulated market with $100,000 in practice money. Nova, an AI coach, checks every trade. Educational only, not investment advice.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: `${BRAND.name}: ${BRAND.tagline}`,
  description: DESCRIPTION,
  applicationName: BRAND.name,
  icons: {
    icon: [
      { url: "/brand/favicon.svg", type: "image/svg+xml" },
      { url: "/brand/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/brand/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    siteName: BRAND.name,
    title: `${BRAND.name}: ${BRAND.tagline}`,
    description: DESCRIPTION,
    images: [{ url: "/brand/og.png", width: 1200, height: 630, alt: `${BRAND.name}: ${BRAND.tagline} An educational trading simulator.` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND.name}: ${BRAND.tagline}`,
    description: DESCRIPTION,
    images: ["/brand/og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#131c17" },
    { media: "(prefers-color-scheme: light)", color: "#edf1ea" },
  ],
};

const themeScript = `try{var t=localStorage.getItem("sp-theme");if(t)document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh antialiased">
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
