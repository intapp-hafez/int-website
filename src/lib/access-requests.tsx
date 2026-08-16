import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AccessRequestStatus = "pending" | "approved" | "denied" | "revoked";

export type AccessRequest = {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  page_key: string;
  actions: string[];
  reason: string;
  status: AccessRequestStatus;
  requested_days?: number | null;
  decision_note?: string;
  decided_by?: string;
  decided_at?: string;
  expires_at?: string | null;
  created_at: string;
  updated_at: string;
};

// Aliased to keep compatibility with existing components if needed
export type LegacyAccessRequest = Omit<AccessRequest, "user_id" | "user_name" | "user_email" | "page_key" | "created_at" | "decided_at" | "decided_by" | "decision_note" | "expires_at"> & {
  userId: string;
  userName: string;
  userEmail: string;
  pageKey: string;
  createdAt: string;
  decidedAt?: string;
  decidedBy?: string;
  decisionNote?: string;
  durationDays?: number | null;
  expiresAt?: string | null;
};

// Helper to map DB to legacy if components haven't been updated
const mapToLegacy = (r: AccessRequest): LegacyAccessRequest => ({
  ...r,
  userId: r.user_id,
  userName: r.user_name,
  userEmail: r.user_email,
  pageKey: r.page_key,
  createdAt: r.created_at,
  decidedAt: r.decided_at,
  decidedBy: r.decided_by,
  decisionNote: r.decision_note,
  durationDays: r.requested_days,
  expiresAt: r.expires_at,
});

const db = supabase as any;

type Ctx = {
  requests: LegacyAccessRequest[];
  createRequest: (
    input: { userId: string; userName: string; userEmail: string; pageKey: string; actions: string[]; reason: string; durationDays?: number | null; }
  ) => Promise<LegacyAccessRequest | null>;
  decide: (
    id: string,
    status: Exclude<AccessRequestStatus, "pending">,
    by: string,
    note?: string,
    expiresAt?: string | null,
  ) => Promise<LegacyAccessRequest | null>;
  removeRequest: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const RequestsContext = createContext<Ctx | null>(null);

export function AccessRequestsProvider({ children }: { children: ReactNode }) {
  const [requests, setRequests] = useState<LegacyAccessRequest[]>([]);

  const refresh = async () => {
    const { data, error } = await db
      .from("access_requests")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("[access-requests] load failed", error);
      return;
    }
    
    setRequests((data as AccessRequest[]).map(mapToLegacy));
  };

  useEffect(() => {
    void refresh();
    
    const channel = supabase
      .channel('access_requests_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'access_requests' }, () => {
        void refresh();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const createRequest: Ctx["createRequest"] = async (input) => {
    const { data, error } = await db
      .from("access_requests")
      .insert({
        user_id: input.userId,
        user_name: input.userName,
        user_email: input.userEmail,
        page_key: input.pageKey,
        actions: input.actions,
        reason: input.reason,
        requested_days: input.durationDays,
      })
      .select()
      .single();

    if (error) {
      console.error("[access-requests] create failed", error);
      return null;
    }
    return mapToLegacy(data as AccessRequest);
  };

  const decide: Ctx["decide"] = async (id, status, by, note, expiresAt) => {
    const { data, error } = await db
      .from("access_requests")
      .update({
        status,
        decided_by: by,
        decision_note: note,
        expires_at: expiresAt,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[access-requests] decide failed", error);
      return null;
    }
    return mapToLegacy(data as AccessRequest);
  };

  const removeRequest: Ctx["removeRequest"] = async (id) => {
    const { error } = await db.from("access_requests").delete().eq("id", id);
    if (error) {
      console.error("[access-requests] remove failed", error);
    }
  };

  const value = useMemo<Ctx>(() => ({ requests, createRequest, decide, removeRequest, refresh }), [requests]);
  return <RequestsContext.Provider value={value}>{children}</RequestsContext.Provider>;
}

export function useAccessRequests() {
  const ctx = useContext(RequestsContext);
  if (!ctx) throw new Error("useAccessRequests must be used within AccessRequestsProvider");
  return ctx;
}