import { LEGAL } from "@/lib/legal";

export function LegalDoc({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="prose-legal">
      <h1>{title}</h1>
      <p className="updated">
        Last updated {LEGAL.effectiveDate}. Version {LEGAL.termsVersion}.
      </p>
      {children}
    </article>
  );
}

export function S({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id}>
      <h2 id={id}>
        <a href={`#${id}`}>{title}</a>
      </h2>
      {children}
    </section>
  );
}

export function Summary({ title = "In plain language", children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="summary" role="note" aria-label={title}>
      <p>
        <strong>{title}</strong>
      </p>
      {children}
    </div>
  );
}
