"use client";
import { useEffect, useState } from "react";

export default function Toaster() {
  const [items, setItems] = useState<{ id: number; msg: string }[]>([]);
  useEffect(() => {
    const on = (e: Event) => {
      const id = Date.now() + Math.random();
      setItems((l) => [...l, { id, msg: (e as CustomEvent).detail }]);
      setTimeout(() => setItems((l) => l.filter((x) => x.id !== id)), 3200);
    };
    window.addEventListener("sila-toast", on);
    return () => window.removeEventListener("sila-toast", on);
  }, []);
  return (
    <div className="fixed bottom-5 right-5 z-50 space-y-2" aria-live="polite">
      {items.map((i) => (
        <div key={i.id} className="animate-toast bg-brand-dark text-white rounded-xl px-4 py-3 shadow-lift border border-gold/40 text-sm font-medium">{i.msg}</div>
      ))}
    </div>
  );
}
