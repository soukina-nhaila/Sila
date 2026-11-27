"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getUser, logout, User } from "@/lib/api";
import { t, Lang } from "@/lib/i18n";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <svg width="38" height="38" viewBox="0 0 40 40" aria-hidden>
        <defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#6B2F99" /><stop offset="1" stopColor="#321449" /></linearGradient></defs>
        <rect width="40" height="40" rx="11" fill="url(#lg)" />
        <path d="M26 13.5c-1.6-1.6-3.6-2.3-6-2.3-3.4 0-5.8 1.7-5.8 4.4 0 6.4 11.9 3.3 11.9 9.6 0 2.8-2.6 4.6-6.1 4.6-2.6 0-4.9-.9-6.6-2.6" fill="none" stroke="#E9D7A5" strokeWidth="3" strokeLinecap="round" />
        <circle cx="31" cy="9" r="2.4" fill="#F28C45" />
      </svg>
      <span className="leading-none">
        <span className={`block font-display text-2xl font-black tracking-[.18em] ${light ? "text-white" : "text-brand-dark"}`}>SILA</span>
        <span className={`block text-[9px] tracking-[.3em] font-semibold ${light ? "text-gold-champagne" : "text-gold"}`}>SHOP · EAT · DISCOVER</span>
      </span>
    </span>
  );
}

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [lang, setLang] = useState<Lang>("fr");
  const [q, setQ] = useState("");
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const sync = () => {
      const u = getUser();
      setUser(u);
      if (u && u.role === "CUSTOMER") api<any>("/api/cart").then((c) => setCount(c.items.reduce((s: number, i: any) => s + i.qty, 0))).catch(() => setCount(0));
      else setCount(0);
    };
    sync();
    setLang((localStorage.getItem("sila_lang") as Lang) || "fr");
    window.addEventListener("sila-auth", sync);
    window.addEventListener("sila-cart", sync);
    return () => { window.removeEventListener("sila-auth", sync); window.removeEventListener("sila-cart", sync); };
  }, []);
  const toggle = () => { const n = lang === "fr" ? "en" : "fr"; setLang(n); localStorage.setItem("sila_lang", n); };

  return (
    <header className="sticky top-0 z-40">
      <div className="bg-brand-dark text-gold-champagne text-xs text-center py-1.5 px-3 tracking-wide">
        🚚 Livraison offerte dès 500 MAD &nbsp;·&nbsp; Code <b className="text-white">BIENVENUE10</b> : -10% sur votre première commande
      </div>
      <div className="bg-white/95 backdrop-blur border-b border-brand/10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/" aria-label="Accueil SILA"><Logo /></Link>
          <form className="hidden md:flex flex-1 max-w-2xl mx-auto relative" onSubmit={(e) => { e.preventDefault(); router.push(`/products?q=${encodeURIComponent(q)}`); }}>
            <input className="w-full rounded-full border border-brand/15 bg-brand-50 pl-5 pr-14 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand/40" placeholder={t("search", lang)} value={q} onChange={(e) => setQ(e.target.value)} aria-label="Recherche" />
            <button className="absolute right-1 top-1 bottom-1 w-10 rounded-full bg-brand text-white hover:bg-brand-dark" aria-label="Rechercher">
              <svg className="mx-auto" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            </button>
          </form>
          <div className="ml-auto flex items-center gap-2 md:gap-3">
            <button onClick={toggle} className="text-xs font-bold border border-brand/20 text-brand rounded-lg px-2 py-1 hover:bg-brand-light" aria-label="Changer de langue">{lang === "fr" ? "FR" : "EN"}</button>
            <Link href="/cart" className="relative btn-ghost !px-3 !py-2" aria-label="Panier">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" /><path d="M2 3h3l2.7 11.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 7H6" /></svg>
              <span className="hidden sm:inline">{t("cart", lang)}</span>
              {count > 0 && <span className="absolute -top-2 -right-2 bg-accent text-white text-[11px] font-bold rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center shadow">{count}</span>}
            </Link>
            {user ? (
              <div className="relative">
                <button onClick={() => setOpen(!open)} className="flex items-center gap-2 rounded-full bg-brand-light pl-1 pr-3 py-1 hover:bg-brand/10">
                  <span className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center font-bold">{user.name[0]}</span>
                  <span className="hidden sm:block text-sm font-semibold text-brand-dark">{user.name.split(" ")[0]}</span>
                </button>
                {open && (
                  <div className="absolute right-0 mt-2 w-52 card !p-2 text-sm" onClick={() => setOpen(false)}>
                    <p className="px-3 py-1 text-xs text-gray-500">{user.email}</p>
                    <Link href="/orders" className="block px-3 py-2 rounded-lg hover:bg-brand-light">📦 {t("orders", lang)}</Link>
                    {user.role !== "CUSTOMER" && <Link href="/dashboard" className="block px-3 py-2 rounded-lg hover:bg-brand-light">📊 {t("dashboard", lang)}</Link>}
                    <button onClick={() => { logout(); router.push("/"); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-brand-light text-red-600">↩ {t("logout", lang)}</button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/login" className="hidden sm:inline-flex btn-ghost !py-2">{t("login", lang)}</Link>
                <Link href="/register" className="btn-primary !py-2">{t("register", lang)}</Link>
              </>
            )}
          </div>
        </div>
        <nav className="border-t border-brand/10">
          <div className="max-w-7xl mx-auto px-4 flex gap-6 text-sm font-semibold overflow-x-auto whitespace-nowrap py-2 text-brand-dark">
            <Link href="/products" className="hover:text-accent">🛍️ {t("shop", lang)}</Link>
            <Link href="/restaurants" className="hover:text-accent">🍽️ {t("eat", lang)}</Link>
            {[["electronics", "Électronique"], ["fashion", "Mode"], ["home", "Maison"], ["beauty", "Beauté"], ["sports", "Sport"], ["toys", "Jouets"]].map(([s, n]) => (
              <Link key={s} href={`/products?category=${s}`} className="font-medium text-gray-600 hover:text-accent">{n}</Link>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}
