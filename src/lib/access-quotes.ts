import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export type AccessQuote = {
  id: string;
  request_id: string;
  amount: number;
  currency: string;
  note: string;
  status: "draft" | "sent" | "accepted" | "declined" | string;
  created_at?: string;
};

/**
 * Price quotes attached to access requests.
 * Degrades quietly when `access_quotes` has not been created yet
 * (see supabase/schema/29_access_quotes.sql).
 */
export function useAccessQuotes() {
  const [quotes, setQuotes] = useState<Record<string, AccessQuote>>({});
  const [available, setAvailable] = useState(true);

  const refresh = useCallback(async () => {
    const { data, error } = await db
      .from("access_quotes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      setAvailable(false);
      return;
    }
    setAvailable(true);
    const map: Record<string, AccessQuote> = {};
    for (const q of (data ?? []) as AccessQuote[]) {
      if (!map[q.request_id]) map[q.request_id] = q;
    }
    setQuotes(map);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const saveQuote = useCallback(
    async (input: { requestId: string; amount: number; currency: string; note?: string; status?: string }) => {
      const existing = quotes[input.requestId];
      const payload = {
        request_id: input.requestId,
        amount: input.amount,
        currency: input.currency || "EGP",
        note: input.note ?? "",
        status: input.status ?? "sent",
      };
      const q = existing
        ? await db.from("access_quotes").update(payload).eq("id", existing.id).select().single()
        : await db.from("access_quotes").insert(payload).select().single();
      if (q.error) throw new Error(q.error.message);
      setQuotes((p) => ({ ...p, [input.requestId]: q.data as AccessQuote }));
      return q.data as AccessQuote;
    },
    [quotes],
  );

  return { quotes, available, refresh, saveQuote };
}
