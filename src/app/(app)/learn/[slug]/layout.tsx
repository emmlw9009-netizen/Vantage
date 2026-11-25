import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";
import { LESSON_MAP } from "@/lib/course";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const l = LESSON_MAP[slug];
  return { title: l ? `${l.title} | ${BRAND.name}` : `Lesson | ${BRAND.name}` };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
