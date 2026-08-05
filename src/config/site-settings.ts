// Configurable site contact + social settings.
// Override at build/deploy time via VITE_* env vars; falls back to defaults.

const env = (import.meta as any).env ?? {};

export const siteSettings = {
  email: env.VITE_CONTACT_EMAIL || "info@integratedtechnics.com",
  phone: env.VITE_CONTACT_PHONE || "+20 100 741 9344",
  whatsapp: env.VITE_CONTACT_WHATSAPP || "+20210000000",
  address: env.VITE_CONTACT_ADDRESS || "Cairo, Egypt",
  social: {
    linkedin: env.VITE_SOCIAL_LINKEDIN || "https://www.linkedin.com/",
    twitter: env.VITE_SOCIAL_TWITTER || "https://twitter.com/",
    facebook: env.VITE_SOCIAL_FACEBOOK || "https://www.facebook.com/",
  },
};

export type SiteSettings = typeof siteSettings;