import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = { title: `Learn | ${BRAND.name}` };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
