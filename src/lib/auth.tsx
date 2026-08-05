import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

import { demoUsers } from "@/data/demo";

export type Role = "admin" | "manager" | "agent" | "seo" | "technician" | "client";
export type AuthUser = { email: string; role: Role; name?: string };

type Ctx = {
  user: AuthUser | null;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  signOut: () => void;
};

const AuthContext = createContext<Ctx | null>(null);
const STORAGE_KEY = "it_auth_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw) as AuthUser);
    } catch {}
    setReady(true);
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!email || !password) throw new Error("Email and password required");
    // Best-effort real Supabase sign-in so admin server-side checks (e.g. About
    // content saves and hero-image uploads) work. Falls back to demo session
    // if no matching Supabase user exists yet.
    const matchedDemo = demoUsers.find((d) => d.email.toLowerCase() === email.toLowerCase());
    let role: Role = matchedDemo ? matchedDemo.role : (/admin/i.test(email) ? "admin" : "client");
    let name = matchedDemo?.name || email.split("@")[0];

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error && data.user) {
        const { data: roleRow } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id)
          .maybeSingle();
        if (roleRow?.role) {
          role = roleRow.role as Role;
        }
      }
    } catch {
      // ignore — demo session still works for navigation
    }
    const u: AuthUser = { email, role, name };
    setUser(u);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(u)); } catch {}
    return u;
  };

  const signOut = () => {
    setUser(null);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    void supabase.auth.signOut().catch(() => {});
  };

  return <AuthContext.Provider value={{ user, ready, signIn, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}