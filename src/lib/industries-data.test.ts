import { describe, expect, it, vi } from "vitest";
import { createIndustriesRepository, type IndustryItem } from "./industries-data";

function database(result: { data: unknown; error: unknown }) {
  const builder: any = {};
  for (const name of ["select", "order", "insert", "update", "delete", "eq"]) builder[name] = vi.fn(() => builder);
  builder.single = vi.fn(async () => result);
  builder.then = (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve);
  return { builder, from: vi.fn(() => builder) };
}
const item: IndustryItem = { id: "a", slug: "telecom", title_en: "Telecom", title_ar: "", image: "", active: true, sort_order: 0 };

describe("industry database operations", () => {
  it("returns an empty database list without restoring sample entries", async () => {
    expect(await createIndustriesRepository(database({ data: [], error: null })).list()).toEqual([]);
  });
  it("reports missing database storage", async () => {
    await expect(createIndustriesRepository(database({ data: null, error: new Error("missing table") })).list()).rejects.toThrow("missing table");
  });
  it("returns the record confirmed by the database on create", async () => {
    const db = database({ data: item, error: null });
    expect(await createIndustriesRepository(db).save({ title_en: "Telecom" }, 0)).toEqual(item);
    expect(db.builder.insert).toHaveBeenCalledWith(expect.objectContaining({ slug: "telecom", title_en: "Telecom" }));
  });
  it("does not turn a rejected save into local success", async () => {
    await expect(createIndustriesRepository(database({ data: null, error: new Error("denied") })).save(item, 1)).rejects.toThrow("denied");
  });
  it("updates the existing record without inserting it", async () => {
    const db = database({ data: { ...item, active: false }, error: null });
    await createIndustriesRepository(db).save({ ...item, active: false }, 1);
    expect(db.builder.update).toHaveBeenCalledWith(expect.objectContaining({ active: false }));
    expect(db.builder.eq).toHaveBeenCalledWith("id", "a");
    expect(db.builder.insert).not.toHaveBeenCalled();
  });
  it("requires confirmation of deletion", async () => {
    await expect(createIndustriesRepository(database({ data: null, error: null })).remove("a")).rejects.toThrow("not removed");
  });
  it("reorders with updates rather than partial-row inserts", async () => {
    const db = database({ data: { id: "a" }, error: null });
    await createIndustriesRepository(db).move([item, { ...item, id: "b", sort_order: 1 }], "a", 1);
    expect(db.builder.update.mock.calls).toEqual([[{ sort_order: 1 }], [{ sort_order: 0 }]]);
    expect(db.builder.insert).not.toHaveBeenCalled();
  });
  it("rejects temporary upload URLs before saving", async () => {
    const db = database({ data: item, error: null });
    await expect(createIndustriesRepository(db).save({ ...item, image: "blob:unfinished" }, 1)).rejects.toThrow("upload");
    expect(db.from).not.toHaveBeenCalled();
  });
});