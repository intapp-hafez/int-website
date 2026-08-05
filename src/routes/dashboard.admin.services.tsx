import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { services as siteServices } from "@/data/site";
import { useAdminT } from "@/lib/admin-i18n";
import { Plus, Trash2, ExternalLink } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { ViewToggle } from "@/components/admin/ViewToggle";
import { useListSearch, validateListSearch } from "@/components/admin/useListSearch";
import { sortItems, paginate } from "@/lib/list-utils";
import { SortableHead } from "@/components/admin/SortableHead";
import { Paginator } from "@/components/admin/Paginator";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { useCanAccess } from "@/lib/permissions-store";

export const Route = createFileRoute("/dashboard/admin/services")({
  head: () => ({ meta: [{ title: "Services — Admin" }] }),
  validateSearch: validateListSearch,
  component: ServicesAdminPage,
});
const PAGE_SIZE = 10;

type Bi = { en: string; ar: string };
type ServiceItem = {
  slug: string;
  title: Bi;
  desc: Bi;
  iconName: string;
  published: boolean;
  seo?: {
    metaTitle?: Bi;
    metaDescription?: Bi;
    keywords?: string;
    ogImage?: string;
    canonicalUrl?: string;
  };
};

const initialItems: ServiceItem[] = siteServices.map((s) => ({
  slug: s.slug,
  title: { en: s.title.en, ar: s.title.ar },
  desc: { en: s.desc.en, ar: s.desc.ar },
  iconName: (s.icon as any).displayName || (s.icon as any).name || "Layers",
  published: true,
}));

