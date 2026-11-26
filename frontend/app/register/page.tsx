"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api, saveSession } from "@/lib/api";
import { ErrorBox } from "@/components/Cards";

const schema = z.object({
  name: z.string().min(2, "Nom trop court"),
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "8 caractères minimum").regex(/[A-Za-z]/, "Au moins une lettre").regex(/\d/, "Au moins un chiffre"),
  role: z.enum(["CUSTOMER", "SELLER", "RESTAURANT_OWNER", "COURIER"]),
});
type F = z.infer<typeof schema>;

export default function Register() {
  const router = useRouter();
  const [err, setErr] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<F>({ resolver: zodResolver(schema), defaultValues: { role: "CUSTOMER" } });
  const onSubmit = async (v: F) => {
    try { const r = await api("/api/auth/register", { method: "POST", body: v }); saveSession(r.token, r.user); router.push(v.role === "CUSTOMER" ? "/" : "/dashboard"); }
    catch (e: any) { setErr(e.message); }
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card max-w-md mx-auto space-y-3">
      <h1 className="text-xl font-bold">Créer un compte</h1>
      {err && <ErrorBox msg={err} />}
      {(["name", "email", "password"] as const).map((f) => (
        <div key={f}><input className="input" type={f === "password" ? "password" : "text"} placeholder={{ name: "Nom complet", email: "Email", password: "Mot de passe" }[f]} {...register(f)} />
          {errors[f] && <p className="text-xs text-red-600">{errors[f]?.message}</p>}</div>
      ))}
      <select className="input" {...register("role")}>
        <option value="CUSTOMER">Client</option><option value="SELLER">Vendeur</option>
        <option value="RESTAURANT_OWNER">Propriétaire de restaurant</option><option value="COURIER">Livreur</option>
      </select>
      <button className="btn-primary w-full" disabled={isSubmitting}>S&apos;inscrire</button>
    </form>
  );
}
