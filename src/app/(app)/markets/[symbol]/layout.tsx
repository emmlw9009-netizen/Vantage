import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";
import { TICKER_MAP } from "@/lib/market-data";

export async function generateMetadata({ params }: { params: Promise<{ symbol: string }> }): Promise<Metadata> {
  const { symbol } = await params;
  const t = TICKER_MAP[symbol.toUpperCase()];
  return { title: t ? `${t.symbol}, ${t.name} | ${BRAND.name}` : `Stock | ${BRAND.name}` };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
