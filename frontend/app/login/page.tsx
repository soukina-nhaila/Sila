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

const schema = z.object({ email: z.string().email("Email invalide"), password: z.string().min(1, "Mot de passe requis") });
type F = z.infer<typeof schema>;

export default function Login() {
  const router = useRouter();
  const [err, setErr] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<F>({ resolver: zodResolver(schema) });
  const onSubmit = async (v: F) => {
    try { const r = await api("/api/auth/login", { method: "POST", body: v }); saveSession(r.token, r.user); router.push(r.user.role === "CUSTOMER" ? "/" : "/dashboard"); }
    catch (e: any) { setErr(e.message); }
  };
  return (
    <AuthShell title="Bon retour 👋" subtitle="Connectez-vous pour commander et suivre vos livraisons.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {err && <ErrorBox msg={err} />}
        <div><label className="text-sm font-semibold">Email</label><input className="input mt-1" autoComplete="email" {...register("email")} />{errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}</div>
        <div><label className="text-sm font-semibold">Mot de passe</label><input className="input mt-1" type="password" autoComplete="current-password" {...register("password")} />{errors.password && <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>}</div>
        <button className="btn-primary w-full !py-3" disabled={isSubmitting}>{isSubmitting ? "Connexion…" : "Se connecter"}</button>
        <p className="text-sm text-center">Nouveau sur SILA ? <Link href="/register" className="text-brand font-semibold underline">Créer un compte</Link></p>
      </form>
    </AuthShell>
  );
}
