import { createFileRoute } from "@tanstack/react-router";
import { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { demoReports, kpis } from "@/data/demo";
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";

export const Route = createFileRoute("/dashboard/admin/reports")({
  head: () => ({ meta: [{ title: "Reports — Admin" }] }),
  component: ReportsPage,
});

const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "#0ea5e9", "#22c55e", "#f59e0b", "#ef4444"];

function ReportsPage() {
  const reportRef = useRef<HTMLDivElement>(null);

  const leadsData = demoReports.monthlyLeads.map((v, i) => ({ month: months[i], leads: v }));
  const revenueData = demoReports.monthlyRevenue.map((v, i) => ({ month: months[i], revenue: v }));
  const totalRev = demoReports.monthlyRevenue.reduce((a, b) => a + b, 0);
  const totalLeads = demoReports.monthlyLeads.reduce((a, b) => a + b, 0);

  const exportCSV = () => {
    const rows = [
      ["Month", "Leads", "Revenue ($K)"],
      ...months.map((m, i) => [m, demoReports.monthlyLeads[i], demoReports.monthlyRevenue[i]]),
      [],
      ["Service", "Share"],
      ...demoReports.serviceMix.map(s => [s.label, s.value]),
    ];
    const csv = rows.map(r => r.map(c => `"${c ?? ""}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `reports-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  const exportPDF = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    doc.setFontSize(18); doc.text("Integrated Technics — Reports", 14, 18);
    doc.setFontSize(10); doc.setTextColor(120);
    doc.text(`Generated ${new Date().toLocaleDateString()}`, 14, 25);
    doc.setTextColor(0); doc.setFontSize(12);
    doc.text(`Total leads (12m): ${totalLeads}`, 14, 38);
    doc.text(`Total revenue (12m): $${totalRev}K`, 14, 46);
    doc.text(`Win rate: ${kpis.conversionRate}%`, 14, 54);

    doc.setFontSize(13); doc.text("Monthly performance", 14, 68);
    doc.setFontSize(10);
    let y = 76;
    doc.text("Month", 14, y); doc.text("Leads", 60, y); doc.text("Revenue ($K)", 100, y);
    y += 4; doc.line(14, y, 180, y); y += 6;
    months.forEach((m, i) => {
      doc.text(m, 14, y);
      doc.text(String(demoReports.monthlyLeads[i]), 60, y);
      doc.text(String(demoReports.monthlyRevenue[i]), 100, y);
      y += 6;
    });

    y += 6; doc.setFontSize(13); doc.text("Service mix", 14, y); y += 8; doc.setFontSize(10);
    demoReports.serviceMix.forEach(s => { doc.text(`${s.label}: ${s.value}%`, 14, y); y += 6; });

    doc.save(`reports-${new Date().toISOString().slice(0,10)}.pdf`);
    toast.success("PDF exported");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">Pipeline, revenue and service mix at a glance.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV}><Download className="h-4 w-4 me-1" /> CSV</Button>
          <Button size="sm" onClick={exportPDF}><FileText className="h-4 w-4 me-1" /> PDF</Button>
        </div>
      </div>

      <div ref={reportRef} className="space-y-6">
        <div className="grid md:grid-cols-3 gap-3">
          <Stat label="Total Leads (12m)" value={totalLeads.toString()} />
          <Stat label="Revenue (12m)" value={`$${totalRev}K`} />
          <Stat label="Win rate" value={`${kpis.conversionRate}%`} />
        </div>

        <Card>
          <CardHeader><CardTitle className="font-display text-lg">Monthly Leads</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={leadsData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="leads" fill="hsl(var(--accent))" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-display text-lg">Revenue ($K)</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-display text-lg">Service Mix</CardTitle></CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={demoReports.serviceMix} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={110} label>
                    {demoReports.serviceMix.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card><CardContent className="p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-display text-2xl font-bold mt-1">{value}</div>
    </CardContent></Card>
  );
}