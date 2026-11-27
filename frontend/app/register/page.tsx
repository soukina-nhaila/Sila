"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api, saveSession } from "@/lib/api";
import { ErrorBox } from "@/components/Cards";
import AuthShell from "@/components/AuthShell";

const schema = z.object({
  name: z.string().min(2, "Nom trop court"),
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "8 caractères minimum").regex(/[A-Za-z]/, "Au moins une lettre").regex(/\d/, "Au moins un chiffre"),
  role: z.enum(["CUSTOMER", "SELLER", "RESTAURANT_OWNER", "COURIER"]),
});
type F = z.infer<typeof schema>;
const ROLES = [["CUSTOMER", "🛒 Client"], ["SELLER", "🏪 Vendeur"], ["RESTAURANT_OWNER", "👨‍🍳 Restaurateur"], ["COURIER", "🛵 Livreur"]];

export default function Register() {
  const router = useRouter();
  const [err, setErr] = useState("");
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<F>({ resolver: zodResolver(schema), defaultValues: { role: "CUSTOMER" } });
  const role = watch("role");
  const onSubmit = async (v: F) => {
    try { const r = await api("/api/auth/register", { method: "POST", body: v }); saveSession(r.token, r.user); router.push(v.role === "CUSTOMER" ? "/" : "/dashboard"); }
    catch (e: any) { setErr(e.message); }
  };
  return (
    <AuthShell title="Créer un compte" subtitle="Rejoignez SILA en quelques secondes.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {err && <ErrorBox msg={err} />}
        <div className="grid grid-cols-2 gap-2">
          {ROLES.map(([v, l]) => (
            <label key={v} className={`cursor-pointer rounded-xl border px-3 py-2 text-sm font-semibold text-center ${role === v ? "border-brand bg-brand-light text-brand" : "border-brand/15"}`}>
              <input type="radio" value={v} className="sr-only" {...register("role")} />{l}
            </label>
          ))}
        </div>
        {(["name", "email", "password"] as const).map((f) => (
          <div key={f}><label className="text-sm font-semibold">{{ name: "Nom complet", email: "Email", password: "Mot de passe" }[f]}</label>
            <input className="input mt-1" type={f === "password" ? "password" : "text"} autoComplete={f === "password" ? "new-password" : f} {...register(f)} />
            {errors[f] && <p className="text-xs text-red-600 mt-1">{errors[f]?.message}</p>}</div>
        ))}
        <button className="btn-primary w-full !py-3" disabled={isSubmitting}>{isSubmitting ? "Création…" : "Créer mon compte"}</button>
        <p className="text-sm text-center">Déjà inscrit ? <Link href="/login" className="text-brand font-semibold underline">Se connecter</Link></p>
      </form>
    </AuthShell>
  );
}
