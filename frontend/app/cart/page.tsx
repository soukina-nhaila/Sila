"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, mad, getUser } from "@/lib/api";
import { useFetch } from "@/components/useFetch";
import { toast, cartChanged } from "@/lib/ui";
import { Empty, GridSkeleton, ErrorBox } from "@/components/Cards";

export default function Cart() {
  const router = useRouter();
  const signed = typeof window !== "undefined" && !!getUser();
  const { data, loading, error, reload } = useFetch<any>(signed ? "/api/cart" : null);
  const [kind, setKind] = useState<"marketplace" | "food">("marketplace");
  const [form, setForm] = useState({ line: "", city: "Larache", postal_code: "92000", country: "MA", shipping: "standard", pay: "COD", last4: "4242", coupon: "" });
  const [msg, setMsg] = useState("");
  if (!signed) return <Empty text="Connectez-vous pour voir votre panier." />;
  if (loading) return <GridSkeleton n={3} h="h-24" />;
  if (error) return <ErrorBox msg={error} />;
  const want = kind === "marketplace" ? "product" : "meal";
  const rows = data.items.map((it: any, index: number) => ({ ...it, index })).filter((it: any) => it.kind === want);
  const sub = rows.reduce((s: number, r: any) => s + r.unit_price * r.qty, 0);
  const setQty = async (i: number, qty: number) => { await api(`/api/cart/${i}`, { method: "PUT", body: { qty } }); cartChanged(); reload(); };
  const checkout = async () => {
    setMsg("");
    try {
      const body: any = { kind, payment_method: form.pay, address: { line: form.line, city: form.city, postal_code: form.postal_code, country: form.country.toUpperCase() }, shipping_method: form.shipping };
      if (form.pay === "CARD_SIMULATED") body.card_last4 = form.last4;
      if (form.coupon) body.coupon = form.coupon;
      await api("/api/orders/checkout", { method: "POST", body });
      toast("✅ Commande passée !"); cartChanged(); router.push("/orders");
    } catch (e: any) { setMsg("⚠️ " + e.message); }
  };
  const f = (k: string) => ({ value: (form as any)[k], onChange: (e: any) => setForm({ ...form, [k]: e.target.value }) });
  return (
    <div className="space-y-4">
      <h1 className="section-title">Mon panier</h1>
      <div className="flex gap-2">
        <button className={kind === "marketplace" ? "btn-primary" : "btn-ghost"} onClick={() => setKind("marketplace")}>🛍️ Boutique</button>
        <button className={kind === "food" ? "btn-primary" : "btn-ghost"} onClick={() => setKind("food")}>🍽️ Repas</button>
      </div>
      {rows.length === 0 ? <Empty text="Ce panier est vide. Ajoutez des articles pour commencer." /> : (
        <div className="grid md:grid-cols-[1fr_340px] gap-6">
          <div className="space-y-2">
            {rows.map((r: any) => (
              <div key={r.index} className="card flex items-center gap-3">
                <span className="text-3xl">{r.emoji}</span>
                <div className="flex-1"><p className="font-semibold">{r.name}</p><p className="text-xs text-gray-500">{r.restaurant_name} {r.addons?.length ? "+ " + r.addons.join(", ") : ""}</p></div>
                <span>{mad(r.unit_price)}</span>
                <input type="number" min={0} className="input w-16" value={r.qty} onChange={(e) => setQty(r.index, +e.target.value)} aria-label="Quantité" />
              </div>
            ))}
            <p className="text-right font-bold">Sous-total : {mad(sub)}</p>
          </div>
          <div className="card space-y-3 h-fit lg:sticky lg:top-36">
            <h2 className="font-bold">Livraison & paiement</h2>
            <input className="input" placeholder="Adresse" {...f("line")} />
            <div className="flex gap-2"><input className="input" placeholder="Ville" {...f("city")} /><input className="input w-24" placeholder="CP" {...f("postal_code")} /></div>
            <input className="input" placeholder="Pays (code ISO : MA, FR…)" maxLength={2} {...f("country")} />
            {kind === "marketplace" && <select className="input" {...f("shipping")}><option value="standard">Standard</option><option value="express">Express</option></select>}
            <select className="input" {...f("pay")}><option value="COD">Paiement à la livraison</option><option value="CARD_SIMULATED">Carte (SIMULÉ)</option></select>
            {form.pay === "CARD_SIMULATED" && <input className="input" placeholder="4 derniers chiffres" maxLength={4} {...f("last4")} />}
            <input className="input" placeholder="Code promo (BIENVENUE10)" {...f("coupon")} />
            <p className="text-xs text-gray-500">Paiement simulé : aucune donnée de carte réelle ne doit être saisie.</p>
            {msg && <ErrorBox msg={msg} />}
            <button className="btn-accent w-full" onClick={checkout} disabled={!form.line}>Commander</button>
          </div>
        </div>
      )}
    </div>
  );
}
