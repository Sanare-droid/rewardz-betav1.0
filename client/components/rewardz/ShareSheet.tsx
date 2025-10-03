import { X } from "lucide-react";

export default function ShareSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute left-1/2 bottom-0 -translate-x-1/2 w-full max-w-[430px] rounded-t-3xl bg-white p-6">
        <div className="mx-auto h-1.5 w-14 rounded-full bg-gray-200 mb-4" />
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold">Share</h3>
          <button aria-label="Close" onClick={onClose} className="p-2">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="grid grid-cols-5 gap-4 text-center">
          {[
            { label: "Facebook", emoji: "📘" },
            { label: "Whatsapp", emoji: "🟢" },
            { label: "Instagram", emoji: "📸" },
            { label: "X", emoji: "❌" },
            { label: "Download", emoji: "⬇️" },
          ].map((i) => (
            <div key={i.label} className="flex flex-col items-center gap-1">
              <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center text-xl">
                {i.emoji}
              </div>
              <span className="text-xs text-gray-600">{i.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
