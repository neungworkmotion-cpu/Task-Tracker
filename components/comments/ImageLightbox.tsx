"use client";

export default function ImageLightbox({
  src,
  onClose,
}: {
  src: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="รูปแนบ" className="max-h-full max-w-full rounded-lg object-contain" />
      <button
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full bg-white/20 px-3 py-1 text-white hover:bg-white/30"
      >
        ✕
      </button>
    </div>
  );
}
