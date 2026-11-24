import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { LEGAL } from "@/lib/legal";
import { LegalDoc, S, Summary } from "@/components/legal-doc";

export const metadata: Metadata = { title: `Copyright and DMCA policy | ${BRAND.name}` };

export default function Copyright() {
  return (
    <LegalDoc title="Copyright and DMCA policy">
      <Summary>
        <p>
          We respect copyright. If you believe something on {BRAND.name} infringes your copyright, send a notice to our designated agent below. We remove infringing content, tell the person who posted it, and close the accounts of repeat infringers.
        </p>
      </Summary>

      <S id="agent" title="Designated agent">
        <p>
          Send copyright notices and counter-notices to:
        </p>
        <p>
          {LEGAL.dmcaAgent}<br />
          {LEGAL.entityName}<br />
          {LEGAL.entityAddress}<br />
          Email: {LEGAL.contactEmail}
        </p>
      </S>

      <S id="notice" title="How to file a notice of infringement">
        <p>Your written notice must include:</p>
        <ol>
          <li>your physical or electronic signature (or that of a person authorized to act for the copyright owner);</li>
          <li>identification of the copyrighted work you claim has been infringed;</li>
          <li>identification of the material you claim is infringing, with enough detail (such as a link) for us to find it;</li>
          <li>your name, address, telephone number and email address;</li>
          <li>a statement that you have a good-faith belief that the use is not authorized by the copyright owner, its agent or the law; and</li>
          <li>a statement, under penalty of perjury, that the information in the notice is accurate and that you are the owner or authorized to act for the owner.</li>
        </ol>
        <p>
          Knowingly sending a false notice can make you liable for damages. If you are unsure whether something infringes, consider talking to a lawyer first.
        </p>
      </S>

      <S id="takedown" title="What we do">
        <p>
          When we receive a valid notice, we will promptly remove or disable access to the material and tell the person who posted it that we have done so.
        </p>
      </S>

      <S id="counter-notice" title="Counter-notice">
        <p>If you posted material that was removed and you believe it was removed by mistake or misidentification, you may send our agent a counter-notice that includes:</p>
        <ol>
          <li>your physical or electronic signature;</li>
          <li>identification of the removed material and where it appeared before removal;</li>
          <li>a statement, under penalty of perjury, that you have a good-faith belief that the material was removed by mistake or misidentification;</li>
          <li>your name, address and telephone number, and a statement that you consent to the jurisdiction of the federal court for your address (or, outside the United States, any district where we may be found), and that you will accept service of process from the person who filed the notice.</li>
        </ol>
        <p>
          We will send a copy to the person who filed the original notice. Unless they tell us within 10 business days that they have filed a court action, we may restore the material in not less than 10 and not more than 14 business days.
        </p>
      </S>

      <S id="repeat" title="Repeat infringers">
        <p>
          In appropriate circumstances, we will end the accounts and access of users who are repeat infringers.
        </p>
      </S>

      <S id="other" title="Other claims">
        <p>
          This process is for copyright. For other concerns, such as trademark, privacy or content that breaks the <Link href="/community-guidelines">Community guidelines</Link>, email {LEGAL.contactEmail}. Names and marks of other companies appear only to identify them and do not mean any affiliation (see the <Link href="/terms#no-affiliation">Terms</Link>).
        </p>
      </S>
    </LegalDoc>
  );
}
