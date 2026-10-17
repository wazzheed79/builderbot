"use client";

import { useState } from "react";
import { Camera, Image as ImageIcon, Trash2, Eye, Plus } from "lucide-react";

interface SitePhotosUploaderProps {
  photos: string[];
  onChange: (photos: string[]) => void;
  maxPhotos?: number;
}

/**
 * Resizes an image file client-side using an HTML5 Canvas to keep base64 strings
 * lightweight (typically 80KB-150KB) while maintaining crisp resolution for PDFs and screens.
 */
function compressImage(file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            maxHeight = height;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function SitePhotosUploader({
  photos = [],
  onChange,
  maxPhotos = 6,
}: SitePhotosUploaderProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [activePreview, setActivePreview] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (photos.length + files.length > maxPhotos) {
      alert(`You can attach up to ${maxPhotos} photos per quote.`);
      return;
    }

    setIsProcessing(true);
    try {
      const newBase64s: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith("image/")) continue;
        const compressed = await compressImage(file);
        newBase64s.push(compressed);
      }
      onChange([...photos, ...newBase64s]);
    } catch (err) {
      console.error("Photo upload error:", err);
      alert("Failed to process image. Please try again.");
    } finally {
      setIsProcessing(false);
      e.target.value = "";
    }
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    onChange(photos.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-blue-600" />
          <h3 className="font-bold text-sm text-slate-900">Job Site & Inspection Photos</h3>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
          {photos.length} / {maxPhotos} attached
        </span>
      </div>

      <p className="text-xs text-slate-500">
        Attach site photos (damaged areas, measurements, existing fittings). These will be included
        on the customer review page and printed quote PDF.
      </p>

      {/* Thumbnails Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-1">
        {photos.map((photoUrl, idx) => (
          <div
            key={idx}
            className="group relative aspect-4/3 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-xs"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoUrl}
              alt={`Job site reference ${idx + 1}`}
              className="w-full h-full object-cover transition group-hover:scale-105"
            />

            {/* Overlay Actions */}
            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setActivePreview(photoUrl)}
                className="p-1.5 bg-white/90 hover:bg-white text-slate-900 rounded-lg shadow-sm transition"
                title="View Full Photo"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleRemovePhoto(idx)}
                className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm transition"
                title="Remove Photo"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <span className="absolute bottom-1.5 left-1.5 bg-slate-900/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded backdrop-blur-xs">
              Photo #{idx + 1}
            </span>
          </div>
        ))}

        {/* Add Photo Button (Camera or Gallery) */}
        {photos.length < maxPhotos && (
          <label className="aspect-4/3 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/70 hover:bg-blue-50/50 flex flex-col items-center justify-center cursor-pointer transition p-3 text-center group">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              disabled={isProcessing}
              className="hidden"
            />
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-1 group-hover:scale-110 transition">
              {isProcessing ? (
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
            </div>
            <span className="text-xs font-bold text-slate-700 group-hover:text-blue-700">
              {isProcessing ? "Processing..." : "Take / Add Photo"}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5">Camera or library</span>
          </label>
        )}
      </div>

      {photos.length === 0 && (
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center gap-2 text-xs text-slate-500">
          <ImageIcon className="w-4 h-4 text-slate-400 shrink-0" />
          <span>No site photos attached yet. Tap &apos;Take / Add Photo&apos; to snap site evidence.</span>
        </div>
      )}

      {/* Full Photo Preview Modal */}
      {activePreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setActivePreview(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl p-2 border border-slate-700">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activePreview}
              alt="Site Photo Full Preview"
              className="max-h-[80vh] w-auto object-contain rounded-xl"
            />
            <button
              type="button"
              onClick={() => setActivePreview(null)}
              className="absolute top-4 right-4 bg-slate-900/80 hover:bg-slate-900 text-white font-bold text-xs px-3 py-1.5 rounded-full shadow-lg transition"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
