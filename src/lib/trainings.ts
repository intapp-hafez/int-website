import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export type TrainingKind = "training" | "event";

export type RegistrationStatus = "pending" | "approved" | "rejected" | "completed";

export const REGISTRATION_STATUS: Record<RegistrationStatus, { en: string; ar: string }> = {
  pending: { en: "Pending approval", ar: "قيد المراجعة" },
  approved: { en: "Approved", ar: "معتمد" },
  rejected: { en: "Rejected", ar: "مرفوض" },
  completed: { en: "Completed", ar: "مكتمل" },
};

export type TrainingRow = {
  id: string;
  kind: TrainingKind;
  title_en: string;
  title_ar: string;
  details_en: string;
  details_ar: string;
  benefits_en: string;
  benefits_ar: string;
  trainer: string;
  trainer_email?: string;
  notify_emails?: string;
  start_date: string | null;
  end_date: string | null;
  location: string;
  banner_url: string;
  active: boolean;
  sort_order: number;
  created_at?: string;
};

export type TrainingRegistration = {
  id: string;
  training_id: string;
  full_name: string;
  gender: string;
  email: string;
  phone: string;
  education_field: string;
  city: string;
  district: string;
  status: RegistrationStatus | string;
  approved_at?: string | null;
  completed_at?: string | null;
  certificate_no?: string | null;
  admin_note?: string | null;
  created_at?: string;
};

export const emptyTraining: Omit<TrainingRow, "id"> = {
  kind: "training",
  title_en: "",
  title_ar: "",
  details_en: "",
  details_ar: "",
  benefits_en: "",
  benefits_ar: "",
  trainer: "",
  trainer_email: "",
  notify_emails: "",
  start_date: null,
  end_date: null,
  location: "",
  banner_url: "",
  active: true,
  sort_order: 0,
};


/** Public/admin list of trainings. Pass a kind to filter, or omit for all. */
export function useTrainings(kind?: TrainingKind, activeOnly = false) {
  const [items, setItems] = useState<TrainingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      let q = db.from("trainings").select("*").order("sort_order", { ascending: true }).order("start_date", { ascending: true });
      if (kind) q = q.eq("kind", kind);
      if (activeOnly) q = q.eq("active", true);
      const { data, error } = await q;
      if (error) setError(error.message);
      else {
        setItems((data ?? []) as TrainingRow[]);
        setError(null);
      }
    } catch (e: any) {
      setError(e?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [kind, activeOnly]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { items, loading, error, refresh };
}

export async function saveTraining(row: Partial<TrainingRow> & { id?: string }) {
  const payload: any = { ...row };
  if (!payload.start_date) payload.start_date = null;
  if (!payload.end_date) payload.end_date = null;
  const { data, error } = await db.from("trainings").upsert(payload).select().single();
  if (error) throw new Error(error.message);
  return data as TrainingRow;
}

export async function deleteTraining(id: string) {
  const { error } = await db.from("trainings").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** Public registration — always created as `pending` until an admin approves it. */
export async function registerForTraining(
  input: Omit<TrainingRegistration, "id" | "status" | "created_at">,
): Promise<string | null> {
  const { data, error } = await db
    .from("training_registrations")
    .insert({ ...input, status: "pending" })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return (data as any)?.id ?? null;
}

function certificateNo() {
  const yr = new Date().getFullYear();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `CERT-${yr}-${rand}`;
}

/** Admin approval workflow transitions. */
export async function setRegistrationStatus(
  id: string,
  status: RegistrationStatus,
  note?: string,
): Promise<TrainingRegistration> {
  const patch: Record<string, unknown> = { status };
  if (note !== undefined) patch.admin_note = note;
  if (status === "approved") {
    patch.approved_at = new Date().toISOString();
    patch.completed_at = null;
  }
  if (status === "pending" || status === "rejected") {
    patch.approved_at = status === "rejected" ? new Date().toISOString() : null;
    patch.completed_at = null;
  }
  if (status === "completed") {
    patch.completed_at = new Date().toISOString();
    patch.certificate_no = certificateNo();
  }
  const { data, error } = await db.from("training_registrations").update(patch).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  return data as TrainingRegistration;
}


export function useRegistrations(trainingId?: string) {
  const [items, setItems] = useState<TrainingRegistration[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      let q = db.from("training_registrations").select("*").order("created_at", { ascending: false });
      if (trainingId) q = q.eq("training_id", trainingId);
      const { data } = await q;
      setItems((data ?? []) as TrainingRegistration[]);
    } finally {
      setLoading(false);
    }
  }, [trainingId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { items, loading, refresh };
}

export async function deleteRegistration(id: string) {
  const { error } = await db.from("training_registrations").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
