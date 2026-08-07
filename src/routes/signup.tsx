import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, useEffect, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Eye, EyeOff, ShieldCheck, Check, X, MapPin } from "lucide-react";
import { useAuthT } from "@/lib/auth-i18n";
import { LocationPickerMap } from "@/components/site/LocationPickerMap";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create Account — Integrated Technics" },
      { name: "description", content: "Create your client account to submit requests, place orders and track delivery." },
    ],
  }),
  component: SignUpPage,
});

const PWD_RULES = [
  { key: "len", test: (p: string) => p.length >= 8 },
  { key: "up", test: (p: string) => /[A-Z]/.test(p) },
  { key: "lo", test: (p: string) => /[a-z]/.test(p) },
  { key: "num", test: (p: string) => /\d/.test(p) },
  { key: "sym", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
] as const;

function SignUpPage() {
  const navigate = useNavigate();
  const { t, dir } = useAuthT();
  const [form, setForm] = useState({
    // Contact
    fullName: "", phone: "", email: "", password: "", confirm: "",
    // Company
    company: "", manager: "", companyWebsite: "", companyEmail: "", companyPhone: "",
    // Location
    country: "", city: "", district: "", street: "", building: "", lat: 30.0444, lng: 31.2357
  });
  
  const [locations, setLocations] = useState<any[]>([]);
  useEffect(() => {
    (supabase as any).from("sys_locations").select("*").eq("is_active", true).order("country_en").then((res: any) => setLocations(res.data || []));
  }, []);
  
  const countries = Array.from(new Map(locations.map(l => [l.country_en, { en: l.country_en, ar: l.country_ar }])).values());
  const currentCities = locations.filter(l => l.country_en === form.country || l.country_ar === form.country);

  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const phoneDigits = form.phone.replace(/\D/g, "");
  const phoneOk = phoneDigits.length === 11;
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
  const checks = useMemo(() => PWD_RULES.map((r) => ({ ...r, ok: r.test(form.password) })), [form.password]);
  const pwdOk = checks.every((r) => r.ok);
  const confirmOk = form.confirm.length > 0 && form.confirm === form.password;
  const formValid = form.fullName.trim().length >= 2 && phoneOk && emailOk && form.company.trim() && pwdOk && confirmOk;

  const labels: Record<string, string> = {
    len: t("signup.pwd.len"), up: t("signup.pwd.up"), lo: t("signup.pwd.lo"),
    num: t("signup.pwd.num"), sym: t("signup.pwd.sym"),
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!formValid) { setError(t("signup.fix")); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: form.email, password: form.password,
        options: {
          emailRedirectTo: `${window.location.origin}/signin`,
          data: { 
            full_name: form.fullName, 
            phone: phoneDigits, 
            company: form.company, 
            manager: form.manager,
            company_website: form.companyWebsite,
            company_email: form.companyEmail,
            company_phone: form.companyPhone,
            country: form.country,
            city: form.city,
            district: form.district,
            street: form.street,
            building: form.building,
            lat: form.lat,
            lng: form.lng
          },
        },
      });
      if (error) throw error;
      setSuccess(t("signup.success"));
      setTimeout(() => navigate({ to: "/signin" }), 1800);
    } catch (err: any) {
      setError(err?.message || "Sign up failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="container mx-auto px-4 py-12 md:py-16 max-w-4xl" dir={dir}>
      <div className="bg-card border rounded-2xl shadow-elegant p-6 md:p-8">
        <div className="flex items-center gap-3 mb-8 border-b pb-6">
          <div className="h-10 w-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">{t("signup.title")}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t("signup.sub")}</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-8" noValidate>
          
          {/* Contact Person Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">{dir === "rtl" ? "مسؤول التواصل" : "Contact Person"}</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              <Field label={t("signup.fullName")} htmlFor="fullName">
                <Input id="fullName" autoComplete="name" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
              </Field>
              <Field label={t("signup.email")} htmlFor="email" hintOk={emailOk}>
                <Input id="email" type="email" autoComplete="email" required value={form.email} dir="ltr"
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  aria-invalid={!!form.email && !emailOk}
                  className={form.email ? (emailOk ? "border-emerald-500 focus-visible:ring-emerald-500" : "border-destructive focus-visible:ring-destructive") : ""} />
              </Field>
              <Field label={t("signup.phone")} htmlFor="phone" hint={form.phone ? `${phoneDigits.length}/11${phoneOk ? " ✓" : ""}` : ""} hintOk={phoneOk}>
                <Input id="phone" inputMode="tel" autoComplete="tel" required value={form.phone} dir="ltr"
                  onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/[^\d+\s-]/g, "").slice(0, 16) })}
                  aria-invalid={!!form.phone && !phoneOk}
                  className={form.phone ? (phoneOk ? "border-emerald-500 focus-visible:ring-emerald-500" : "border-destructive focus-visible:ring-destructive") : ""}
                  placeholder={t("signup.phonePlaceholder")} />
              </Field>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-4 pt-2">
              <Field label={t("signup.password")} htmlFor="password">
                <div className="relative">
                  <Input id="password" type={showPwd ? "text" : "password"} autoComplete="new-password" required value={form.password} dir="ltr"
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    aria-invalid={!!form.password && !pwdOk}
                    className={`pe-10 ${form.password ? (pwdOk ? "border-emerald-500 focus-visible:ring-emerald-500" : "border-destructive focus-visible:ring-destructive") : ""}`} />
                  <button type="button" tabIndex={-1} onClick={() => setShowPwd((s) => !s)}
                    className="absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1">
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <ul className="mt-2 grid grid-cols-1 gap-y-1 gap-x-3 text-[11px]">
                  {checks.map((r) => (
                    <li key={r.key} className={`flex items-center gap-1.5 ${r.ok ? "text-emerald-600" : "text-muted-foreground"}`}>
                      {r.ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3 opacity-60" />} {labels[r.key]}
                    </li>
                  ))}
                </ul>
              </Field>

              <Field label={t("signup.confirm")} htmlFor="confirm" hint={form.confirm ? (confirmOk ? t("signup.matches") : t("signup.noMatch")) : ""} hintOk={confirmOk}>
                <div className="relative">
                  <Input id="confirm" type={showConfirm ? "text" : "password"} autoComplete="new-password" required value={form.confirm} dir="ltr"
                    onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                    aria-invalid={!!form.confirm && !confirmOk}
                    className={`pe-10 ${form.confirm ? (confirmOk ? "border-emerald-500 focus-visible:ring-emerald-500" : "border-destructive focus-visible:ring-destructive") : ""}`} />
                  <button type="button" tabIndex={-1} onClick={() => setShowConfirm((s) => !s)}
                    className="absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1">
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>
            </div>
          </div>

          {/* Company Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">{dir === "rtl" ? "معلومات الشركة" : "Company Info"}</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label={t("signup.company")} htmlFor="company">
                <Input id="company" autoComplete="organization" required value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
              </Field>
              <Field label={t("signup.manager")} htmlFor="manager">
                <Input id="manager" value={form.manager} onChange={(e) => setForm({ ...form, manager: e.target.value })} placeholder={t("signup.managerPlaceholder")} />
              </Field>
            </div>
            <div className="grid sm:grid-cols-3 gap-4 pt-2">
              <Field label={dir === "rtl" ? "الموقع الإلكتروني" : "Website"} htmlFor="companyWebsite">
                <Input id="companyWebsite" value={form.companyWebsite} onChange={(e) => setForm({ ...form, companyWebsite: e.target.value })} placeholder="https://example.com" />
              </Field>
              <Field label={dir === "rtl" ? "البريد الإلكتروني للشركة" : "Company Email"} htmlFor="companyEmail">
                <Input id="companyEmail" type="email" value={form.companyEmail} onChange={(e) => setForm({ ...form, companyEmail: e.target.value })} />
              </Field>
              <Field label={dir === "rtl" ? "هاتف الشركة" : "Company Phone"} htmlFor="companyPhone">
                <Input id="companyPhone" value={form.companyPhone} onChange={(e) => setForm({ ...form, companyPhone: e.target.value })} />
              </Field>
            </div>
          </div>

          {/* Address Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">{dir === "rtl" ? "العنوان" : "Address"}</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label={dir === "rtl" ? "الدولة" : "Country"} htmlFor="country">
                <select 
                  id="country" 
                  value={form.country} 
                  onChange={(e) => setForm({ ...form, country: e.target.value, city: "" })} 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">{dir === "rtl" ? "اختر..." : "Select..."}</option>
                  {countries.map(c => <option key={c.en} value={c.en}>{dir === "rtl" ? c.ar : c.en}</option>)}
                </select>
              </Field>
              <Field label={dir === "rtl" ? "المدينة" : "City"} htmlFor="city">
                <select 
                  id="city" 
                  value={form.city} 
                  onChange={(e) => setForm({ ...form, city: e.target.value })} 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  disabled={!form.country}
                >
                  <option value="">{dir === "rtl" ? "اختر..." : "Select..."}</option>
                  {currentCities.map(c => <option key={c.id} value={c.city_en}>{dir === "rtl" ? c.city_ar : c.city_en}</option>)}
                </select>
              </Field>
            </div>
            <div className="grid sm:grid-cols-3 gap-4 pt-2">
              <Field label={dir === "rtl" ? "المنطقة" : "District"} htmlFor="district">
                <Input id="district" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
              </Field>
              <Field label={dir === "rtl" ? "الشارع" : "Street"} htmlFor="street">
                <Input id="street" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} />
              </Field>
              <Field label={dir === "rtl" ? "المبنى" : "Building"} htmlFor="building">
                <Input id="building" value={form.building} onChange={(e) => setForm({ ...form, building: e.target.value })} />
              </Field>
            </div>
            
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <Label>{dir === "rtl" ? "حدد الموقع على الخريطة" : "Pin location on map"}</Label>
                <div className="flex gap-2">
                  <Button
                    type="button" variant="outline" size="sm" className="h-8 text-xs"
                    onClick={() => setShowMap(!showMap)}
                  >
                    <MapPin className="h-3.5 w-3.5 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
                    {showMap 
                      ? (dir === "rtl" ? "إخفاء الخريطة" : "Hide map") 
                      : (dir === "rtl" ? "إظهار الخريطة" : "Show map")}
                  </Button>
                  <Button 
                    type="button" variant="secondary" size="sm" className="h-8 text-xs gap-1.5"
                    onClick={() => {
                      if ("geolocation" in navigator) {
                        navigator.geolocation.getCurrentPosition(
                          async (position) => {
                            const lat = position.coords.latitude;
                            const lng = position.coords.longitude;
                            setForm(f => ({ ...f, lat, lng }));
                            setShowMap(true);
                            toast.success(dir === "rtl" ? "تم تحديد موقعك بنجاح" : "Location fetched successfully");
                            
                            try {
                              const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=en`);
                              if (res.ok) {
                                const data = await res.json();
                                if (data && data.address) {
                                  const a = data.address;
                                  let foundCountry = "";
                                  if (a.country) {
                                    const matchC = locations.find(l => l.country_en.toLowerCase() === a.country.toLowerCase() || l.country_ar === a.country);
                                    if (matchC) {
                                      foundCountry = matchC.country_en;
                                    }
                                  }
                                  const rawCity = a.city || a.town || a.village || a.county || "";
                                  let foundCity = "";
                                  if (rawCity) {
                                    const matchCity = locations.find(l => 
                                      (!foundCountry || l.country_en === foundCountry) &&
                                      (l.city_en.toLowerCase().includes(rawCity.toLowerCase()) || rawCity.toLowerCase().includes(l.city_en.toLowerCase()))
                                    );
                                    if (matchCity) {
                                      foundCity = matchCity.city_en;
                                      if (!foundCountry) foundCountry = matchCity.country_en;
                                    }
                                  }
                                  setForm(f => ({
                                    ...f,
                                    country: foundCountry || f.country,
                                    city: foundCity || f.city,
                                    district: a.suburb || a.neighbourhood || a.residential || a.state_district || f.district,
                                    street: a.road || f.street,
                                    building: a.house_number || f.building,
                                  }));
                                }
                              }
                            } catch (err) {
                              console.error("Reverse geocode error:", err);
                            }
                          },
                          () => toast.error(dir === "rtl" ? "تعذر الحصول على موقعك" : "Could not fetch your location")
                        );
                      }
                    }}
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    {dir === "rtl" ? "استخدام موقعي الحالي" : "Use current location"}
                  </Button>
                </div>
              </div>
              {showMap && (
                <div className="rounded-lg overflow-hidden border mt-2">
                  <LocationPickerMap lat={form.lat} lng={form.lng} onChange={(pos) => setForm(f => ({ ...f, lat: pos.lat, lng: pos.lng }))} className="h-[300px] w-full z-10" />
                </div>
              )}
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-emerald-600">{success}</p>}

          <Button type="submit" className="w-full" disabled={loading || !formValid}>
            {loading ? t("signup.loading") : t("signup.submit")}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            {t("signup.have")} <Link to="/signin" className="text-accent hover:underline">{t("signup.signin")}</Link>
          </p>
        </form>

        <div className="mt-6 flex items-start gap-2 rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-accent mt-0.5 shrink-0" />
          <p>{t("signup.notice")}</p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, htmlFor, hint, hintOk, children }: { label: string; htmlFor: string; hint?: string; hintOk?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={htmlFor}>{label}</Label>
        {hint && <span className={`text-xs ${hintOk ? "text-emerald-600" : "text-destructive"}`}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}
