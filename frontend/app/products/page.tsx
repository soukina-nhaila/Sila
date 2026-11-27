"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useFetch } from "@/components/useFetch";
import { ProductCard, GridSkeleton, ErrorBox, Empty } from "@/components/Cards";

function List() {
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") || "");
  const [category, setCategory] = useState(sp.get("category") || "");
  const [sort, setSort] = useState(sp.get("sort") || "new");
  const [max, setMax] = useState("");
  const [page, setPage] = useState(1);
  const qs = new URLSearchParams({ sort, page: String(page), per_page: "12" });
  if (q) qs.set("q", q);
  if (category) qs.set("category", category);
  if (max) qs.set("max_price", max);
  if (sp.get("featured")) qs.set("featured", "true");
  const cats = useFetch<any[]>("/api/categories");
  const { data, loading, error } = useFetch<any>(`/api/products?${qs}`);
  const pick = (c: string) => { setCategory(c); setPage(1); };
  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-r from-brand-dark to-brand text-white p-8">
        <h1 className="font-display text-3xl md:text-4xl font-black">La boutique SILA</h1>
        <p className="text-purple-100 mt-1">Des produits du monde entier, livrés chez vous.</p>
      </div>
      <div className="grid lg:grid-cols-[260px_1fr] gap-6 items-start">
        <aside className="card space-y-5 lg:sticky lg:top-36">
          <div><label className="text-xs font-bold uppercase tracking-wider text-gray-500">Recherche</label>
            <input className="input mt-1" placeholder="Nom, marque…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} /></div>
          <div><p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Catégories</p>
            <div className="flex flex-wrap gap-2">
              <button className={`chip ${category === "" ? "!bg-brand !text-white" : ""}`} onClick={() => pick("")}>Toutes</button>
              {cats.data?.map((c) => <button key={c.slug} className={`chip ${category === c.slug ? "!bg-brand !text-white" : ""}`} onClick={() => pick(c.slug)}>{c.emoji} {c.name}</button>)}
            </div></div>
          <div><label className="text-xs font-bold uppercase tracking-wider text-gray-500">Prix max (MAD)</label>
            <input className="input mt-1" type="number" min={0} placeholder="ex. 500" value={max} onChange={(e) => { setMax(e.target.value); setPage(1); }} /></div>
        </aside>
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">{data ? <><b>{data.total}</b> produit(s)</> : "…"}</p>
            <select className="input !w-auto" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Trier">
              <option value="new">Nouveautés</option><option value="popular">Meilleures ventes</option><option value="price_asc">Prix croissant</option><option value="price_desc">Prix décroissant</option><option value="rating">Mieux notés</option>
            </select>
          </div>
          {loading ? <GridSkeleton n={6} /> : error ? <ErrorBox msg={error} /> : data.items.length === 0 ? <Empty icon="🔍" text="Aucun produit ne correspond à votre recherche." /> : (
            <>
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-5">{data.items.map((p: any) => <ProductCard key={p.id} p={p} />)}</div>
              <div className="flex justify-center items-center gap-3 pt-4">
                <button className="btn-ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Précédent</button>
                <span className="text-sm">Page <b>{data.page}</b> / {data.pages}</span>
                <button className="btn-ghost" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Suivant →</button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
export default function Page() { return <Suspense fallback={<GridSkeleton />}><List /></Suspense>; }
