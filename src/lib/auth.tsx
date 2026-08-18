import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Role = "admin" | "manager" | "agent" | "seo" | "technician" | "client";
export type AuthUser = { id: string; email: string; role: Role; name?: string; user_metadata?: Record<string, any> };

type Ctx = {
  user: AuthUser | null;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  // Helper to fetch user's actual database role
  const fetchUserRole = async (userId: string): Promise<Role> => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      if (!error && data?.role) {
        const r = String(data.role).toLowerCase();
        if (["client", "client_user", "user"].includes(r)) {
          return "client";
        }
        return r as Role;
      }
    } catch (err) {
      console.warn("[auth] failed to query user_roles", err);
    }
    return "client";
  };

  useEffect(() => {
    // 1. Initial Session Check
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session?.user) {
          setUser(null);
        } else {
          const role = await fetchUserRole(session.user.id);
          setUser({
            id: session.user.id,
            email: session.user.email ?? "",
            role,
            name: session.user.user_metadata?.name || session.user.email?.split("@")[0] || "User",
          });
        }
      } catch (e) {
        console.error("[auth] initialization error", e);
        setUser(null);
      } finally {
        setReady(true);
      }
    };

    void initAuth();

    // 2. Real-time Auth State Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const role = await fetchUserRole(session.user.id);
        setUser({
          id: session.user.id,
          email: session.user.email ?? "",
          role,
          name: session.user.user_metadata?.name || session.user.email?.split("@")[0] || "User",
        });
      } else {
        setUser(null);
      }
      setReady(true);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<AuthUser> => {
    if (!email || !password) throw new Error("Email and password required");

    // Real Supabase Authentication only — no demo/mock fallback
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      throw new Error(error.message || "Invalid credentials");
    }
    if (!data.user) {
      throw new Error("No user returned from authentication");
    }

    const role = await fetchUserRole(data.user.id);
    const authUser: AuthUser = {
      id: data.user.id,
      email: data.user.email ?? email,
      role,
      name: data.user.user_metadata?.name || data.user.email?.split("@")[0] || "User",
    };

    setUser(authUser);
    return authUser;
  };

  const signOut = async () => {
    setUser(null);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("[auth] signOut error", err);
    }
  };

  return <AuthContext.Provider value={{ user, ready, signIn, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}