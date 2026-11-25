import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { LEGAL } from "@/lib/legal";
import { LegalDoc, S, Summary } from "@/components/legal-doc";

export const metadata: Metadata = { title: `Accessibility statement | ${BRAND.name}` };

export default function Accessibility() {
  return (
    <LegalDoc title="Accessibility statement">
      <Summary>
        <p>
          We want {BRAND.name} to work for as many people as possible. We aim to meet the Web Content Accessibility Guidelines (WCAG) 2.2, level AA. If something does not work for you, tell us and we will try to fix it.
        </p>
      </Summary>

      <S id="goal" title="Our goal">
        <p>
          Our target is conformance with WCAG 2.2 level AA. We have not had a third-party audit, and we do not claim full conformance yet.
        </p>
      </S>

      <S id="measures" title="What we do">
        <ul>
          <li>We design for color contrast of at least 4.5:1 for text, in both light and dark themes.</li>
          <li>A visible focus ring on interactive elements, and a target size of at least 40 pixels for touch controls, which we are still bringing to every control.</li>
          <li>Labels on icon-only buttons, and gains and losses shown with an arrow and sign as well as color.</li>
          <li>A layout that works from phone width up, and respect for your reduced-motion setting.</li>
          <li>Keyboard access to navigation and forms. Dialogs trap focus while open and return it when closed.</li>
        </ul>
      </S>

      <S id="limits" title="Known limitations">
        <ul>
          <li>Price charts are mainly visual. We are working on better text alternatives.</li>
          <li>Prices update every couple of seconds, which may be distracting with some assistive technology.</li>
          <li>Some content from third parties, or written by users, may not be fully accessible.</li>
        </ul>
      </S>

      <S id="feedback" title="Feedback and contact">
        <p>
          If you have trouble using any part of {BRAND.name}, or need information in another format, email {LEGAL.contactEmail}. Tell us the page, what you were trying to do, and the assistive technology you use if any. We aim to reply within 5 business days.
        </p>
        <p>
          See also our <Link href="/terms">Terms of service</Link> and <Link href="/privacy">Privacy policy</Link>.
        </p>
      </S>
    </LegalDoc>
  );
}
