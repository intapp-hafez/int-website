import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useClientT, getDemoClientCompany } from "@/lib/client-i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { User, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

import { LocationPickerMap } from "@/components/site/LocationPickerMap";

export const Route = createFileRoute("/dashboard/workspace/profile")({
  head: () => ({ meta: [{ title: "Profile — Integrated Technics" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { t, dir } = useClientT();
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  
  // Contact Person State
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState("");
  
  // Company State
  const [companyName, setCompanyName] = useState(getDemoClientCompany());
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  
  // Address State
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [street, setStreet] = useState("");
  const [building, setBuilding] = useState("");
  
  // Locations Fetch State
  const [locations, setLocations] = useState<any[]>([]);
  useEffect(() => {
    (supabase as any).from("sys_locations").select("*").eq("is_active", true).order("country_en").then((res: any) => setLocations(res.data || []));
  }, []);
  
  const countries = Array.from(new Map(locations.map(l => [l.country_en, { en: l.country_en, ar: l.country_ar }])).values());
  const currentCities = locations.filter(l => l.country_en === country || l.country_ar === country);
  
  // Location Map State (Default to Cairo)
  const [lat, setLat] = useState(30.0444);
  const [lng, setLng] = useState(31.2357);

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
      <div className="bg-card border rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6 border-b pb-6">
          <div className="h-12 w-12 rounded-full bg-accent/10 text-accent flex items-center justify-center">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold">{t("profile")}</h2>
            <p className="text-sm text-muted-foreground">{t("profileTagline")}</p>
          </div>
        </div>
        <form onSubmit={onSave} className="space-y-8">
          
          {/* Contact Person Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">{dir === "rtl" ? "مسؤول التواصل" : "Contact Person"}</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">{dir === "rtl" ? "الاسم" : "Name"}</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">{t("email")}</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled title={dir === "rtl" ? "لا يمكن تعديل البريد الإلكتروني بعد الاعتماد" : "Email cannot be edited after approval"} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">{t("phone")}</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+20 100 000 0000" disabled title={dir === "rtl" ? "لا يمكن تعديل الهاتف بعد الاعتماد" : "Phone cannot be edited after approval"} />
              </div>
            </div>
          </div>

          {/* Company Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">{dir === "rtl" ? "معلومات الشركة" : "Company Info"}</h3>
            <div className="grid sm:grid-cols-1 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="companyName">{t("company")}</Label>
                <Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="companyWebsite">{dir === "rtl" ? "الموقع الإلكتروني" : "Website"}</Label>
                <Input id="companyWebsite" value={companyWebsite} onChange={(e) => setCompanyWebsite(e.target.value)} placeholder="https://example.com" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="companyEmail">{dir === "rtl" ? "البريد الإلكتروني للشركة" : "Company Email"}</Label>
                <Input id="companyEmail" type="email" value={companyEmail} onChange={(e) => setCompanyEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="companyPhone">{dir === "rtl" ? "هاتف الشركة" : "Company Phone"}</Label>
                <Input id="companyPhone" value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Address Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">{dir === "rtl" ? "العنوان" : "Address"}</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="country">{dir === "rtl" ? "الدولة" : "Country"}</Label>
                <select 
                  id="country" 
                  value={country} 
                  onChange={(e) => { setCountry(e.target.value); setCity(""); }} 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">{dir === "rtl" ? "اختر..." : "Select..."}</option>
                  {countries.map(c => (
                    <option key={c.en} value={c.en}>{dir === "rtl" ? c.ar : c.en}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="city">{dir === "rtl" ? "المدينة" : "City"}</Label>
                <select 
                  id="city" 
                  value={city} 
                  onChange={(e) => setCity(e.target.value)} 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  disabled={!country}
                >
                  <option value="">{dir === "rtl" ? "اختر..." : "Select..."}</option>
                  {currentCities.map(c => (
                    <option key={c.id} value={c.city_en}>{dir === "rtl" ? c.city_ar : c.city_en}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="district">{dir === "rtl" ? "المنطقة" : "District"}</Label>
                <Input id="district" value={district} onChange={(e) => setDistrict(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="street">{dir === "rtl" ? "الشارع" : "Street"}</Label>
                <Input id="street" value={street} onChange={(e) => setStreet(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="building">{dir === "rtl" ? "المبنى" : "Building"}</Label>
                <Input id="building" value={building} onChange={(e) => setBuilding(e.target.value)} />
              </div>
            </div>
            
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <Label>{dir === "rtl" ? "حدد الموقع على الخريطة" : "Pin location on map"}</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="h-8 text-xs gap-1.5"
                  onClick={() => {
                    if ("geolocation" in navigator) {
                      navigator.geolocation.getCurrentPosition(
                        async (position) => {
                          const lat = position.coords.latitude;
                          const lng = position.coords.longitude;
                          setLat(lat);
                          setLng(lng);
                          toast.success(dir === "rtl" ? "تم تحديد موقعك بنجاح" : "Location fetched successfully");
                          
                          // Reverse Geocode
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
                                    setCountry(matchC.country_en);
                                    foundCountry = matchC.country_en;
                                  }
                                }
                                
                                const rawCity = a.city || a.town || a.village || a.county || "";
                                if (rawCity) {
                                  const matchCity = locations.find(l => 
                                    (!foundCountry || l.country_en === foundCountry) &&
                                    (l.city_en.toLowerCase().includes(rawCity.toLowerCase()) || rawCity.toLowerCase().includes(l.city_en.toLowerCase()))
                                  );
                                  if (matchCity) {
                                    setCity(matchCity.city_en);
                                    if (!foundCountry) setCountry(matchCity.country_en);
                                  }
                                }
                                
                                setDistrict(a.suburb || a.neighbourhood || a.residential || a.state_district || "");
                                setStreet(a.road || "");
                                setBuilding(a.house_number || "");
                              }
                            }
                          } catch (err) {
                            console.error("Reverse geocode error:", err);
                          }
                        },
                        (error) => {
                          console.error("Error getting location:", error);
                          toast.error(dir === "rtl" ? "تعذر الحصول على موقعك" : "Could not fetch your location");
                        }
                      );
                    } else {
                      toast.error(dir === "rtl" ? "تحديد الموقع غير مدعوم في متصفحك" : "Geolocation is not supported by your browser");
                    }
                  }}
                >
                  <MapPin className="h-3.5 w-3.5" />
                  {dir === "rtl" ? "استخدام موقعي الحالي" : "Use current location"}
                </Button>
              </div>
              <div className="rounded-lg overflow-hidden border">
                <LocationPickerMap
                  lat={lat}
                  lng={lng}
                  onChange={(pos) => {
                    setLat(pos.lat);
                    setLng(pos.lng);
                  }}
                  className="h-[300px] w-full z-10"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {dir === "rtl" ? "يمكنك سحب الدبوس أو النقر على الخريطة لتحديث الإحداثيات." : "You can drag the pin or click on the map to update coordinates."}
              </p>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button type="submit">{t("save")}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}