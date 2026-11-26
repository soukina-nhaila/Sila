"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api, saveSession } from "@/lib/api";
import { ErrorBox } from "@/components/Cards";

const schema = z.object({ email: z.string().email("Email invalide"), password: z.string().min(1, "Requis") });
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
    <form onSubmit={handleSubmit(onSubmit)} className="card max-w-md mx-auto space-y-3">
      <h1 className="text-xl font-bold">Connexion</h1>
      {err && <ErrorBox msg={err} />}
      <div><input className="input" placeholder="Email" {...register("email")} />{errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}</div>
      <div><input className="input" type="password" placeholder="Mot de passe" {...register("password")} /></div>
      <button className="btn-primary w-full" disabled={isSubmitting}>Se connecter</button>
      <p className="text-sm">Pas de compte ? <Link href="/register" className="text-brand underline">Inscription</Link></p>
      <p className="text-xs text-gray-500">Comptes de démo : customer@sila.test, seller@sila.test, owner@sila.test, courier@sila.test, admin@sila.test — mot de passe <code>Sila@2026</code></p>
    </form>
  );
}
