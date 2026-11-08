import { beforeEach, describe, expect, it, vi } from "vitest";

const { insert, single } = vi.hoisted(() => ({ insert: vi.fn(), single: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: () => ({ insert }) } }));
import { createProductCategory } from "./product-categories";

describe("category persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    insert.mockReturnValue({ select: () => ({ single }) });
  });

  it("returns the database row after saving trimmed bilingual names", async () => {
    const row = { id: "saved-category", name_en: "Networking", name_ar: "الشبكات" };
    single.mockResolvedValue({ data: row, error: null });
    expect(await createProductCategory(" Networking ", " الشبكات ")).toEqual(row);
    expect(insert).toHaveBeenCalledWith({ name_en: "Networking", name_ar: "الشبكات" });
  });

  it("does not report a rejected database write as saved", async () => {
    single.mockResolvedValue({ data: null, error: { message: "Permission denied" } });
    await expect(createProductCategory("Networking", "الشبكات")).rejects.toThrow("Permission denied");
  });

  it("rejects missing bilingual names before writing", async () => {
    await expect(createProductCategory("Networking", " ")).rejects.toThrow("Enter both");
    expect(insert).not.toHaveBeenCalled();
  });
});