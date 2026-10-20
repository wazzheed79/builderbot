"use client";

import { useEffect, useState } from "react";

interface QuoteQrCodeProps {
  url: string;
  size?: number;
  label?: string;
  className?: string;
}

const ABSOLUTE_LINK = /^https?:\/\//i;

/**
 * Draws a QR code in the browser. Nothing is sent to a third-party image host.
 * Hidden until the link is a real web address, so an empty link never requests a code.
 */
export default function QuoteQrCode({
  url,
  size = 120,
  label = "Scan with phone to accept online",
  className = "",
}: QuoteQrCodeProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [drawnFor, setDrawnFor] = useState("");
  const usable = ABSOLUTE_LINK.test(url);

  useEffect(() => {
    if (!usable) return;

    let cancelled = false;
    import("qrcode")
      .then((QR) =>
        QR.toDataURL(url, {
          width: size * 2,
          margin: 1,
          errorCorrectionLevel: "M",
          color: { dark: "#2c2416", light: "#ffffff" },
        })
      )
      .then((dataUrl) => {
        if (cancelled) return;
        setDrawnFor(url);
        setSrc(dataUrl);
      })
      .catch(() => {
        if (cancelled) return;
        setDrawnFor(url);
        setSrc(null);
      });

    return () => {
      cancelled = true;
    };
  }, [url, size, usable]);

  if (!usable || drawnFor !== url || !src) return null;

  return (
    <div className={`flex flex-col items-center justify-center text-center ${className}`}>
      <div
        className="bg-white p-2 rounded-xl border border-slate-200 shadow-xs inline-flex items-center justify-center"
        style={{ width: size + 16, height: size + 16 }}
      >
        {/* Data URL from the local QR library. next/image does not optimise these. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="QR code for this quote" width={size} height={size} className="block" />
      </div>
      {label ? (
        <span className="text-[10px] font-bold text-slate-500 mt-1.5 uppercase tracking-wider block">
          {label}
        </span>
      ) : null}
    </div>
  );
}
