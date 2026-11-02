import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { createIndustriesRepository, type IndustryItem } from "./industries-data";
export type { IndustryItem } from "./industries-data";

type Ctx = {
  industries: IndustryItem[];
  loading: boolean;
  error: string | null;
  upsert: (item: Partial<IndustryItem> & { id?: string }) => Promise<IndustryItem | null>;
  remove: (id: string) => Promise<void>;
  move: (id: string, dir: -1 | 1) => Promise<void>;
  refresh: () => Promise<void>;
};

const IndustriesContext = createContext<Ctx | null>(null);

const repository = createIndustriesRepository(supabase);

export function IndustriesProvider({ children }: { children: ReactNode }) {
  const [industries, setIndustries] = useState<IndustryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      setIndustries(await repository.list());
      setError(null);
    } catch (err) {
      setIndustries([]);
      const message = err && typeof err === "object" && "message" in err ? String(err.message) : "Could not load industries.";
      setError(message.includes("schema cache") ? "Industries are unavailable. The industry database setup has not been completed." : message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();

    const channel = supabase
      .channel(`industries_changes_${crypto.randomUUID()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "industries" }, () => {
        void refresh();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const upsert: Ctx["upsert"] = async (item) => {
    const saved = await repository.save(item, industries.length);
    await refresh();
    return saved;
  };

  const remove: Ctx["remove"] = async (id) => {
    await repository.remove(id);
    await refresh();
  };

  const move: Ctx["move"] = async (id, dir) => {
    try {
      await repository.move(industries, id, dir);
    } finally {
      await refresh();
    }
  };

  return (
    <IndustriesContext.Provider value={{ industries, loading, error, upsert, remove, move, refresh }}>
      {children}
    </IndustriesContext.Provider>
  );
}

export function useIndustries() {
  const ctx = useContext(IndustriesContext);
  if (!ctx) throw new Error("useIndustries must be used within IndustriesProvider");
  return ctx;
}
