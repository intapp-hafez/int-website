import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { projects as seedProjects } from "@/data/site";

export type Bilingual = { en: string; ar: string };
export type Project = {
  id: number;
  image: string;
  title: Bilingual;
  industry: string;
  desc: Bilingual;
  seo?: {
    metaTitle?: Bilingual;
    metaDescription?: Bilingual;
    keywords?: string;
    ogImage?: string;
    canonicalUrl?: string;
  };
};

const KEY = "it_projects_store";

type Ctx = {
  items: Project[];
  add: (p: Omit<Project, "id">) => Project;
  update: (id: number, patch: Partial<Project>) => void;
  remove: (id: number) => void;
  get: (id: number) => Project | undefined;
};

const ProjectsContext = createContext<Ctx | null>(null);

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Project[]>(seedProjects as Project[]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  const persist = (next: Project[]) => {
    setItems(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  };

  const add: Ctx["add"] = (p) => {
    const id = (items.reduce((m, x) => Math.max(m, x.id), 0) || 0) + 1;
    const next = [{ id, ...p }, ...items];
    persist(next);
    return next[0];
  };
  const update: Ctx["update"] = (id, patch) =>
    persist(items.map((x) => (x.id === id ? { ...x, ...patch, title: { ...x.title, ...(patch.title ?? {}) }, desc: { ...x.desc, ...(patch.desc ?? {}) } } : x)));
  const remove: Ctx["remove"] = (id) => persist(items.filter((x) => x.id !== id));
  const get: Ctx["get"] = (id) => items.find((x) => x.id === id);

  return <ProjectsContext.Provider value={{ items, add, update, remove, get }}>{children}</ProjectsContext.Provider>;
}

export function useProjects() {
  const ctx = useContext(ProjectsContext);
  if (!ctx) throw new Error("useProjects must be used within ProjectsProvider");
  return ctx;
}