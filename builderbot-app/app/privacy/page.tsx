import Link from "next/link";
import { ShieldCheck, ArrowLeft, Lock, Trash2, Mail, FileText } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to BuilderBot</span>
        </Link>
      </div>

      <div className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-sm space-y-8">
        <div className="border-b border-slate-200 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200 mb-3">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>UK GDPR & Data Protection Compliance</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Privacy Policy & Customer Data Rights
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Last updated: October 2026 • Compliant with UK Data Protection Act 2018 & UK GDPR
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Lock className="w-5 h-5 text-blue-600" />
            1. Overview & Data Controller
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            BuilderBot provides quoting and customer management tools for trade professionals. Under UK GDPR, the individual contractor or trade business creating the quotation acts as the <strong>Data Controller</strong> for customer information entered into the system. BuilderBot acts as the secure <strong>Data Processor</strong>.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            2. What Data We Process
          </h2>
          <ul className="text-slate-600 text-sm space-y-2 list-disc list-inside">
            <li><strong>Customer Contact Records:</strong> Full name, company name, phone number, email address, and job site address.</li>
            <li><strong>Quotation Records:</strong> Scope of work, trade materials, labor day rates, subtotal, and deposit amounts.</li>
            <li><strong>Digital Acceptance Audit Data:</strong> Typed legal signature name, ISO timestamp, and client IP address captured exclusively for electronic agreement verification.</li>
            <li><strong>Contractor Business Profile:</strong> Company name, registered address, verified trade licenses, and optional bank transfer details for accepted deposits.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            3. Lawful Basis for Processing
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            We process customer data under <strong>Article 6(1)(b) UK GDPR (Performance of a Contract)</strong> — to prepare itemized job quotations, transmit customer acceptance links, and finalize trade contracts upon digital signature.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-rose-600" />
            4. Right to Erasure & Deletion (&ldquo;Right to be Forgotten&rdquo;)
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Customers have the legal right under UK GDPR Article 17 to request the deletion of their personal records:
          </p>
          <ul className="text-slate-600 text-sm space-y-1.5 list-disc list-inside">
            <li><strong>In-App Deletion:</strong> Contractors can instantly delete any customer record and associated draft quotes directly from the Customers dashboard.</li>
            <li><strong>Subject Access Requests:</strong> Customers can request immediate data purging by emailing the contractor directly or contacting support.</li>
          </ul>
        </section>

        <section className="space-y-3 border-t border-slate-100 pt-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />
            5. Contact & Privacy Inquiries
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            If you have questions regarding data retention, security encryption, or would like to submit a GDPR Data Subject Access Request, contact your quoting contractor or email privacy inquiries to your administrator.
          </p>
        </section>
      </div>
    </div>
  );
}
