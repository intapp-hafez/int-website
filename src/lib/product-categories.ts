import { supabase } from "@/integrations/supabase/client";

export type ProductCategory = { id: string; name_en: string; name_ar: string };

export async function createProductCategory(nameEn: string, nameAr: string): Promise<ProductCategory> {
  const name_en = nameEn.trim();
  const name_ar = nameAr.trim();
  if (!name_en || !name_ar) throw new Error("Enter both English and Arabic category names.");
  const { data, error } = await supabase.from("product_categories")
    .insert({ name_en, name_ar }).select("id, name_en, name_ar").single();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("The category could not be saved. Please try again.");
  return data;
}