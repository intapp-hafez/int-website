export type IndustryItem = {
  id: string;
  slug: string;
  title_en: string;
  title_ar: string;
  image: string;
  description_en?: string;
  description_ar?: string;
  active: boolean;
  sort_order: number;
};

// The table is not in generated types until the database setup is applied.
export function createIndustriesRepository(db: any) {
  return {
    async list(): Promise<IndustryItem[]> {
      const { data, error } = await db.from("industries").select("*").order("sort_order", { ascending: true }).order("id", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    async save(item: Partial<IndustryItem>, count: number): Promise<IndustryItem> {
      const title_en = item.title_en?.trim() ?? "";
      const title_ar = item.title_ar?.trim() ?? "";
      if (!title_en && !title_ar) throw new Error("Enter a title (EN or AR)");
      if (item.image?.startsWith("blob:")) throw new Error("Wait for the image upload to finish or choose another image.");
      const slug = (item.slug || title_en).toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || `industry-${crypto.randomUUID()}`;
      const payload = { slug, title_en, title_ar, image: item.image ?? "", description_en: item.description_en ?? "", description_ar: item.description_ar ?? "", active: item.active ?? true, sort_order: item.sort_order ?? count };
      const query = item.id
        ? db.from("industries").update(payload).eq("id", item.id)
        : db.from("industries").insert(payload);
      const { data, error } = await query.select().single();
      if (error) throw error;
      if (!data) throw new Error("Industry was not saved. Please retry.");
      return data;
    },
    async remove(id: string): Promise<void> {
      const { data, error } = await db.from("industries").delete().eq("id", id).select("id").single();
      if (error) throw error;
      if (!data) throw new Error("Industry was not removed. Please retry.");
    },
    async move(items: IndustryItem[], id: string, dir: -1 | 1): Promise<void> {
      const sorted = [...items].sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id));
      const index = sorted.findIndex((item) => item.id === id);
      const current = sorted[index];
      const neighbor = sorted[index + dir];
      if (!current || !neighbor) return;
      // Update existing records, never insert partial rows containing only an ID.
      for (const item of [current, neighbor]) {
        const order = item.id === current.id ? index + dir : index;
        const { data, error } = await db.from("industries").update({ sort_order: order }).eq("id", item.id).select("id").single();
        if (error) throw error;
        if (!data) throw new Error("Industry order was not saved. Please retry.");
      }
    },
  };
}