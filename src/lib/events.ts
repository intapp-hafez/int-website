import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export type EventPartner = {
  id: string;
  name: string;
  tier: string;
  logo_url: string;
};

export type EventSpeaker = {
  id: string;
  name: string;
  role: string;
  company: string;
};

export type EventAgendaItem = {
  id: string;
  time: string;
  description: string;
};

export type EventRow = {
  id: string;
  title: string;
  category: string;
  status: string;
  capacity: number;
  summary: string;
  start_date: string | null;
  end_date: string | null;
  start_time: string;
  end_time: string;
  city: string;
  venue: string;
  map_url: string;
  banner_url: string;
  partners: EventPartner[];
  speakers: EventSpeaker[];
  agenda: EventAgendaItem[];
  active: boolean;
  sort_order: number;
  created_at?: string;
};

export type EventRegistration = {
  id: string;
  event_id: string;
  full_name: string;
  gender: string;
  email: string;
  phone: string;
  education_field: string;
  city: string;
  district: string;
  organization: string;
  job_title: string;
  number_of_representatives: number;
  dates_to_attend: string;
  sector: string;
  willing_to_travel: string;
  transportation_requirement: string;
  check_in_details: string;
  check_out_details: string;
  special_requests: string;
  status: string;
  created_at?: string;
};

export const emptyEvent: Omit<EventRow, "id"> = {
  title: "",
  category: "Summit",
  status: "Registration Open",
  capacity: 0,
  summary: "",
  start_date: null,
  end_date: null,
  start_time: "",
  end_time: "",
  city: "",
  venue: "",
  map_url: "",
  banner_url: "",
  partners: [],
  speakers: [],
  agenda: [],
  active: true,
  sort_order: 0,
};

export function useEvents(activeOnly = false) {
  const [items, setItems] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      let q = db.from("events").select("*").order("sort_order", { ascending: true }).order("start_date", { ascending: true });
      if (activeOnly) q = q.eq("active", true);
      const { data, error } = await q;
      if (error) setError(error.message);
      else {
        setItems((data ?? []) as EventRow[]);
        setError(null);
      }
    } catch (e: any) {
      setError(e?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [activeOnly]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { items, loading, error, refresh };
}

export async function saveEvent(row: Partial<EventRow> & { id?: string }) {
  const payload: any = { ...row };
  if (!payload.start_date) payload.start_date = null;
  if (!payload.end_date) payload.end_date = null;
  const { data, error } = await db.from("events").upsert(payload).select().single();
  if (error) throw new Error(error.message);
  return data as EventRow;
}

export async function deleteEvent(id: string) {
  const { error } = await db.from("events").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function registerForEvent(input: Omit<EventRegistration, "id" | "status" | "created_at">) {
  const { error } = await db.from("event_registrations").insert({ ...input, status: "new" });
  if (error) throw new Error(error.message);
}

export function useEventRegistrations(eventId?: string) {
  const [items, setItems] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      let q = db.from("event_registrations").select("*").order("created_at", { ascending: false });
      if (eventId) q = q.eq("event_id", eventId);
      const { data } = await q;
      setItems((data ?? []) as EventRegistration[]);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { items, loading, refresh };
}

export async function deleteEventRegistration(id: string) {
  const { error } = await db.from("event_registrations").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
