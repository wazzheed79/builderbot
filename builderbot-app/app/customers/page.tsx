"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Users,
  Plus,
  Phone,
  Mail,
  MapPin,
  FileText,
  Search,
  ExternalLink,
} from "lucide-react";

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [customers, setCustomers] = useState([
    {
      id: "1",
      name: "Sarah Jenkins",
      phone: "+44 7911 123456",
      email: "sarah.jenkins@example.com",
      address: "24 Orchard Way, Bristol, BS8 4EJ",
      quotesCount: 2,
      totalSpent: "£1,420.00",
      status: "Active",
    },
    {
      id: "2",
      name: "David Miller",
      phone: "+44 7700 900123",
      email: "david.m@example.com",
      address: "12 Meadow Lane, Bath, BA1 5TT",
      quotesCount: 1,
      totalSpent: "£1,120.00",
      status: "Active",
    },
    {
      id: "3",
      name: "Oakfield House (Commercial)",
      phone: "+44 7820 445566",
      email: "property@oakfield.co.uk",
      address: "Suite 4, Oakfield Business Park, Bristol, BS1 2AB",
      quotesCount: 3,
      totalSpent: "£4,250.00",
      status: "Active",
    },
  ]);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-8 h-8 text-blue-600" />
            Customer Directory
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Manage your client contacts, property addresses, and past quote history.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            const name = prompt("Enter customer name:");
            if (!name) return;
            const address = prompt("Enter customer property address:") || "Bristol, UK";
            const phone = prompt("Enter contact phone:") || "+44 7000 000000";
            setCustomers([
              ...customers,
              {
                id: Date.now().toString(),
                name,
                phone,
                email: `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
                address,
                quotesCount: 0,
                totalSpent: "£0.00",
                status: "Active",
              },
            ]);
          }}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-md transition self-start sm:self-auto active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="mt-8 flex items-center max-w-md bg-white border border-slate-300 rounded-xl px-3 py-2 shadow-2xs">
        <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name or site address..."
          className="w-full text-sm outline-none bg-transparent"
        />
      </div>

      {/* Customers List */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((customer) => (
          <div
            key={customer.id}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-200 transition space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">{customer.name}</h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {customer.status}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 font-semibold uppercase">Total Value</span>
                <p className="font-bold text-slate-900 text-sm">{customer.totalSpent}</p>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600">
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
                <span>{customer.email}</span>
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">{customer.quotesCount} quotes issued</span>
              <Link
                href="/quotes"
                className="text-blue-600 font-semibold hover:underline inline-flex items-center gap-1"
              >
                <span>New Quote</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}