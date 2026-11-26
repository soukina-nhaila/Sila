"use client";
import Link from "next/link";
import { useFetch } from "@/components/useFetch";
import { ProductCard, RestaurantCard, Loading, ErrorBox } from "@/components/Cards";

export default function Home() {
  const cats = useFetch<any[]>("/api/categories");
  const feat = useFetch<any>("/api/products?featured=true&per_page=8");
  const resto = useFetch<any>("/api/restaurants?per_page=4");
  return (
    <div className="space-y-10">
      <section className="rounded-3xl bg-gradient-to-r from-brand-dark via-brand to-brand-dark text-white p-8 md:p-14 relative overflow-hidden">
        <p className="text-gold tracking-widest text-sm font-semibold">SHOP · EAT · DISCOVER</p>
        <h1 className="text-3xl md:text-5xl font-black mt-2">Tout SILA, <span className="text-gold-champagne">en un seul endroit</span></h1>
        <p className="mt-3 max-w-xl text-gray-200">Boutiques du monde entier et restaurants de votre ville, livrés chez vous.</p>
        <div className="mt-6 flex gap-3 flex-wrap">
          <Link href="/products" className="btn-accent">Découvrir la boutique</Link>
          <Link href="/restaurants" className="btn bg-gold text-brand-dark">Commander un repas</Link>
        </div>
        <p className="mt-4 inline-block bg-accent/90 rounded px-2 py-1 text-sm">Code BIENVENUE10 : -10% sur votre 1ʳᵉ commande</p>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-3">Catégories</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {cats.data?.map((c) => (
            <Link key={c.slug} href={`/products?category=${c.slug}`} className="card text-center hover:bg-brand-light">
              <div className="text-3xl">{c.emoji}</div><div className="text-sm font-medium">{c.name}</div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-3">Produits en vedette</h2>
        {feat.loading ? <Loading /> : feat.error ? <ErrorBox msg={feat.error} /> : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{feat.data?.items.map((p: any) => <ProductCard key={p.id} p={p} />)}</div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-bold mb-3">Restaurants populaires</h2>
        {resto.loading ? <Loading /> : resto.error ? null : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{resto.data?.items.map((r: any) => <RestaurantCard key={r.id} r={r} />)}</div>
        )}
      </section>
    </div>
  );
}
