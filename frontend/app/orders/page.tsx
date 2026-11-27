"use client";
import { useState } from "react";
import { api, mad, getUser } from "@/lib/api";
import { useFetch } from "@/components/useFetch";
import { Empty, GridSkeleton, ErrorBox } from "@/components/Cards";

const FOOD = ["PENDING", "CONFIRMED", "PREPARING", "READY_FOR_PICKUP", "PICKED_UP", "DELIVERED"];
const SHOP = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED"];

export default function Orders() {
  const signed = typeof window !== "undefined" && !!getUser();
  const { data, loading, error, reload } = useFetch<any[]>(signed ? "/api/orders" : null);
  const [msg, setMsg] = useState("");
  if (!signed) return <Empty text="Connectez-vous pour voir vos commandes." />;
  if (loading) return <GridSkeleton n={3} h="h-24" />;
  if (error) return <ErrorBox msg={error} />;
  const act = async (fn: () => Promise<any>) => { try { await fn(); setMsg(""); reload(); } catch (e: any) { setMsg("⚠️ " + e.message); } };
  return (
    <div className="space-y-4">
      <h1 className="section-title">Mes commandes</h1>
      {msg && <ErrorBox msg={msg} />}
      {data!.length === 0 && <Empty text="Aucune commande pour le moment." />}
      {data!.map((o) => {
        const flow = o.kind === "food" ? FOOD : SHOP;
        const idx = flow.indexOf(o.status);
        return (
          <div key={o.id} className="card space-y-2">
            <div className="flex justify-between flex-wrap gap-2">
              <b>{o.kind === "food" ? "🍽️ " + o.restaurant_name : "🛍️ Boutique"}</b>
              <span>{mad(o.total)}</span>
            </div>
            <p className="text-sm text-gray-500">{o.items.map((i: any) => `${i.qty}× ${i.name}`).join(", ")}</p>
            {o.tracking_number && <p className="text-xs">Suivi : <code>{o.tracking_number}</code></p>}
            {o.status === "CANCELLED" ? <p className="text-red-600 font-semibold">Annulée</p> : (
              <div className="flex gap-1">{flow.map((s, i) => <div key={s} title={s} className={`h-2 flex-1 rounded ${i <= idx ? "bg-accent" : "bg-gray-200"}`} />)}</div>
            )}
            <p className="text-xs">Statut : <b>{o.status}</b></p>
            <div className="flex gap-2 flex-wrap">
              {o.status === "PENDING" && <button className="btn-ghost text-sm" onClick={() => act(() => api(`/api/orders/${o.id}/status`, { method: "PATCH", body: { status: "CANCELLED" } }))}>Annuler</button>}
              {o.status === "CANCELLED" && <button className="btn-ghost text-sm" onClick={() => act(() => api(`/api/orders/${o.id}/refund`, { method: "POST" }))}>Demander le remboursement</button>}
              <button className="btn-ghost text-sm" onClick={async () => { const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/orders/${o.id}/invoice`, { headers: { Authorization: "Bearer " + localStorage.getItem("sila_token") } }); alert(await r.text()); }}>Facture</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
