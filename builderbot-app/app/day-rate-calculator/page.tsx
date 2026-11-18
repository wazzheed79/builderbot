import type { Metadata } from "next";
import Link from "next/link";
import { brand } from "@/lib/brand.mjs";
import { absoluteCanonicalUrl } from "@/lib/site-urls.mjs";
import { TAX_YEAR_LABEL } from "@/lib/day-rate.mjs";
import DayRateClient from "./DayRateClient";
import { DAY_RATE_FAQ } from "./faq";

const pageUrl = absoluteCanonicalUrl("/day-rate-calculator");
const title = `Day Rate Calculator for UK Trades – ${TAX_YEAR_LABEL}, After Tax`;
const description =
  "Work out the day rate you need to take home what you want, after Income Tax, National Insurance, van and tools. Then quote with it in one tap. Free, no sign-up.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: pageUrl },
  openGraph: {
    title: `${title} · ${brand.name}`,
    description,
    url: pageUrl,
    type: "website",
    locale: "en_GB",
  },
  twitter: { card: "summary_large_image", title, description },
};

export default function DayRateCalculatorPage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: `${brand.name} day rate calculator`,
      url: pageUrl,
      description,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Any",
      browserRequirements: "Requires JavaScript",
      inLanguage: "en-GB",
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: DAY_RATE_FAQ.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ];

  return (
    <div className="mx-auto w-full min-w-0 max-w-5xl px-4 pb-32 pt-4 sm:px-6 sm:pt-10 lg:pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <p className="text-xs font-bold uppercase tracking-widest text-clay-700">
        Free tool · {TAX_YEAR_LABEL} tax year
      </p>
      <h1 className="mt-1 text-2xl font-black leading-tight tracking-tight text-ink sm:text-4xl">
        Day rate calculator for UK trades
      </h1>
      <p className="mt-2 max-w-2xl text-base leading-relaxed text-stone-700">
        Start with what you want in your pocket. It adds the tax, National Insurance and the cost
        of the van and tools, then shares it across the days you can really charge for. Then put the
        rate straight into a quote.
      </p>

      <DayRateClient />

      <section className="mt-12 max-w-3xl" aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="text-xl font-black text-ink sm:text-2xl">
          Questions
        </h2>
        <div className="mt-4 divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-white">
          {DAY_RATE_FAQ.map((item) => (
            <details key={item.q} className="group px-4 py-3 sm:px-5">
              <summary className="cursor-pointer list-none py-1 font-bold text-ink marker:hidden">
                <span className="mr-2 inline-block text-clay-700 transition group-open:rotate-90">›</span>
                {item.q}
              </summary>
              <p className="mt-2 pb-1 text-sm leading-relaxed text-stone-700">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-8 max-w-3xl text-sm leading-relaxed text-stone-600">
        <h2 className="text-base font-bold text-ink">Where the figures come from</h2>
        <p className="mt-2">
          Tax and National Insurance use the published {TAX_YEAR_LABEL} rates from{" "}
          <a className="underline" href="https://www.gov.uk/income-tax-rates" rel="noopener">
            GOV.UK Income Tax rates
          </a>
          ,{" "}
          <a className="underline" href="https://www.gov.uk/scottish-income-tax" rel="noopener">
            Scottish Income Tax
          </a>
          ,{" "}
          <a className="underline" href="https://www.gov.uk/self-employed-national-insurance-rates" rel="noopener">
            self-employed National Insurance
          </a>
          ,{" "}
          <a className="underline" href="https://www.gov.uk/repaying-your-student-loan/what-you-pay" rel="noopener">
            student loan repayments
          </a>{" "}
          and the{" "}
          <a className="underline" href="https://www.gov.uk/register-for-vat" rel="noopener">
            VAT threshold
          </a>
          . Everything else is your own figures. The starting numbers are examples to change, not
          averages.
        </p>
        <p className="mt-2">
          This is guidance, not tax advice. It treats your trade as your only income and does not
          cover limited companies, CIS refunds or IR35.
        </p>
        <p className="mt-4">
          <Link href="/try" className="font-bold text-clay-700 underline">
            Try a quote free
          </Link>{" "}
          · no sign-up, nothing sent.
        </p>
      </section>
    </div>
  );
}
