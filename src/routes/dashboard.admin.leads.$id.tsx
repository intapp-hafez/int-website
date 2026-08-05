import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { demoLeads, type Lead } from "@/data/demo";
import { ArrowLeft, Save } from "lucide-react";
import { useAdminT } from "@/lib/admin-i18n";

export const Route = createFileRoute("/dashboard/admin/leads/$id")({
  head: () => ({ meta: [{ title: "Lead Details — Admin" }] }),
  component: LeadDetail,
});

function LeadDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const initial = demoLeads.find((l) => l.id === id);
  const [lead, setLead] = useState<Lead | undefined>(initial);

  if (!lead) {
    return (
      <Card><CardContent className="p-6 text-center space-y-3">
        <p className="text-sm text-muted-foreground">Lead not found.</p>
        <Button asChild variant="outline"><Link to="/dashboard/admin/leads"><ArrowLeft className="h-4 w-4 me-2" /> {(useAdminT().t)("back")}</Link></Button>
      </CardContent></Card>
    );
  }

  const save = () => { Object.assign(initial!, lead); navigate({ to: "/dashboard/admin/leads" }); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm"><Link to="/dashboard/admin/leads"><ArrowLeft className="h-4 w-4 me-2" /> {(useAdminT().t)("back")}</Link></Button>
        <Badge variant="secondary" className="capitalize">{lead.status}</Badge>
      </div>
      <Card>
        <CardHeader><CardTitle className="font-display text-xl">Lead {lead.id}</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1.5"><Label>Name</Label><Input value={lead.name} onChange={(e) => setLead({ ...lead, name: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Company</Label><Input value={lead.company} onChange={(e) => setLead({ ...lead, company: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Email</Label><Input value={lead.email} onChange={(e) => setLead({ ...lead, email: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Service</Label><Input value={lead.service} onChange={(e) => setLead({ ...lead, service: e.target.value })} /></div>
          <div className="space-y-1.5 md:col-span-2"><Label>Message</Label><Textarea rows={4} value={lead.message} onChange={(e) => setLead({ ...lead, message: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Status</Label>
            <Select value={lead.status} onValueChange={(v) => setLead({ ...lead, status: v as Lead["status"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{(["new","qualified","won","lost"] as const).map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Created</Label><Input value={lead.createdAt} disabled /></div>
          <div className="md:col-span-2"><Button onClick={save}><Save className="h-4 w-4 me-2" /> Save changes</Button></div>
        </CardContent>
      </Card>
    </div>
  );
}