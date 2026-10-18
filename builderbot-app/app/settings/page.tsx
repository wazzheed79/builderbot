"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  Phone,
  Mail,
  Globe,
  CreditCard,
  ShieldCheck,
  FileText,
  Save,
  CheckCircle2,
  Plus,
  Trash2,
  AlertTriangle,
  RotateCcw,
  Upload,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import {
  BusinessProfile,
  DEFAULT_BUSINESS_PROFILE,
  getBusinessProfile,
  saveBusinessProfile,
} from "@/lib/storage";

export default function SettingsPage() {
  const [profile, setProfile] = useState<BusinessProfile>(() => getBusinessProfile());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [newAccreditation, setNewAccreditation] = useState("");

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleChange = <K extends keyof BusinessProfile>(
    field: K,
    value: BusinessProfile[K]
  ) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveBusinessProfile(profile);
    triggerToast("Business profile & branding saved successfully!");
  };

  const handleReset = () => {
    if (confirm("Reset profile details back to default template?")) {
      setProfile(DEFAULT_BUSINESS_PROFILE);
      saveBusinessProfile(DEFAULT_BUSINESS_PROFILE);
      triggerToast("Reset to default profile.");
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      triggerToast("Logo image size should be under 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64 = uploadEvent.target?.result as string;
      if (base64) {
        handleChange("logoUrl", base64);
        triggerToast("Logo uploaded. Click 'Save Changes' to apply.");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    handleChange("logoUrl", "");
    triggerToast("Logo removed.");
  };

  const handleAddAccreditation = () => {
    const val = newAccreditation.trim();
    if (!val) return;
    if (profile.accreditations.includes(val)) {
      triggerToast("This accreditation is already added.");
      return;
    }
    handleChange("accreditations", [...profile.accreditations, val]);
    setNewAccreditation("");
  };

  const handleRemoveAccreditation = (index: number) => {
    handleChange(
      "accreditations",
      profile.accreditations.filter((_, i) => i !== index)
    );
  };

  const trades = [
    "General Building & Renovation",
    "Plumbing & Heating",
    "Electrical Contractor",
    "Carpentry & Joinery",
    "Roofing & Cladding",
    "Painting & Decorating",
    "Landscaping & Groundworks",
    "Plastering & Rendering",
    "Bricklaying & Masonry",
    "HVAC & Air Conditioning",
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-sm font-semibold border border-slate-700 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Building2 className="w-8 h-8 text-blue-600" />
            Business Profile & Branding
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Configure your trade business details, bank details for deposits, and real accreditations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="mt-8 space-y-8">
        {/* Section 1: Business Identity */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-lg text-slate-900">Business Identity</h2>
          </div>

          {/* Logo Upload Card */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="w-20 h-20 rounded-2xl bg-white border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shrink-0 shadow-xs relative">
              {profile.logoUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={profile.logoUrl}
                  alt={profile.companyName}
                  className="w-full h-full object-contain p-1"
                />
              ) : (
                <div className="text-center p-2">
                  <Building2 className="w-6 h-6 text-slate-300 mx-auto" />
                  <span className="text-[9px] text-slate-400 font-bold block mt-1">NO LOGO</span>
                </div>
              )}
            </div>

            <div className="space-y-1 text-center sm:text-left flex-1">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Trade Company Logo
              </span>
              <p className="text-xs text-slate-500">
                Upload your company branding (PNG, JPG, SVG). This logo will appear at the top of all PDF quotes and invoices.
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{profile.logoUrl ? "Change Logo" : "Upload Logo"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
                {profile.logoUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Remove</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Company / Trading Name *
              </label>
              <input
                type="text"
                required
                value={profile.companyName}
                onChange={(e) => handleChange("companyName", e.target.value)}
                placeholder="e.g. Apex Building Solutions Ltd"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Owner / Contractor Name *
              </label>
              <input
                type="text"
                required
                value={profile.ownerName}
                onChange={(e) => handleChange("ownerName", e.target.value)}
                placeholder="e.g. Mark Robinson"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Primary Trade Specialty
              </label>
              <select
                value={profile.trade}
                onChange={(e) => handleChange("trade", e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium bg-white"
              >
                {trades.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Trading As / Subtitle (Optional)
              </label>
              <input
                type="text"
                value={profile.tradingName || ""}
                onChange={(e) => handleChange("tradingName", e.target.value)}
                placeholder="e.g. Residential & Commercial Contractors"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Business / Workshop Address *
              </label>
              <input
                type="text"
                required
                value={profile.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="e.g. Unit 3, Oakwood Trade Centre, Bristol, BS8 1AB"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Contact Information */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <Phone className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-lg text-slate-900">Contact Details</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Phone Number *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={profile.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="+44 7700 900000"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={profile.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="quotes@company.co.uk"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Website (Optional)
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={profile.website || ""}
                  onChange={(e) => handleChange("website", e.target.value)}
                  placeholder="www.company.co.uk"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Bank Details & Invoicing */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <CreditCard className="w-5 h-5 text-emerald-600" />
            <div>
              <h2 className="font-bold text-lg text-slate-900">Bank Details for Deposits & Payments</h2>
              <p className="text-xs text-slate-500">
                Shown to clients upon digital quote acceptance for wire transfers & deposits.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Bank Name
              </label>
              <input
                type="text"
                value={profile.bankName || ""}
                onChange={(e) => handleChange("bankName", e.target.value)}
                placeholder="e.g. Barclays Bank"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Sort Code
              </label>
              <input
                type="text"
                value={profile.bankSortCode || ""}
                onChange={(e) => handleChange("bankSortCode", e.target.value)}
                placeholder="20-00-00"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Account Number
              </label>
              <input
                type="text"
                value={profile.bankAccountNumber || ""}
                onChange={(e) => handleChange("bankAccountNumber", e.target.value)}
                placeholder="12345678"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono font-medium"
              />
            </div>
          </div>

          {/* VAT Configuration */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="vatRegistered"
                checked={profile.vatRegistered}
                onChange={(e) => handleChange("vatRegistered", e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="vatRegistered" className="text-sm font-bold text-slate-900 cursor-pointer">
                Business is VAT Registered (20% UK standard)
              </label>
            </div>

            {profile.vatRegistered && (
              <div className="w-full sm:w-64">
                <input
                  type="text"
                  value={profile.vatNumber || ""}
                  onChange={(e) => handleChange("vatNumber", e.target.value)}
                  placeholder="VAT No: GB 123 4567 89"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono font-medium focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Section 4: Verified Accreditations */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="font-bold text-lg text-slate-900">Trade Accreditations & Licenses</h2>
              <p className="text-xs text-slate-500">
                Only list registrations your business legitimately holds. These display on customer quotes.
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-xs text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Legal Notice:</strong> Under UK consumer protection regulations, displaying unverified regulatory marks (such as Gas Safe or NICEIC without active registration) is strictly prohibited. TradeMate does not pre-fill false certifications.
            </span>
          </div>

          {/* Current Accreditations */}
          <div className="space-y-2">
            {profile.accreditations.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">
                No accreditations registered. Add your active trade memberships below.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {profile.accreditations.map((acc, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{acc}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAccreditation(idx)}
                      className="text-indigo-500 hover:text-rose-600 ml-1 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Quick-Add Popular UK Trade Certifications */}
          <div className="pt-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
              1-Tap Quick Add Badges:
            </span>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "🔥 Gas Safe Register", defaultText: "Gas Safe Registered (#123456)" },
                { label: "⚡ NICEIC Approved", defaultText: "NICEIC Approved Contractor" },
                { label: "🔌 Part P Domestic Installer", defaultText: "Part P Registered Installer" },
                { label: "♻️ EA Licensed Waste Carrier", defaultText: "Environment Agency Registered Waste Carrier" },
                { label: "🏗️ FMB Member", defaultText: "Federation of Master Builders (FMB)" },
                { label: "⭐ Checkatrade Verified", defaultText: "Checkatrade Verified Member" },
                { label: "🛡️ CHAS Health & Safety", defaultText: "CHAS Health & Safety Accredited" },
              ].map((badge) => (
                <button
                  key={badge.label}
                  type="button"
                  onClick={() => {
                    if (profile.accreditations.includes(badge.defaultText)) {
                      triggerToast("This certification is already added.");
                      return;
                    }
                    handleChange("accreditations", [...profile.accreditations, badge.defaultText]);
                    triggerToast(`Added ${badge.label}! You can edit your registration number.`);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-800 border border-slate-200 hover:border-indigo-300 transition active:scale-95 shadow-2xs"
                >
                  <span>{badge.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Add Accreditation Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newAccreditation}
              onChange={(e) => setNewAccreditation(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddAccreditation();
                }
              }}
              placeholder="e.g. Gas Safe #123456, NICEIC Approved, FMB Member, Checkatrade"
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
            />
            <button
              type="button"
              onClick={handleAddAccreditation}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* Section 5: Quote Terms & Defaults */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-lg text-slate-900">Default Quote Terms & Conditions</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Default Deposit %
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={profile.defaultDepositPercent}
                  onChange={(e) => handleChange("defaultDepositPercent", Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                />
                <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400">%</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Payment Terms (Days)
              </label>
              <input
                type="number"
                min="0"
                value={profile.paymentTermsDays}
                onChange={(e) => handleChange("paymentTermsDays", Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Quote Validity (Days)
              </label>
              <input
                type="number"
                min="1"
                value={profile.quoteValidityDays}
                onChange={(e) => handleChange("quoteValidityDays", Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Standard Terms & Conditions Note
              </label>
              <textarea
                rows={4}
                value={profile.termsAndConditions || ""}
                onChange={(e) => handleChange("termsAndConditions", e.target.value)}
                placeholder="Terms and guarantee information shown at the bottom of customer quote acceptance page."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
              />
            </div>
          </div>
        </div>

        {/* Section 5: Subscription Plan & Stripe Billing */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <CreditCard className="w-5 h-5 text-blue-600" />
              <h2 className="font-bold text-lg text-slate-900">Subscription & Stripe Billing</h2>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
              <Sparkles className="w-3 h-3 text-blue-600" />
              Free Starter Active
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base text-slate-900">TradeMate Free Starter</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                  5 quotes / mo
                </span>
              </div>
              <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
                Upgrade to <strong>Pro (£9.99/mo)</strong> to unlock unlimited quoting, remove all TradeMate watermarks, collect customer debit/credit card deposits via Stripe, and upload your high-resolution company branding.
              </p>
            </div>

            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition active:scale-[0.98] shrink-0"
            >
              <span>View Plans & Upgrade</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Action Save Button */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-8 rounded-xl shadow-md transition active:scale-[0.98]"
          >
            <Save className="w-4 h-4" />
            <span>Save Business Profile</span>
          </button>
        </div>
      </form>
    </div>
  );
}
