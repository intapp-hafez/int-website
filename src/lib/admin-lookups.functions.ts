import { supabase } from "@/integrations/supabase/client";

export type SysLocation = {
  id: string;
  country_en: string;
  country_ar: string;
  city_en: string;
  city_ar: string;
  is_active: boolean;
};

export type SysNationality = {
  id: string;
  name_en: string;
  name_ar: string;
  is_active: boolean;
};

export async function listLocations() {
  const { data, error } = await (supabase as any).from("sys_locations").select("*").order("country_en", { ascending: true }).order("city_en", { ascending: true });
  if (error) throw error;
  return data as SysLocation[];
}

export async function saveLocation(loc: Partial<SysLocation>) {
  if (loc.id && !loc.id.startsWith("new")) {
    const { data, error } = await (supabase as any).from("sys_locations").update(loc).eq("id", loc.id).select().single();
    if (error) throw error;
    return data as SysLocation;
  } else {
    const { id, ...rest } = loc;
    const { data, error } = await (supabase as any).from("sys_locations").insert([rest]).select().single();
    if (error) throw error;
    return data as SysLocation;
  }
}

export async function deleteLocation(id: string) {
  const { error } = await (supabase as any).from("sys_locations").delete().eq("id", id);
  if (error) throw error;
}

export async function bulkSaveLocations(locs: Partial<SysLocation>[]) {
  const { data, error } = await (supabase as any).from("sys_locations").insert(locs).select();
  if (error) throw error;
  return data as SysLocation[];
}

export async function listNationalities() {
  const { data, error } = await (supabase as any).from("sys_nationalities").select("*").order("name_en", { ascending: true });
  if (error) throw error;
  return data as SysNationality[];
}

export async function saveNationality(nat: Partial<SysNationality>) {
  if (nat.id && !nat.id.startsWith("new")) {
    const { data, error } = await (supabase as any).from("sys_nationalities").update(nat).eq("id", nat.id).select().single();
    if (error) throw error;
    return data as SysNationality;
  } else {
    const { id, ...rest } = nat;
    const { data, error } = await (supabase as any).from("sys_nationalities").insert([rest]).select().single();
    if (error) throw error;
    return data as SysNationality;
  }
}

export async function deleteNationality(id: string) {
  const { error } = await (supabase as any).from("sys_nationalities").delete().eq("id", id);
  if (error) throw error;
}

export async function bulkSaveNationalities(nats: Partial<SysNationality>[]) {
  const { data, error } = await (supabase as any).from("sys_nationalities").insert(nats).select();
  if (error) throw error;
  return data as SysNationality[];
}
