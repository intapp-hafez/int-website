import { createFileRoute } from "@tanstack/react-router";
import { useCurrentPagePerms } from "@/components/admin/Can";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { usePartners, type PartnerRow } from "@/lib/partners-store";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Plus, Loader2, Upload, ImageIcon, ArrowUp, ArrowDown, Star, ChevronDown, ChevronUp, FileText } from "lucide-react";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard/admin/partners")({
  head: () => ({ meta: [{ title: "Partners — Admin" }] }),
  component: PartnersAdminPage,
});

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml", "image/gif"];
const MAX_BYTES = 5 * 1024 * 1024;

function validateImage(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) return "Unsupported format. Use PNG, JPG, WEBP, SVG or GIF.";
  if (file.size > MAX_BYTES) return `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max 5 MB.`;
  return null;
}

async function uploadLogo(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `partners/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("slide-images")
    .upload(path, file, { cacheControl: "31536000", upsert: false, contentType: file.type });
  if (error) throw error;
  const { data } = supabase.storage.from("slide-images").getPublicUrl(path);
  return data.publicUrl;
}

function PartnersAdminPage() {
  const _perms = useCurrentPagePerms();
  const { partners, loading, upsert, remove, move } = usePartners();
  const sorted = [...partners].sort((a, b) => a.sort_order - b.sort_order);
  const [saving, setSaving] = useState(false);
  const emptyDraft = { name_en: "", name_ar: "", description_en: "", description_ar: "", logo: "", href: "", active: true, sort_order: 0 };
  const [draft, setDraft] = useState(emptyDraft);
  const [uploading, setUploading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("list");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleDraftUpload = async (file: File | null) => {
    if (!file) return;
    const err = validateImage(file);
    if (err) return toast.error(err);
    // Instant local preview
    const localPreview = URL.createObjectURL(file);
    setDraft((d) => ({ ...d, logo: localPreview }));
    setUploading("draft");
    try {
      const url = await uploadLogo(file);
      setDraft((d) => ({ ...d, logo: url }));
      toast.success("Logo uploaded");
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed. Admin role required.");
    } finally {
      setUploading(null);
      // Revoke after upload completes; url swap replaces preview
      setTimeout(() => URL.revokeObjectURL(localPreview), 2000);
    }
  };

  const handleReplace = async (p: PartnerRow, file: File | null) => {
    if (!file) return;
    const err = validateImage(file);
    if (err) return toast.error(err);
    setUploading(p.id);
    try {
      const url = await uploadLogo(file);
      await upsert({ ...p, logo: url });
      toast.success("Logo updated");
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    } finally { setUploading(null); }
  };

  const add = async () => {
    if (!draft.name_en && !draft.name_ar) return toast.error("Enter a name (EN or AR)");
    setSaving(true);
    try {
      await upsert({ ...draft, logo: draft.logo || "/placeholder.svg", sort_order: partners.length });
      toast.success("Partner added");
      setDraft(emptyDraft);
      setActiveTab("list");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to add partner");
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">Partners</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage partner logos shown on the homepage and Partners page.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="list">All Partners</TabsTrigger>
          <TabsTrigger value="add">Add New Partner</TabsTrigger>
        </TabsList>

        <TabsContent value="add" className="mt-0 space-y-4">
          <Card>
            <CardHeader><CardTitle className="font-display text-lg">Add new partner</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5" dir="ltr">
                <Label className="block text-left">Name (EN)</Label>
                <Input dir="ltr" lang="en" className="text-left" value={draft.name_en} onChange={e => setDraft({ ...draft, name_en: e.target.value })} placeholder="Partner name" />
              </div>
              <div className="space-y-1.5" dir="rtl">
                <Label className="block text-right font-arabic">الاسم (AR)</Label>
                <Input dir="rtl" lang="ar" className="text-right font-arabic" value={draft.name_ar} onChange={e => setDraft({ ...draft, name_ar: e.target.value })} placeholder="اسم الشريك" />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Description (EN)</Label>
                <RichTextEditor value={draft.description_en || ""} onChange={v => setDraft({ ...draft, description_en: v })} dir="ltr" minHeight="120px" />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-right block font-arabic">الوصف (AR)</Label>
                <RichTextEditor value={draft.description_ar || ""} onChange={v => setDraft({ ...draft, description_ar: v })} dir="rtl" minHeight="120px" />
              </div>
              <div className="space-y-1.5 md:col-span-2"><Label>Logo URL</Label><Input value={draft.logo} placeholder="https://... or upload below" onChange={e => setDraft({ ...draft, logo: e.target.value })} /></div>
              <div className="space-y-1.5 md:col-span-2"><Label>Link (optional)</Label><Input value={draft.href} placeholder="https://partner.com" onChange={e => setDraft({ ...draft, href: e.target.value })} /></div>
              <div className="md:col-span-2 space-y-2">
                <Label>Or upload a logo</Label>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-2 px-3 py-2 rounded-md border bg-background hover:bg-muted cursor-pointer text-sm">
                    {uploading === "draft" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    <span>{uploading === "draft" ? "Uploading…" : "Choose image"}</span>
                    <input type="file" accept="image/*" className="hidden" disabled={uploading === "draft"} onChange={(e) => handleDraftUpload(e.target.files?.[0] ?? null)} />
                  </label>
                  {draft.logo && (
                    <div className="relative">
                      <img src={draft.logo} alt="Preview" className="h-12 w-12 rounded object-contain border bg-card" />
                      {uploading === "draft" && (
                        <div className="absolute inset-0 bg-background/70 rounded flex items-center justify-center">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">PNG, JPG, WEBP, SVG or GIF · up to 5 MB.</p>
                </div>
              </div>
              <div className="md:col-span-2">
                <Button onClick={add} disabled={!_perms.add || (saving)}>
                  {saving ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <Plus className="h-4 w-4 me-2" />}
                  Add partner
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list" className="mt-0">
          {loading ? (
        <div className="text-sm text-muted-foreground">Loading partners…</div>
      ) : partners.length === 0 ? (
        <div className="text-sm text-muted-foreground">No partners yet. Add the first one above.</div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px] text-center">Order</TableHead>
                  <TableHead className="w-[100px]">Logo</TableHead>
                  <TableHead className="min-w-[200px]">Names</TableHead>
                  <TableHead className="min-w-[150px]">Link</TableHead>
                  <TableHead className="w-[140px]">Status</TableHead>
                  <TableHead className="w-[120px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((p, i) => (
                  <React.Fragment key={p.id}>
                    <TableRow className={expandedId === p.id ? "border-b-0 bg-muted/20" : ""}>
                      <TableCell>
                        <div className="flex flex-col gap-1 items-center">
                          <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">#{i + 1}</span>
                          <div className="flex gap-0.5 mt-1">
                            <Button type="button" size="icon" variant="ghost" className="h-5 w-5" disabled={!_perms.edit || (i === 0)} onClick={() => move(p.id, -1)}><ArrowUp className="h-3 w-3" /></Button>
                            <Button type="button" size="icon" variant="ghost" className="h-5 w-5" disabled={!_perms.edit || (i === sorted.length - 1)} onClick={() => move(p.id, 1)}><ArrowDown className="h-3 w-3" /></Button>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2 items-center">
                          <div className="h-12 w-12 flex items-center justify-center bg-muted/40 rounded p-1 border bg-white">
                            <img src={p.logo} alt="" className="max-h-full max-w-full object-contain" />
                          </div>
                          <label className="cursor-pointer text-[10px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-center">
                            {uploading === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />} Replace
                            <input type="file" accept="image/*" className="hidden" disabled={uploading === p.id} onChange={(e) => handleReplace(p, e.target.files?.[0] ?? null)} />
                          </label>
                        </div>
                      </TableCell>
                      <TableCell className="space-y-2">
                        <Input dir="ltr" lang="en" className="h-8 text-sm text-left" value={p.name_en} onChange={e => upsert({ ...p, name_en: e.target.value })} placeholder="Name (EN)" />
                        <Input dir="rtl" lang="ar" className="h-8 text-sm font-arabic text-right" value={p.name_ar} onChange={e => upsert({ ...p, name_ar: e.target.value })} placeholder="الاسم (AR)" />
                      </TableCell>
                      <TableCell>
                        <Input className="h-8 text-sm" value={p.href} onChange={e => upsert({ ...p, href: e.target.value })} placeholder="https://partner.com" />
                      </TableCell>
                      <TableCell className="space-y-3">
                        <label className="flex items-center gap-2 text-xs cursor-pointer">
                          <Switch checked={p.active} onCheckedChange={(v) => upsert({ ...p, active: v })} className="scale-90 origin-left" />
                          <span className={p.active ? "" : "text-muted-foreground"}>{p.active ? "Active" : "Hidden"}</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs cursor-pointer">
                          <Switch checked={!!p.featured} onCheckedChange={(v) => upsert({ ...p, featured: v })} className="scale-90 origin-left" />
                          <span className="inline-flex items-center gap-1"><Star className={`h-3 w-3 ${p.featured ? "fill-accent text-accent" : "text-muted-foreground"}`} /> Featured</span>
                        </label>
                      </TableCell>
                      <TableCell className="text-right align-top pt-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            type="button" 
                            variant={expandedId === p.id ? "secondary" : "ghost"} 
                            size="sm" 
                            className="h-8 px-2 text-xs" 
                            onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                          >
                            <FileText className="h-3.5 w-3.5 me-1" />
                            {expandedId === p.id ? "Hide" : "Details"}
                            {expandedId === p.id ? <ChevronUp className="h-3.5 w-3.5 ms-1" /> : <ChevronDown className="h-3.5 w-3.5 ms-1" />}
                          </Button>
                          <Button type="button" disabled={!_perms.delete} variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => remove(p.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedId === p.id && (
                      <TableRow className="bg-muted/20 hover:bg-muted/20">
                        <TableCell colSpan={6} className="p-4 border-t-0">
                          <div className="flex flex-col gap-6 p-4 bg-background border rounded-lg shadow-sm">
                            <div className="space-y-2">
                              <span className="text-xs font-medium text-muted-foreground">Description (EN)</span>
                              <RichTextEditor value={p.description_en || ""} onChange={v => upsert({ ...p, description_en: v })} dir="ltr" minHeight="120px" placeholder="English description..." />
                            </div>
                            <div className="space-y-2">
                              <span className="text-xs font-medium text-muted-foreground text-right block font-arabic">الوصف (AR)</span>
                              <RichTextEditor value={p.description_ar || ""} onChange={v => upsert({ ...p, description_ar: v })} dir="rtl" minHeight="120px" placeholder="الوصف بالعربية..." />
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
        </TabsContent>
      </Tabs>
    </div>
  );
}