function ServicesAdminPage() {
  const { lang } = useAdminT();
  const can = useCanAccess("services");
  const [items, setItems] = useState<ServiceItem[]>(initialItems);
  const [selected, setSelected] = useState<string[]>([]);
  const { view, page, sort, dir, setPage, toggleSort } = useListSearch({ defaultView: "grid" });
  const [editing, setEditing] = useState<string | null>(null);

  const update = (slug: string, patch: Partial<ServiceItem>) =>
    setItems((prev) => prev.map((x) => (x.slug === slug ? { ...x, ...patch } : x)));
  const remove = (slug: string) => setItems((prev) => prev.filter((x) => x.slug !== slug));
  const add = () => {
    const slug = `service-${Date.now()}`;
    setItems((prev) => [
      ...prev,
      {
        slug,
        title: { en: "New Service", ar: "خدمة جديدة" },
        desc: { en: "Describe this service…", ar: "صف هذه الخدمة…" },
        iconName: "Layers",
        published: false,
      },
    ]);
  };
  const setBi = (b: Bi, k: "en" | "ar", v: string): Bi => ({ ...b, [k]: v });

  const publishedCount = items.filter((i) => i.published).length;
  const sorted = useMemo(
    () =>
      sortItems(items, sort, dir, {
        slug: (s) => s.slug,
        title: (s) => (lang === "ar" ? s.title.ar : s.title.en),
        status: (s) => (s.published ? 1 : 0),
      }),
    [items, sort, dir, lang],
  );
  const pg = paginate(sorted, page, PAGE_SIZE);
  const pageIds = pg.items.map((s) => s.slug);
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => selected.includes(id));
  const toggleAllOnPage = () =>
    setSelected((prev) => (allOnPage ? prev.filter((id) => !pageIds.includes(id)) : Array.from(new Set([...prev, ...pageIds]))));
  const toggleOne = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const bulkDelete = () => { setItems((prev) => prev.filter((s) => !selected.includes(s.slug))); setSelected([]); };
  const bulkPublish = (v: string) => {
    const published = v === "publish";
    setItems((prev) => prev.map((s) => (selected.includes(s.slug) ? { ...s, published } : s)));
    setSelected([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">
            {lang === "ar" ? "الخدمات" : "Services"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {lang === "ar"
              ? "إدارة الخدمات الظاهرة على الموقع باللغتين العربية والإنجليزية."
              : "Manage services published on the website in English and Arabic."}
          </p>
          <div className="flex items-center gap-2 mt-3">
            <Badge variant="secondary">
              {publishedCount} {lang === "ar" ? "منشورة" : "published"}
            </Badge>
            <Badge variant="outline">
              {items.length} {lang === "ar" ? "إجمالي" : "total"}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ViewToggle value={view} lang={lang as "en" | "ar"} />
          {can.add && (
            <Button onClick={add}>
              <Plus className="h-4 w-4 me-1" /> {lang === "ar" ? "إضافة خدمة" : "Add Service"}
            </Button>
          )}
        </div>
      </div>

      {view === "table" && (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <div className="p-3 pb-0">
              <BulkActionBar
                count={selected.length}
                onClear={() => setSelected([])}
                onDelete={can.delete ? bulkDelete : undefined}
                statusOptions={can.edit ? [
                  { value: "publish", label: lang === "ar" ? "نشر" : "Publish" },
                  { value: "unpublish", label: lang === "ar" ? "إلغاء النشر" : "Unpublish" },
                ] : undefined}
                onStatusChange={can.edit ? bulkPublish : undefined}
              />
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"><Checkbox checked={allOnPage} onCheckedChange={toggleAllOnPage} aria-label="Select all" /></TableHead>
                  <SortableHead field="slug" sort={sort} dir={dir} onSort={toggleSort}>{lang === "ar" ? "المعرف" : "Slug"}</SortableHead>
                  <SortableHead field="title" sort={sort} dir={dir} onSort={toggleSort}>{lang === "ar" ? "العنوان" : "Title"}</SortableHead>
                  <TableHead>{lang === "ar" ? "الوصف" : "Description"}</TableHead>
                  <SortableHead field="status" sort={sort} dir={dir} onSort={toggleSort}>{lang === "ar" ? "الحالة" : "Status"}</SortableHead>
                  <TableHead className="text-end">{lang === "ar" ? "إجراءات" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pg.items.map((s) => (
                  <TableRow key={s.slug}>
                    <TableCell><Checkbox checked={selected.includes(s.slug)} onCheckedChange={() => toggleOne(s.slug)} aria-label="Select row" /></TableCell>
                    <TableCell className="font-mono text-xs">{s.slug}</TableCell>
                    <TableCell className="text-sm font-medium">{lang === "ar" ? s.title.ar : s.title.en}</TableCell>
                    <TableCell className="text-xs text-muted-foreground line-clamp-2 max-w-xs">{lang === "ar" ? s.desc.ar : s.desc.en}</TableCell>
                    <TableCell>
                      <Switch checked={s.published} onCheckedChange={(v) => update(s.slug, { published: v })} />
                    </TableCell>
                    <TableCell className="text-end space-x-1">
                      {can.edit && <Button size="sm" variant="ghost" onClick={() => setEditing(editing === s.slug ? null : s.slug)}>{lang === "ar" ? "تحرير" : "Edit"}</Button>}
                      {can.delete && <Button size="sm" variant="ghost" onClick={() => remove(s.slug)}><Trash2 className="h-4 w-4" /></Button>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="p-3"><Paginator page={pg.page} pageCount={pg.pageCount} total={sorted.length} start={pg.start} end={pg.end} onPageChange={setPage} /></div>
          </CardContent>
        </Card>
      )}

      {view === "list" && (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y">
              {pg.items.map((s) => (
                <li key={s.slug} className="p-3 flex items-center gap-3">
                  <code className="text-xs bg-muted px-2 py-1 rounded shrink-0">{s.slug}</code>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{lang === "ar" ? s.title.ar : s.title.en}</div>
                    <div className="text-xs text-muted-foreground truncate">{lang === "ar" ? s.desc.ar : s.desc.en}</div>
                  </div>
                  {s.published ? (
                    <Badge className="bg-emerald-100 text-emerald-900 border-0">{lang === "ar" ? "منشورة" : "Published"}</Badge>
                  ) : (
                    <Badge variant="outline">{lang === "ar" ? "مسودة" : "Draft"}</Badge>
                  )}
                  <Switch checked={s.published} onCheckedChange={(v) => update(s.slug, { published: v })} />
                  {can.edit && <Button size="sm" variant="ghost" onClick={() => setEditing(editing === s.slug ? null : s.slug)}>{lang === "ar" ? "تحرير" : "Edit"}</Button>}
                  {can.delete && <Button size="sm" variant="ghost" onClick={() => remove(s.slug)}><Trash2 className="h-4 w-4" /></Button>}
                </li>
              ))}
            </ul>
            <div className="p-3"><Paginator page={pg.page} pageCount={pg.pageCount} total={sorted.length} start={pg.start} end={pg.end} onPageChange={setPage} /></div>
          </CardContent>
        </Card>
      )}

      {view === "grid" && (
        <>
        <div className="grid gap-3">
          {pg.items.map((s) => (
          <Card key={s.slug}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 min-w-0">
                  <code className="text-xs bg-muted px-2 py-1 rounded">{s.slug}</code>
                  {s.published ? (
                    <Badge className="bg-emerald-100 text-emerald-900 border-0">
                      {lang === "ar" ? "منشورة" : "Published"}
                    </Badge>
                  ) : (
                    <Badge variant="outline">{lang === "ar" ? "مسودة" : "Draft"}</Badge>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`pub-${s.slug}`} className="text-xs text-muted-foreground">
                      {lang === "ar" ? "نشر" : "Publish"}
                    </Label>
                    <Switch
                      id={`pub-${s.slug}`}
                      checked={s.published}
                      onCheckedChange={(v) => update(s.slug, { published: v })}
                    />
                  </div>
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/services/$slug" params={{ slug: s.slug }} target="_blank">
                      <ExternalLink className="h-4 w-4 me-1" />
                      {lang === "ar" ? "عرض" : "View"}
                    </Link>
                  </Button>
                  {can.delete && (
                    <Button variant="ghost" size="icon" onClick={() => remove(s.slug)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Title (EN)</Label>
                  <Input
                    dir="ltr"
                    value={s.title.en}
                    onChange={(e) => update(s.slug, { title: setBi(s.title, "en", e.target.value) })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>العنوان (AR)</Label>
                  <Input
                    dir="rtl"
                    value={s.title.ar}
                    onChange={(e) => update(s.slug, { title: setBi(s.title, "ar", e.target.value) })}
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <Label>Description (EN)</Label>
                    <span className="text-xs text-muted-foreground">Rich Text (LTR)</span>
                  </div>
                  <RichTextEditor
                    dir="ltr"
                    value={s.desc.en}
                    onChange={(val) => update(s.slug, { desc: setBi(s.desc, "en", val) })}
                    placeholder="Write the service description in English..."
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <Label>الوصف (AR)</Label>
                    <span className="text-xs text-muted-foreground">محرر نصوص منسقة (RTL)</span>
                  </div>
                  <RichTextEditor
                    dir="rtl"
                    value={s.desc.ar}
                    onChange={(val) => update(s.slug, { desc: setBi(s.desc, "ar", val) })}
                    placeholder="اكتب وصف الخدمة بالعربية..."
                  />
                </div>
              </div>
              <div className="rounded-md border p-4 bg-muted/30 space-y-3">
                <div>
                  <div className="font-semibold text-sm">{lang === "ar" ? "تحسين محركات البحث (SEO)" : "SEO"}</div>
                  <div className="text-xs text-muted-foreground">{lang === "ar" ? "بيانات وصفية لمحركات البحث ومشاركات السوشيال." : "Search-engine and social-share metadata for this service."}</div>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Meta title (EN)</Label><Input maxLength={70} value={s.seo?.metaTitle?.en ?? ""} onChange={(e) => update(s.slug, { seo: { ...s.seo, metaTitle: { en: e.target.value, ar: s.seo?.metaTitle?.ar ?? "" } } })} /></div>
                  <div className="space-y-1.5"><Label>عنوان ميتا (AR)</Label><Input dir="rtl" maxLength={70} value={s.seo?.metaTitle?.ar ?? ""} onChange={(e) => update(s.slug, { seo: { ...s.seo, metaTitle: { en: s.seo?.metaTitle?.en ?? "", ar: e.target.value } } })} /></div>
                  <div className="space-y-1.5 md:col-span-2"><Label>Meta description (EN)</Label><Textarea rows={2} maxLength={180} value={s.seo?.metaDescription?.en ?? ""} onChange={(e) => update(s.slug, { seo: { ...s.seo, metaDescription: { en: e.target.value, ar: s.seo?.metaDescription?.ar ?? "" } } })} /></div>
                  <div className="space-y-1.5 md:col-span-2"><Label>وصف ميتا (AR)</Label><Textarea dir="rtl" rows={2} maxLength={180} value={s.seo?.metaDescription?.ar ?? ""} onChange={(e) => update(s.slug, { seo: { ...s.seo, metaDescription: { en: s.seo?.metaDescription?.en ?? "", ar: e.target.value } } })} /></div>
                  <div className="space-y-1.5 md:col-span-2"><Label>{lang === "ar" ? "الكلمات المفتاحية" : "Keywords"}</Label><Input value={s.seo?.keywords ?? ""} onChange={(e) => update(s.slug, { seo: { ...s.seo, keywords: e.target.value } })} placeholder="cloud, devops, egypt" /></div>
                  <div className="space-y-1.5"><Label>OG image URL</Label><Input value={s.seo?.ogImage ?? ""} onChange={(e) => update(s.slug, { seo: { ...s.seo, ogImage: e.target.value } })} /></div>
                  <div className="space-y-1.5"><Label>{lang === "ar" ? "الرابط الأساسي" : "Canonical URL"}</Label><Input value={s.seo?.canonicalUrl ?? ""} onChange={(e) => update(s.slug, { seo: { ...s.seo, canonicalUrl: e.target.value } })} /></div>
                </div>
              </div>
            </CardContent>
          </Card>
          ))}
        </div>
        <Paginator page={pg.page} pageCount={pg.pageCount} total={sorted.length} start={pg.start} end={pg.end} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}