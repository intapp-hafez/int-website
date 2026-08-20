import { Link } from "@tanstack/react-router";
import { Mail, Phone, MapPin, Linkedin, Twitter, Facebook, Instagram, Youtube } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useSettings } from "@/lib/settings-store";
import logo from "@/assets/logo.png";

export function Footer() {
  const { t, lang } = useI18n();
  const { settings } = useSettings();
  const year = new Date().getFullYear();
  const vis = settings.visibility;
  const show = (k: keyof typeof vis) => vis[k] !== false;
  const socials = [
    { Icon: Linkedin, href: settings.social.linkedin, label: "LinkedIn" },
    { Icon: Twitter, href: settings.social.twitter, label: "Twitter" },
    { Icon: Facebook, href: settings.social.facebook, label: "Facebook" },
    { Icon: Instagram, href: settings.social.instagram, label: "Instagram" },
    { Icon: Youtube, href: settings.social.youtube, label: "YouTube" },
  ].filter((s) => s.href && s.href.trim().length > 0);
  return (
    <footer className="bg-primary text-primary-foreground mt-24">
      <div className="container mx-auto px-4 lg:px-8 pt-12 pb-28 lg:py-16 grid md:grid-cols-2 lg:grid-cols-5 gap-10">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2 font-display font-bold text-lg mb-4">
            <img src={logo} alt="Integrated Technics" className="h-10 w-auto bg-white/95 rounded-md p-1" />
            <span>Integrated<span className="text-accent">Technics</span></span>
          </div>
          <p className="text-sm opacity-90 leading-relaxed max-w-sm">
            {(settings.bio?.[lang] || settings.bio?.en) ?? t("footer.tagline")}
          </p>
          <div className="flex gap-3 mt-5">
            {socials.map(({ Icon, href, label }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="h-9 w-9 rounded-md border border-primary-foreground/20 flex items-center justify-center hover:bg-accent hover:border-accent transition-colors">
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
        {show("about") || show("services") || show("projects") || show("industries") || show("products") ? (
          <div>
            <h4 className="font-display text-sm uppercase tracking-wider mb-4 opacity-90">{t("footer.quick")}</h4>
            <ul className="space-y-1 lg:space-y-2 text-sm opacity-95">
              {show("about") && <li><Link to="/about" className="footer-link">{t("nav.about")}</Link></li>}
              {show("services") && <li><Link to="/services" className="footer-link">{t("nav.services")}</Link></li>}
              {show("projects") && <li><Link to="/projects" className="footer-link">{t("nav.projects")}</Link></li>}
              {show("industries") && <li><Link to="/industries" className="footer-link">{t("nav.industries")}</Link></li>}
              {show("products") && <li><Link to="/products" className="footer-link">{t("nav.products")}</Link></li>}
            </ul>
          </div>
        ) : null}
        {show("careers") || show("news") || show("partners") || show("contact") ? (
          <div>
            <h4 className="font-display text-sm uppercase tracking-wider mb-4 opacity-90">Company</h4>
            <ul className="space-y-1 lg:space-y-2 text-sm opacity-95">
              {show("careers") && <li><Link to="/careers" className="footer-link">{t("nav.careers")}</Link></li>}
              {show("news") && <li><Link to="/news" className="footer-link">{t("nav.news")}</Link></li>}
              {show("partners") && <li><Link to="/partners" className="footer-link">{t("nav.partners")}</Link></li>}
              {show("contact") && <li><Link to="/contact" className="footer-link">{t("nav.contact")}</Link></li>}
            </ul>
          </div>
        ) : null}
        <div>
          <h4 className="font-display text-sm uppercase tracking-wider mb-4 opacity-90">{t("footer.contact")}</h4>
          <ul className="space-y-3 text-sm opacity-95">
            <li className="group flex items-start gap-2 hover:text-accent transition-colors duration-300"><MapPin className="h-4 w-4 mt-0.5 shrink-0 group-hover:text-accent transition-colors duration-300" /><span>{settings.address[lang] || settings.address.en}</span></li>
            <li className="group flex items-center gap-2 hover:text-accent transition-colors duration-300"><Phone className="h-4 w-4 shrink-0 group-hover:text-accent transition-colors duration-300" /><a href={`tel:${settings.phone.replace(/\s+/g,"")}`} dir="ltr" className="hover:text-accent transition-colors duration-300">{settings.phone}</a></li>
            <li className="group flex items-center gap-2 hover:text-accent transition-colors duration-300"><Mail className="h-4 w-4 shrink-0 group-hover:text-accent transition-colors duration-300" /><a href={`mailto:${settings.email}`} className="hover:text-accent whitespace-nowrap transition-colors duration-300">{settings.email}</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10">
        <div className="container mx-auto px-4 lg:px-8 py-5 text-xs opacity-75 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-start">
          <div>
            © {year} Integrated Technics. {t("footer.rights")}
          </div>
          <div className="flex items-center gap-4 flex-wrap justify-center text-xs">
            <Link to="/terms" className="hover:text-accent hover:underline transition-colors">
              {lang === "ar" ? "الشروط والأحكام" : "Terms of Service"}
            </Link>
            <span className="opacity-40">•</span>
            <Link to="/policies" className="hover:text-accent hover:underline transition-colors">
              {lang === "ar" ? "سياسة الخصوصية" : "Privacy Policy"}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
