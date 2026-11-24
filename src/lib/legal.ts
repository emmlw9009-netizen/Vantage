/**
 * Single source of truth for legal identity and versioning.
 * Values in [square brackets] are deliberate placeholders: the owner fills
 * them in before public launch. Nothing else in the codebase hard-codes them.
 * Not legal advice; have a lawyer review the legal pages before launch.
 */
export const LEGAL = {
  entityName: "[Company legal name]",
  entityAddress: "[Postal address]",
  contactEmail: "[legal@yourdomain.com]",
  dmcaAgent: "[Designated agent name and address]",
  governingLaw: "[State], United States",
  hostingProvider: "[hosting provider]",
  refundPolicy: "[refund policy]",
  arbitrationProvider: "[arbitration provider, for example AAA or JAMS]",
  logRetention: "[log retention period]",
  /** Date the current legal texts take effect. */
  effectiveDate: "November 24, 2026",
  /** Bump when Terms or Privacy change materially: every user is asked to agree again. */
  termsVersion: "2026-11-24",
  minimumAge: 18,
} as const;

export const LEGAL_PAGES = [
  { href: "/terms", label: "Terms of service" },
  { href: "/privacy", label: "Privacy policy" },
  { href: "/disclaimer", label: "Investment and simulation disclaimer" },
  { href: "/community-guidelines", label: "Community guidelines" },
  { href: "/copyright", label: "Copyright and DMCA policy" },
  { href: "/accessibility", label: "Accessibility statement" },
] as const;

export const FOOTER_DISCLAIMER = "Simulated prices and news. Educational only, not investment advice.";
