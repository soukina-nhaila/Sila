"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUser, logout, User } from "@/lib/api";
import { t, Lang } from "@/lib/i18n";

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [lang, setLang] = useState<Lang>("fr");
  const [q, setQ] = useState("");
  const router = useRouter();
  useEffect(() => {
    const sync = () => setUser(getUser());
    sync();
    setLang((localStorage.getItem("sila_lang") as Lang) || "fr");
    window.addEventListener("sila-auth", sync);
    return () => window.removeEventListener("sila-auth", sync);
  }, []);
  const toggle = () => { const n = lang === "fr" ? "en" : "fr"; setLang(n); localStorage.setItem("sila_lang", n); };
  return (
    <header className="bg-brand-dark text-white sticky top-0 z-30 shadow">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="w-9 h-9 rounded-full bg-gold flex items-center justify-center text-brand-dark font-black">S</span>
          <span className="text-2xl font-black tracking-widest text-gold-champagne">SILA</span>
        </Link>
        <form className="flex-1 min-w-[180px] flex" onSubmit={(e) => { e.preventDefault(); router.push(`/products?q=${encodeURIComponent(q)}`); }}>
          <input className="flex-1 rounded-l-lg px-3 py-2 text-ink" placeholder={t("search", lang)} value={q} onChange={(e) => setQ(e.target.value)} aria-label="Recherche" />
          <button className="bg-accent px-4 rounded-r-lg font-semibold">🔍</button>
        </form>
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link href="/products" className="hover:text-gold">{t("shop", lang)}</Link>
          <Link href="/restaurants" className="hover:text-gold">{t("eat", lang)}</Link>
          <Link href="/cart" className="hover:text-gold">🛒 {t("cart", lang)}</Link>
          {user ? (
            <>
              <Link href="/orders" className="hover:text-gold">{t("orders", lang)}</Link>
              {user.role !== "CUSTOMER" && <Link href="/dashboard" className="text-gold">{t("dashboard", lang)}</Link>}
              <button onClick={() => { logout(); router.push("/"); }} className="underline">{t("logout", lang)} ({user.name.split(" ")[0]})</button>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-gold">{t("login", lang)}</Link>
              <Link href="/register" className="bg-gold text-brand-dark px-3 py-1 rounded-lg font-bold">{t("register", lang)}</Link>
            </>
          )}
          <button onClick={toggle} className="border border-gold rounded px-2 py-0.5 text-xs" aria-label="Langue">{lang.toUpperCase()}</button>
        </nav>
      </div>
    </header>
  );
}
