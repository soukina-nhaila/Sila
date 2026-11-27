"use client";
import { useState } from "react";
import { api, mad, getUser } from "@/lib/api";
import { useFetch } from "@/components/useFetch";
import { Empty, GridSkeleton, ErrorBox } from "@/components/Cards";

function OrderActions({ role, o, reload }: { role: string; o: any; reload: () => void }) {
  const nextFood: Record<string, string> = { PENDING: "CONFIRMED", CONFIRMED: "PREPARING", PREPARING: "READY_FOR_PICKUP", PICKED_UP: "DELIVERED" };
  const nextShop: Record<string, string> = { PENDING: "CONFIRMED", CONFIRMED: "SHIPPED", SHIPPED: "DELIVERED" };
  const next = (o.kind === "food" ? nextFood : nextShop)[o.status];
  const go = async (status: string) => { try { await api(`/api/orders/${o.id}/status`, { method: "PATCH", body: { status } }); reload(); } catch (e: any) { alert(e.message); } };
  const ok = (role === "SELLER" && o.kind === "marketplace") || (role === "RESTAURANT_OWNER" && o.kind === "food" && o.status !== "PICKED_UP") || (role === "COURIER" && ["PICKED_UP"].includes(o.status));
  return (
    <div className="flex gap-2 items-center">
      <span className="text-xs bg-brand-light rounded px-2">{o.status}</span>
      {next && ok && <button className="btn-primary text-sm" onClick={() => go(next)}>→ {next}</button>}
      {role === "COURIER" && o.status === "READY_FOR_PICKUP" && <button className="btn-primary text-sm" onClick={() => go("PICKED_UP")}>Récupérer</button>}
      {["SELLER", "RESTAURANT_OWNER"].includes(role) && ["PENDING", "CONFIRMED"].includes(o.status) && <button className="btn-ghost text-sm" onClick={() => go("CANCELLED")}>Annuler</button>}
    </div>
  );
}

function Orders({ role }: { role: string }) {
  const { data, loading, error, reload } = useFetch<any[]>("/api/orders");
  if (loading) return <GridSkeleton n={3} h="h-24" />;
  if (error) return <ErrorBox msg={error} />;
  return <div className="space-y-2">{data!.length === 0 ? <Empty text="Aucune commande." /> : data!.map((o) => (
    <div key={o.id} className="card flex justify-between flex-wrap gap-2 items-center">
      <span>{o.kind === "food" ? "🍽️" : "🛍️"} {o.items.map((i: any) => `${i.qty}× ${i.name}`).join(", ")} — <b>{mad(o.total)}</b></span>
      <OrderActions role={role} o={o} reload={reload} />
    </div>))}</div>;
}

function Seller() {
  const stats = useFetch<any>("/api/seller/stats");
  const prods = useFetch<any[]>("/api/seller/products");
  const [f, setF] = useState({ title: "", price: "", stock: "10", category: "home" });
  const add = async () => { try { await api("/api/products", { method: "POST", body: { title: f.title, price: +f.price, stock: +f.stock, category: f.category } }); setF({ ...f, title: "", price: "" }); prods.reload(); stats.reload(); } catch (e: any) { alert(e.message); } };
  return (
    <div className="space-y-4">
      {stats.data && <div className="grid grid-cols-3 gap-3">{[["Produits", stats.data.products], ["Commandes", stats.data.orders], ["Revenu", mad(stats.data.revenue)]].map(([k, v]) => <div key={k as string} className="card text-center"><div className="text-xs">{k}</div><div className="text-xl font-bold text-brand">{v}</div></div>)}</div>}
      <div className="card flex gap-2 flex-wrap">
        <input className="input flex-1" placeholder="Titre" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        <input className="input w-28" type="number" placeholder="Prix" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} />
        <input className="input w-24" type="number" placeholder="Stock" value={f.stock} onChange={(e) => setF({ ...f, stock: e.target.value })} />
        <select className="input w-32" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>{["electronics", "fashion", "home", "beauty", "sports", "toys"].map((c) => <option key={c}>{c}</option>)}</select>
        <button className="btn-accent" onClick={add}>Ajouter</button>
      </div>
      {prods.data?.map((p) => <div key={p.id} className="card flex justify-between"><span>{p.emoji} {p.title} — {mad(p.price)} (stock {p.stock})</span>
        <button className="btn-ghost text-sm" onClick={async () => { await api(`/api/products/${p.id}`, { method: "DELETE" }); prods.reload(); }}>Supprimer</button></div>)}
      <h2 className="font-bold">Commandes</h2><Orders role="SELLER" />
    </div>
  );
}

function Courier() {
  const av = useFetch<any[]>("/api/courier/available");
  return (
    <div className="space-y-4">
      <h2 className="font-bold">Courses disponibles</h2>
      {av.data?.length === 0 && <Empty text="Aucune course disponible." />}
      {av.data?.map((o) => <div key={o.id} className="card flex justify-between"><span>🍽️ {o.restaurant_name} → {o.address.line}, {o.address.city}</span>
        <button className="btn-primary text-sm" onClick={async () => { try { await api(`/api/orders/${o.id}/assign`, { method: "POST" }); av.reload(); } catch (e: any) { alert(e.message); } }}>Accepter</button></div>)}
      <h2 className="font-bold">Mes livraisons</h2><Orders role="COURIER" />
    </div>
  );
}

function Admin() {
  const st = useFetch<any>("/api/admin/stats");
  const us = useFetch<any[]>("/api/admin/users");
  return (
    <div className="space-y-4">
      {st.data && <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{Object.entries(st.data).map(([k, v]) => <div key={k} className="card text-center"><div className="text-xs uppercase">{k}</div><div className="text-xl font-bold text-brand">{k === "revenue" ? mad(v as number) : String(v)}</div></div>)}</div>}
      <h2 className="font-bold">Utilisateurs</h2>
      {us.data?.map((u) => <div key={u.id} className="card flex justify-between items-center"><span>{u.name} — {u.email} <b>({u.role})</b> {u.suspended && "⛔"}</span>
        {u.role !== "ADMIN" && <button className="btn-ghost text-sm" onClick={async () => { await api(`/api/admin/users/${u.id}/suspend`, { method: "PATCH", body: { suspended: !u.suspended } }); us.reload(); }}>{u.suspended ? "Réactiver" : "Suspendre"}</button>}</div>)}
      <h2 className="font-bold">Commandes</h2><Orders role="ADMIN" />
    </div>
  );
}

function Owner() {
  const rs = useFetch<any[]>("/api/restaurants/mine");
  return (
    <div className="space-y-4">
      {rs.data?.map((r) => <div key={r.id} className="card"><b>{r.emoji} {r.name}</b> — {r.menu.length} plats</div>)}
      <h2 className="font-bold">Commandes à préparer</h2><Orders role="RESTAURANT_OWNER" />
    </div>
  );
}

export default function Dashboard() {
  const u = typeof window !== "undefined" ? getUser() : null;
  if (!u) return <Empty text="Connectez-vous pour accéder à votre espace." />;
  return (
    <div className="space-y-4">
      <h1 className="section-title">Espace {u.role.replace("_", " ").toLowerCase()} — {u.name}</h1>
      {u.role === "SELLER" && <Seller />}
      {u.role === "RESTAURANT_OWNER" && <Owner />}
      {u.role === "COURIER" && <Courier />}
      {u.role === "ADMIN" && <Admin />}
      {u.role === "CUSTOMER" && <Orders role="CUSTOMER" />}
    </div>
  );
}
