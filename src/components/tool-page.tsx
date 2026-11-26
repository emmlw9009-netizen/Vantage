import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { abs } from "@/lib/site";
import { PublicFooter, PublicHeader } from "@/components/public-chrome";

/** Shared frame for the free public calculators: the tool first, then the explanation, formula and a way into the app. */
export function ToolPage({
  path,
  name,
  title,
  lead,
  tool,
  formula,
  formulaNote,
  example,
  steps,
  lesson,
  cta,
}: {
  path: string;
  name: string;
  title: string;
  lead: string;
  tool: React.ReactNode;
  formula: string;
  formulaNote: string;
  example: { heading: string; lines: string[] };
  steps: { heading: string; body: string }[];
  lesson: { slug: string; title: string };
  cta: { title: string; body: string };
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name,
    url: abs(path),
    applicationCategory: "EducationalApplication",
    operatingSystem: "Any",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    publisher: { "@type": "Organization", name: BRAND.name, url: abs("/") },
  };
  return (
    <div className="min-h-dvh">
      <PublicHeader />
      <main id="main" className="mx-auto max-w-[1264px] px-4 pb-20 pt-10 lg:px-8 lg:pt-16">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
        <div className="grid grid-cols-1 gap-x-16 gap-y-12 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0">
            <h1 className="t-title max-w-[20ch]">{title}</h1>
            <p className="mt-4 max-w-[58ch] t-lead">{lead}</p>
            <div className="max-w-[760px] [&>section]:mt-8">{tool}</div>
          </div>
          <aside aria-label="Formula and worked example" className="min-w-0 lg:pt-3">
            <div className="border-t border-ink pt-4">
              <h2 className="t-h3">The formula</h2>
              <p className="tnum well mt-3 px-4 py-3 t-wide text-[17px] leading-7">{formula}</p>
              <p className="mt-2 t-small text-ink-2">{formulaNote}</p>
            </div>
            <div className="mt-8 border-t border-rule-strong pt-4">
              <h2 className="t-h3">{example.heading}</h2>
              <ol className="tnum mt-3 border-t border-rule">
                {example.lines.map((l) => (
                  <li key={l} className="border-b border-rule py-2 t-small">
                    {l}
                  </li>
                ))}
              </ol>
            </div>
          </aside>
        </div>

        <section className="mt-16 border-t border-rule-strong pt-8" aria-labelledby="how-h">
          <h2 id="how-h" className="t-h2">
            How to use it
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-x-12 gap-y-6 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.heading} className="min-w-0">
                <h3 className="t-h3">{s.heading}</h3>
                <p className="mt-1 max-w-[46ch] t-small text-ink-2">{s.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 t-small">
            <Link href={`/lessons/${lesson.slug}`} className="link">
              Read the lesson: {lesson.title}
            </Link>
          </p>
        </section>

        <section className="mt-16 flex flex-wrap items-center justify-between gap-6 border-t border-rule-strong pt-8" aria-labelledby="cta-h">
          <div className="max-w-[52ch]">
            <h2 id="cta-h" className="t-h2">
              {cta.title}
            </h2>
            <p className="mt-2 t-small text-ink-2">{cta.body}</p>
          </div>
          <Link href="/dashboard" className="btn btn-primary btn-lg">
            Start with $100,000 in practice money
          </Link>
        </section>
        <p className="mt-8 max-w-[66ch] t-small text-ink-2">Results are illustrations from the numbers you enter. {BRAND.name} is an educational simulator. Not investment advice.</p>
      </main>
      <PublicFooter />
    </div>
  );
}
