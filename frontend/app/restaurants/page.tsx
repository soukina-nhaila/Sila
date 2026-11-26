"use client";
import { useState } from "react";
import { useFetch } from "@/components/useFetch";
import { RestaurantCard, Loading, ErrorBox, Empty } from "@/components/Cards";

export default function Restaurants() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const cats = useFetch<string[]>("/api/restaurant-categories");
  const qs = new URLSearchParams({ per_page: "24" });
  if (q) qs.set("q", q);
  if (cat) qs.set("category", cat);
  const { data, loading, error } = useFetch<any>(`/api/restaurants?${qs}`);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Restaurants, snacks & cafés</h1>
      <div className="flex gap-2 flex-wrap">
        <input className="input max-w-xs" placeholder="Rechercher un restaurant" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className={cat === "" ? "btn-primary" : "btn-ghost"} onClick={() => setCat("")}>Tous</button>
        {cats.data?.map((c) => <button key={c} className={cat === c ? "btn-primary" : "btn-ghost"} onClick={() => setCat(c)}>{c}</button>)}
      </div>
      {loading ? <Loading /> : error ? <ErrorBox msg={error} /> : data.items.length === 0 ? <Empty text="Aucun restaurant trouvé." /> :
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{data.items.map((r: any) => <RestaurantCard key={r.id} r={r} />)}</div>}
    </div>
  );
}
