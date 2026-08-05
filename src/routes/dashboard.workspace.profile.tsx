import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useClientT, getDemoClientCompany } from "@/lib/client-i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { User } from "lucide-react";

export const Route = createFileRoute("/dashboard/workspace/profile")({
  head: () => ({ meta: [{ title: "Profile — Integrated Technics" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { t, dir } = useClientT();
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState("");
  const company = getDemoClientCompany();

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      navigate({ to: "/signin", search: { redirect: "/dashboard/workspace/profile" } as any, replace: true });
    }
  }, [ready, user, navigate]);

  if (!ready || !user) {
    return <div className="p-6 text-sm text-muted-foreground">…</div>;
  }

  if (user.role !== "client") {
    return (
      <div className="bg-card border rounded-2xl p-10 text-center max-w-lg mx-auto">
        <h2 className="font-display text-xl font-bold mb-2">{dir === "rtl" ? "غير متاح" : "Not available"}</h2>
        <p className="text-sm text-muted-foreground mb-6">
          {dir === "rtl" ? "هذه الصفحة مخصصة لحسابات العملاء فقط." : "This page is reserved for client accounts."}
        </p>
        <Button asChild><Link to="/dashboard/admin">{dir === "rtl" ? "العودة إلى لوحة الإدارة" : "Back to admin"}</Link></Button>
      </div>
    );
  }

  const onSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(t("saved"));
  };

  return (
    <div className="space-y-6" dir={dir}>
      <div className="bg-card border rounded-2xl p-6 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-full bg-accent/10 text-accent flex items-center justify-center">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold">{t("profile")}</h2>
            <p className="text-sm text-muted-foreground">{t("profileTagline")}</p>
          </div>
        </div>
        <form onSubmit={onSave} className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">{t("fullName")}</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">{t("email")}</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">{t("phone")}</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+20 100 000 0000" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="company">{t("company")}</Label>
            <Input id="company" value={company} disabled />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="role">{t("role")}</Label>
            <Input id="role" value={user?.role ?? ""} disabled className="capitalize" />
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <Button type="submit">{t("save")}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}