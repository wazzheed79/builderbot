"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Users,
  Plus,
  Phone,
  Mail,
  MapPin,
  Search,
  Building,
  ClipboardList,
  Trash2,
  Edit2,
  CheckCircle2,
  X,
} from "lucide-react";
import {
  Customer,
  Quote,
  getCustomers,
  saveCustomer,
  deleteCustomer,
  getQuotes,
} from "@/lib/storage";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>(() => getCustomers());
  const [quotes, setQuotes] = useState<Quote[]>(() => getQuotes());
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const loadData = () => {
    setCustomers(getCustomers());
    setQuotes(getQuotes());
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const openCreateModal = () => {
    setEditingCustomer(null);
    setName("");
    setCompany("");
    setPhone("");
    setEmail("");
    setAddress("");
    setNotes("");
    setShowModal(true);
  };

  const openEditModal = (cust: Customer) => {
    setEditingCustomer(cust);
    setName(cust.name);
    setCompany(cust.company || "");
    setPhone(cust.phone);
    setEmail(cust.email);
    setAddress(cust.address);
    setNotes(cust.notes || "");
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    saveCustomer({
      ...(editingCustomer ? { id: editingCustomer.id, createdAt: editingCustomer.createdAt } : {}),
      name: name.trim(),
      company: company.trim() || undefined,
      phone: phone.trim() || "+44 7000 000000",
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
      address: address.trim() || "Bristol, UK",
      notes: notes.trim() || undefined,
    });

    loadData();
    setShowModal(false);
    triggerToast(editingCustomer ? "Customer profile updated!" : "New customer record added!");
  };

  const handleDelete = (id: string, customerName: string) => {
    if (confirm(`Are you sure you want to delete ${customerName}?`)) {
      deleteCustomer(id);
      loadData();
      triggerToast("Customer deleted.");
    }
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.company && c.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
      c.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
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
            <Users className="w-8 h-8 text-blue-600" />
            Customer Directory (CRM)
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Store client property details, contact info, notes, and past quote history.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-md transition self-start sm:self-auto active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Search Bar & Stats */}
      <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center max-w-md w-full bg-white border border-slate-300 rounded-xl px-3 py-2 shadow-2xs">
          <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by customer name, company, or address..."
            className="w-full text-sm outline-none bg-transparent"
          />
        </div>
        <div className="text-xs text-slate-500 font-semibold self-end sm:self-center">
          Showing {filtered.length} of {customers.length} client records
        </div>
      </div>

      {/* Customers Cards Grid */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((customer) => {
          const clientQuotes = quotes.filter(
            (q) =>
              q.customerId === customer.id ||
              q.clientName.toLowerCase() === customer.name.toLowerCase()
          );
          const totalRevenue = clientQuotes
            .filter((q) => q.status === "Accepted")
            .reduce((acc, q) => acc + q.total, 0);

          return (
            <div
              key={customer.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-200 transition space-y-4 flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">{customer.name}</h3>
                    {customer.company && (
                      <p className="text-xs font-medium text-slate-500 flex items-center gap-1 mt-0.5">
                        <Building className="w-3 h-3 text-slate-400" />
                        <span>{customer.company}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(customer)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
                      title="Edit customer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(customer.id, customer.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                      title="Delete customer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div className="mt-3.5 space-y-2 text-xs text-slate-600">
                  <p className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{customer.address}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{customer.phone}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{customer.email}</span>
                  </p>
                </div>

                {/* Notes */}
                {customer.notes && (
                  <div className="mt-3 bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/60 text-xs text-amber-900 flex items-start gap-1.5">
                    <ClipboardList className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{customer.notes}</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 uppercase text-[10px] font-bold block">
                    Won Value ({clientQuotes.length} quotes)
                  </span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    £{totalRevenue.toFixed(2)}
                  </span>
                </div>
                <Link
                  href={`/quotes?customerId=${customer.id}`}
                  className="inline-flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-3 py-1.5 rounded-lg transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Quote</span>
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span>{editingCustomer ? "Edit Customer Record" : "Add New Customer"}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Company / Organisation
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Private or Oakfield Ltd"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 07911 123456"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. sarah@example.com"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Site / Property Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 24 Orchard Way, Bristol, BS8 4EJ"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Site Notes / Access Details
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Key in safe box, parking on driveway, gate code #4210..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition"
                >
                  {editingCustomer ? "Update Customer" : "Save Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}