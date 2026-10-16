"use client";

import React, { useState } from "react";
import { QrCode } from "lucide-react";

interface QuoteQrCodeProps {
  url: string;
  size?: number;
  label?: string;
  className?: string;
}

/**
 * High-resolution QR Code component for trade quotes and print documents.
 * Allows homeowners to scan a printed or on-screen PDF with their phone camera
 * to immediately open and sign the digital quote online.
 */
export default function QuoteQrCode({
  url,
  size = 120,
  label = "Scan with phone to accept online",
  className = "",
}: QuoteQrCodeProps) {
  const [loadFailed, setLoadFailed] = useState(false);
  const encodedUrl = encodeURIComponent(url);
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size * 2}x${size * 2}&format=svg&margin=4&data=${encodedUrl}`;

  return (
    <div className={`flex flex-col items-center justify-center text-center ${className}`}>
      <div
        className="bg-white p-2 rounded-xl border border-slate-200 shadow-xs inline-flex items-center justify-center"
        style={{ width: size + 16, height: size + 16 }}
      >
        {!loadFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qrImageUrl}
            alt="Scan QR code to view and accept quotation"
            width={size}
            height={size}
            onError={() => setLoadFailed(true)}
            className="block"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-400 p-2">
            <QrCode className="w-8 h-8 text-slate-500 mb-1" />
            <span className="text-[9px] font-mono leading-tight">builderbot.co.uk</span>
          </div>
        )}
      </div>
      {label && (
        <span className="text-[10px] font-bold text-slate-500 mt-1.5 uppercase tracking-wider block">
          {label}
        </span>
      )}
    </div>
  );
}
