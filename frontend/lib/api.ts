export const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type User = { id: string; email: string; name: string; role: string };

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("sila_token");
}
export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem("sila_user") || "null"); } catch { return null; }
}
export function saveSession(token: string, user: User) {
  localStorage.setItem("sila_token", token);
  localStorage.setItem("sila_user", JSON.stringify(user));
  window.dispatchEvent(new Event("sila-auth"));
}
export function logout() {
  localStorage.removeItem("sila_token");
  localStorage.removeItem("sila_user");
  window.dispatchEvent(new Event("sila-auth"));
}

export async function api<T = any>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const t = getToken();
  if (t) headers.Authorization = `Bearer ${t}`;
  let res: Response;
  try {
    res = await fetch(`${API}${path}`, { method: opts.method || "GET", headers, body: opts.body ? JSON.stringify(opts.body) : undefined });
  } catch {
    throw new Error("Impossible de joindre l'API. Le backend est-il démarré sur " + API + " ?");
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const d = (data as any).detail;
    throw new Error(typeof d === "string" ? d : Array.isArray(d) ? d.map((x: any) => x.msg).join(", ") : "Erreur " + res.status);
  }
  return data as T;
}

export const mad = (n: number) => `${n.toFixed(2)} MAD`;
