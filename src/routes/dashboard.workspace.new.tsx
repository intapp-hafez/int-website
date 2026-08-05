import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { services } from "@/data/site";
import { useClientT } from "@/lib/client-i18n";
import { PlusCircle, Send, ShoppingCart } from "lucide-react";

export const Route = createFileRoute("/dashboard/workspace/new")({
  component: NewRequestPage,
});

const products = [
  { sku: "P-CCTV-IP8", name: "IP CCTV Camera (8MP)" },
  { sku: "P-NVR-32",   name: "NVR Recorder — 32 Channel" },
  { sku: "P-AC-RDR",   name: "Access Control Reader" },
  { sku: "P-FW-NGFW",  name: "Next-Gen Firewall Appliance" },
  { sku: "P-SW-48G",   name: "Managed Switch — 48 Port Gigabit" },
  { sku: "P-AV-VW",    name: "4K Video Wall Display" },
];

function NewRequestPage() {
  const { t } = useClientT();
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState<string>("");

  const [svc, setSvc] = useState({ title: "", service: services[0].title.en, description: "" });
  const [ord, setOrd] = useState({ sku: products[0].sku, qty: 1, notes: "" });

  const onSubmitService = (e: FormEvent) => {
    e.preventDefault();
    if (!svc.title.trim() || !svc.description.trim()) return;
    setSubmitted(t("submittedMsg"));
    setTimeout(() => navigate({ to: "/dashboard/workspace" }), 900);
  };

  const onSubmitOrder = (e: FormEvent) => {
    e.preventDefault();
    if (!ord.qty || ord.qty < 1) return;
    setSubmitted(t("orderPlaced"));
    setTimeout(() => navigate({ to: "/dashboard/workspace/orders" }), 900);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-xl flex items-center gap-2">
          <PlusCircle className="h-5 w-5 text-accent" /> {t("newRequest")}
        </CardTitle>
        <p className="text-xs text-muted-foreground">{t("workspaceTagline")}</p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="service">
          <TabsList className="grid grid-cols-2 w-full max-w-md">
            <TabsTrigger value="service" className="gap-2"><Send className="h-4 w-4" /> {t("requestService")}</TabsTrigger>
            <TabsTrigger value="product" className="gap-2"><ShoppingCart className="h-4 w-4" /> {t("orderProduct")}</TabsTrigger>
          </TabsList>

          <TabsContent value="service" className="pt-6">
            <form onSubmit={onSubmitService} className="space-y-4 max-w-2xl">
              <div className="space-y-1.5">
                <Label htmlFor="title">{t("title")}</Label>
                <Input id="title" value={svc.title} onChange={(e) => setSvc({ ...svc, title: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label>{t("service")}</Label>
                <Select value={svc.service} onValueChange={(v) => setSvc({ ...svc, service: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {services.map((s) => <SelectItem key={s.slug} value={s.title.en}>{s.title.en}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="desc">{t("description")}</Label>
                <Textarea id="desc" rows={5} value={svc.description} onChange={(e) => setSvc({ ...svc, description: e.target.value })} required />
              </div>
              <Button type="submit" className="w-full sm:w-auto"><Send className="h-4 w-4 me-2" />{t("submit")}</Button>
            </form>
          </TabsContent>

          <TabsContent value="product" className="pt-6">
            <form onSubmit={onSubmitOrder} className="space-y-4 max-w-2xl">
              <div className="space-y-1.5">
                <Label>{t("chooseProduct")}</Label>
                <Select value={ord.sku} onValueChange={(v) => setOrd({ ...ord, sku: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {products.map((p) => <SelectItem key={p.sku} value={p.sku}>{p.name} <span className="text-muted-foreground text-xs ms-2">{p.sku}</span></SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="qty">{t("quantity")}</Label>
                <Input id="qty" type="number" min={1} value={ord.qty} onChange={(e) => setOrd({ ...ord, qty: Number(e.target.value) })} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notes">{t("notes")}</Label>
                <Textarea id="notes" rows={4} value={ord.notes} onChange={(e) => setOrd({ ...ord, notes: e.target.value })} />
              </div>
              <Button type="submit" className="w-full sm:w-auto"><ShoppingCart className="h-4 w-4 me-2" />{t("placeOrder")}</Button>
            </form>
          </TabsContent>
        </Tabs>

        {submitted && <p className="text-sm text-emerald-600 mt-4">{submitted}</p>}
      </CardContent>
    </Card>
  );
}