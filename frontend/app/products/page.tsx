"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useFetch } from "@/components/useFetch";
import { ProductCard, Loading, ErrorBox, Empty } from "@/components/Cards";

function List() {
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") || "");
  const [category, setCategory] = useState(sp.get("category") || "");
  const [sort, setSort] = useState("new");
  const [max, setMax] = useState("");
  const [page, setPage] = useState(1);
  const qs = new URLSearchParams({ sort, page: String(page), per_page: "12" });
  if (q) qs.set("q", q);
  if (category) qs.set("category", category);
  if (max) qs.set("max_price", max);
  const cats = useFetch<any[]>("/api/categories");
  const { data, loading, error } = useFetch<any>(`/api/products?${qs}`);
  return (
    <div className="grid md:grid-cols-[220px_1fr] gap-6">
      <aside className="card space-y-3 h-fit">
        <input className="input" placeholder="Recherche" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        <select className="input" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
          <option value="">Toutes catégories</option>
          {cats.data?.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
        <input className="input" type="number" min={0} placeholder="Prix max (MAD)" value={max} onChange={(e) => { setMax(e.target.value); setPage(1); }} />
        <select className="input" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="new">Nouveautés</option><option value="popular">Meilleures ventes</option>
          <option value="price_asc">Prix croissant</option><option value="price_desc">Prix décroissant</option><option value="rating">Mieux notés</option>
        </select>
      </aside>
      <section>
        {loading ? <Loading /> : error ? <ErrorBox msg={error} /> : data.items.length === 0 ? <Empty text="Aucun produit ne correspond à votre recherche." /> : (
          <>
            <p className="text-sm text-gray-500 mb-2">{data.total} produit(s)</p>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">{data.items.map((p: any) => <ProductCard key={p.id} p={p} />)}</div>
            <div className="flex justify-center items-center gap-3 mt-6">
              <button className="btn-ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>←</button>
              <span>Page {data.page} / {data.pages}</span>
              <button className="btn-ghost" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>→</button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
export default function Page() { return <Suspense fallback={<Loading />}><List /></Suspense>; }
