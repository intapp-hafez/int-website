import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type AccessRequestStatus = "pending" | "approved" | "denied";

export type AccessRequest = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  pageKey: string;
  actions: string[];
  reason: string;
  status: AccessRequestStatus;
  createdAt: string;
  decidedAt?: string;
  decidedBy?: string;
  decisionNote?: string;
  /** Days the approval is valid for. null/undefined = permanent. */
  durationDays?: number | null;
  /** Absolute expiry stamped at approval time. */
  expiresAt?: string | null;
};

type Ctx = {
  requests: AccessRequest[];
  createRequest: (
    input: Omit<AccessRequest, "id" | "status" | "createdAt" | "decidedAt" | "decidedBy" | "decisionNote" | "expiresAt">,
  ) => AccessRequest;
  decide: (
    id: string,
    status: Exclude<AccessRequestStatus, "pending">,
    by: string,
    note?: string,
    expiresAt?: string | null,
  ) => AccessRequest | null;
  removeRequest: (id: string) => void;
};

const KEY = "it_access_requests_v1";
const RequestsContext = createContext<Ctx | null>(null);

function load(): AccessRequest[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AccessRequest[]) : [];
  } catch {
    return [];
  }
}

export function AccessRequestsProvider({ children }: { children: ReactNode }) {
  const [requests, setRequests] = useState<AccessRequest[]>(() => load());

  const persist = (next: AccessRequest[]) => {
    setRequests(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  };

  const createRequest: Ctx["createRequest"] = (input) => {
    const req: AccessRequest = {
      ...input,
      id: `AR-${Date.now()}`,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    persist([req, ...requests]);
    return req;
  };

  const decide: Ctx["decide"] = (id, status, by, note, expiresAt) => {
    const idx = requests.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    const updated: AccessRequest = {
      ...requests[idx],
      status,
      decidedAt: new Date().toISOString(),
      decidedBy: by,
      decisionNote: note,
      expiresAt: status === "approved" ? (expiresAt ?? null) : null,
    };
    const next = [...requests];
    next[idx] = updated;
    persist(next);
    return updated;
  };

  const removeRequest: Ctx["removeRequest"] = (id) => persist(requests.filter((r) => r.id !== id));

  const value = useMemo<Ctx>(() => ({ requests, createRequest, decide, removeRequest }), [requests]);
  return <RequestsContext.Provider value={value}>{children}</RequestsContext.Provider>;
}

export function useAccessRequests() {
  const ctx = useContext(RequestsContext);
  if (!ctx) throw new Error("useAccessRequests must be used within AccessRequestsProvider");
  return ctx;
}