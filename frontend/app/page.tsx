"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFetch } from "@/components/useFetch";
import { ProductCard, RestaurantCard, GridSkeleton, ErrorBox, SectionHead } from "@/components/Cards";

const CAT_STYLE: Record<string, string> = {
  electronics: "from-[#E4D3F2] to-[#C8B6F0]", fashion: "from-[#F9D3DE] to-[#F2B8C9]", home: "from-[#FBE0C3] to-[#F7CFA3]",
  beauty: "from-[#F5C6E0] to-[#E9A8CE]", sports: "from-[#CFE6DF] to-[#B5D6CB]", toys: "from-[#F5ECD3] to-[#E2CB8A]",
};

export default function Home() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const cats = useFetch<any[]>("/api/categories");
  const feat = useFetch<any>("/api/products?featured=true&per_page=8");
  const best = useFetch<any>("/api/products?sort=popular&per_page=4");
  const resto = useFetch<any>("/api/restaurants?per_page=4");

  return (
    <div className="space-y-16 -mt-2">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-dark via-brand to-[#7B3AA8] text-white">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-gold/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute inset-0 opacity-[.07]" style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
        <div className="relative grid lg:grid-cols-2 gap-10 p-8 md:p-14 items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/50 bg-white/10 px-4 py-1.5 text-xs tracking-[.25em] text-gold-champagne font-semibold">SHOP · EAT · DISCOVER</span>
            <h1 className="font-display text-4xl md:text-6xl font-black leading-[1.05]">
              Le monde entier<br />et votre ville, <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-gold-champagne">livrés chez vous.</span>
            </h1>
            <p className="text-lg text-purple-100 max-w-lg">Des milliers de produits de boutiques du monde entier, et les meilleurs restaurants de Larache, en une seule application.</p>
            <form className="flex bg-white rounded-full p-1.5 max-w-xl shadow-lift" onSubmit={(e) => { e.preventDefault(); router.push(`/products?q=${encodeURIComponent(q)}`); }}>
              <input className="flex-1 bg-transparent px-5 text-ink focus:outline-none" placeholder="Que cherchez-vous ? écouteurs, sneakers, tajine…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Recherche" />
              <button className="btn-accent !rounded-full">Rechercher</button>
            </form>
            <div className="flex gap-3 flex-wrap">
              <Link href="/products" className="btn-gold">🛍️ Explorer la boutique</Link>
              <Link href="/restaurants" className="btn border border-white/40 text-white hover:bg-white/10">🍽️ Commander un repas</Link>
            </div>
          </div>
          <div className="relative hidden lg:block h-[380px]">
            <div className="absolute top-2 left-6 w-60 rounded-3xl bg-white/15 backdrop-blur border border-white/30 p-5 shadow-lift animate-floaty"><div className="text-6xl">🎧</div><p className="mt-2 font-bold">Écouteurs Pro</p><p className="text-gold-champagne text-sm">-30% cette semaine</p></div>
            <div className="absolute top-28 right-0 w-60 rounded-3xl bg-white/15 backdrop-blur border border-white/30 p-5 shadow-lift animate-floaty [animation-delay:1.2s]"><div className="text-6xl">🍕</div><p className="mt-2 font-bold">Pizza Napoli</p><p className="text-gold-champagne text-sm">Livré en ~35 min</p></div>
            <div className="absolute bottom-0 left-16 w-60 rounded-3xl bg-white/15 backdrop-blur border border-white/30 p-5 shadow-lift animate-floaty [animation-delay:2.4s]"><div className="text-6xl">📦</div><p className="mt-2 font-bold">Suivi en direct</p><p className="text-gold-champagne text-sm">Nationale & internationale</p></div>
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 -mt-6 relative z-10 px-2">
        {[["🚚", "Livraison nationale & internationale", "Suivi inclus"], ["🛡️", "Paiement sécurisé", "Aucune donnée de carte stockée"], ["🍲", "Repas livrés chauds", "Restaurants locaux"], ["💬", "Support réactif", "Tickets & contact"]].map(([i, a, b]) => (
          <div key={a} className="card !p-4 flex items-center gap-3"><span className="text-3xl">{i}</span><div><p className="font-bold text-sm leading-tight">{a}</p><p className="text-xs text-gray-500">{b}</p></div></div>
        ))}
      </section>

      {/* CATEGORIES */}
      <section>
        <SectionHead title="Parcourir par catégorie" href="/products" />
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {cats.data?.map((c) => (
            <Link key={c.slug} href={`/products?category=${c.slug}`} className="group text-center">
              <div className={`mx-auto w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br ${CAT_STYLE[c.slug] || "from-brand-light to-gold-champagne"} flex items-center justify-center text-5xl shadow-card group-hover:shadow-lift group-hover:-translate-y-1 transition-all`}>{c.emoji}</div>
              <p className="mt-3 font-semibold text-sm group-hover:text-brand">{c.name}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* PROMO BANNERS */}
      <section className="grid md:grid-cols-2 gap-5">
        <Link href="/products?sort=price_asc" className="group relative overflow-hidden rounded-3xl bg-gradient-to-r from-accent to-[#F7A96B] p-8 text-white shadow-card hover:shadow-lift transition">
          <p className="text-xs tracking-[.25em] font-semibold opacity-90">OFFRES DE LA SEMAINE</p>
          <h3 className="font-display text-3xl font-black mt-2">Jusqu&apos;à -30%<br />sur la boutique</h3>
          <span className="inline-block mt-4 bg-white text-accent font-bold rounded-full px-4 py-1.5 group-hover:px-6 transition-all">J&apos;en profite →</span>
          <span className="absolute right-4 bottom-0 text-[9rem] leading-none opacity-30 group-hover:scale-110 transition">🏷️</span>
        </Link>
        <Link href="/restaurants" className="group relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-dark to-brand p-8 text-white shadow-card hover:shadow-lift transition">
          <p className="text-xs tracking-[.25em] font-semibold text-gold-champagne">FAIM ?</p>
          <h3 className="font-display text-3xl font-black mt-2">Vos restaurants préférés,<br />livrés en 30 min</h3>
          <span className="inline-block mt-4 bg-gold text-brand-dark font-bold rounded-full px-4 py-1.5 group-hover:px-6 transition-all">Commander →</span>
          <span className="absolute right-4 bottom-0 text-[9rem] leading-none opacity-25 group-hover:scale-110 transition">🍔</span>
        </Link>
      </section>

      {/* FEATURED */}
      <section>
        <SectionHead title="Produits en vedette" href="/products?featured=true" />
        {feat.loading ? <GridSkeleton /> : feat.error ? <ErrorBox msg={feat.error} /> : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">{feat.data?.items.map((p: any) => <ProductCard key={p.id} p={p} />)}</div>
        )}
      </section>

      {/* RESTAURANTS */}
      <section>
        <SectionHead title="Restaurants populaires" href="/restaurants" />
        {resto.loading ? <GridSkeleton h="h-64" /> : resto.error ? null : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">{resto.data?.items.map((r: any) => <RestaurantCard key={r.id} r={r} />)}</div>
        )}
      </section>

      {/* BEST SELLERS */}
      <section>
        <SectionHead title="Meilleures ventes" href="/products?sort=popular" />
        {best.loading ? <GridSkeleton n={4} /> : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">{best.data?.items.map((p: any) => <ProductCard key={p.id} p={p} />)}</div>
        )}
      </section>

      {/* JOIN */}
      <section className="rounded-3xl bg-gradient-to-br from-brand-50 to-gold-champagne/50 border border-gold/30 p-8 md:p-12 grid md:grid-cols-3 gap-6 text-center">
        {[["🏪", "Vendez sur SILA", "Ouvrez votre boutique et touchez des clients partout."], ["👨‍🍳", "Ouvrez votre restaurant", "Gérez menus, commandes et livraisons."], ["🛵", "Devenez livreur", "Choisissez vos courses, gagnez à votre rythme."]].map(([i, a, b]) => (
          <div key={a} className="space-y-2"><div className="text-5xl">{i}</div><h3 className="font-display text-xl font-bold text-brand-dark">{a}</h3><p className="text-sm text-gray-600">{b}</p><Link href="/register" className="btn-primary !py-2 mt-2">Commencer</Link></div>
        ))}
      </section>
    </div>
  );
}
