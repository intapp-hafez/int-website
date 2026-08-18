export type DefaultLocation = {
  country_en: string;
  country_ar: string;
  city_en: string;
  city_ar: string;
  is_active: boolean;
};

export type DefaultNationality = {
  name_en: string;
  name_ar: string;
  is_active: boolean;
};

export const DEFAULT_LOCATIONS: DefaultLocation[] = [
  // Egypt
  { country_en: "Egypt", country_ar: "مصر", city_en: "Cairo", city_ar: "القاهرة", is_active: true },
  { country_en: "Egypt", country_ar: "مصر", city_en: "Giza", city_ar: "الجيزة", is_active: true },
  { country_en: "Egypt", country_ar: "مصر", city_en: "Alexandria", city_ar: "الإسكندرية", is_active: true },
  { country_en: "Egypt", country_ar: "مصر", city_en: "New Cairo", city_ar: "القاهرة الجديدة", is_active: true },
  { country_en: "Egypt", country_ar: "مصر", city_en: "6th of October", city_ar: "السادس من أكتوبر", is_active: true },
  { country_en: "Egypt", country_ar: "مصر", city_en: "New Administrative Capital", city_ar: "العاصمة الإدارية الجديدة", is_active: true },
  { country_en: "Egypt", country_ar: "مصر", city_en: "Mansoura", city_ar: "المنصورة", is_active: true },

  // Saudi Arabia
  { country_en: "Saudi Arabia", country_ar: "المملكة العربية السعودية", city_en: "Riyadh", city_ar: "الرياض", is_active: true },
  { country_en: "Saudi Arabia", country_ar: "المملكة العربية السعودية", city_en: "Jeddah", city_ar: "جدة", is_active: true },
  { country_en: "Saudi Arabia", country_ar: "المملكة العربية السعودية", city_en: "Dammam", city_ar: "الدمام", is_active: true },
  { country_en: "Saudi Arabia", country_ar: "المملكة العربية السعودية", city_en: "Khobar", city_ar: "الخبر", is_active: true },
  { country_en: "Saudi Arabia", country_ar: "المملكة العربية السعودية", city_en: "Mecca", city_ar: "مكة المكرمة", is_active: true },
  { country_en: "Saudi Arabia", country_ar: "المملكة العربية السعودية", city_en: "Medina", city_ar: "المدينة المنورة", is_active: true },
  { country_en: "Saudi Arabia", country_ar: "المملكة العربية السعودية", city_en: "NEOM", city_ar: "نيوم", is_active: true },

  // United Arab Emirates
  { country_en: "United Arab Emirates", country_ar: "الإمارات العربية المتحدة", city_en: "Dubai", city_ar: "دبي", is_active: true },
  { country_en: "United Arab Emirates", country_ar: "الإمارات العربية المتحدة", city_en: "Abu Dhabi", city_ar: "أبوظبي", is_active: true },
  { country_en: "United Arab Emirates", country_ar: "الإمارات العربية المتحدة", city_en: "Sharjah", city_ar: "الشارقة", is_active: true },
  { country_en: "United Arab Emirates", country_ar: "الإمارات العربية المتحدة", city_en: "Ajman", city_ar: "عجمان", is_active: true },

  // Qatar
  { country_en: "Qatar", country_ar: "قطر", city_en: "Doha", city_ar: "الدوحة", is_active: true },
  { country_en: "Qatar", country_ar: "قطر", city_en: "Lusail", city_ar: "لوسيل", is_active: true },
  { country_en: "Qatar", country_ar: "قطر", city_en: "Al Rayyan", city_ar: "الريان", is_active: true },

  // Kuwait
  { country_en: "Kuwait", country_ar: "الكويت", city_en: "Kuwait City", city_ar: "مدينة الكويت", is_active: true },
  { country_en: "Kuwait", country_ar: "الكويت", city_en: "Hawalli", city_ar: "حولي", is_active: true },
  { country_en: "Kuwait", country_ar: "الكويت", city_en: "Salmiya", city_ar: "السالمية", is_active: true },

  // Bahrain
  { country_en: "Bahrain", country_ar: "البحرين", city_en: "Manama", city_ar: "المنامة", is_active: true },
  { country_en: "Bahrain", country_ar: "البحرين", city_en: "Muharraq", city_ar: "المحرق", is_active: true },

  // Oman
  { country_en: "Oman", country_ar: "سلطنة عمان", city_en: "Muscat", city_ar: "مسقط", is_active: true },
  { country_en: "Oman", country_ar: "سلطنة عمان", city_en: "Salalah", city_ar: "صلالة", is_active: true },

  // Jordan
  { country_en: "Jordan", country_ar: "الأردن", city_en: "Amman", city_ar: "عمان", is_active: true },
  { country_en: "Jordan", country_ar: "الأردن", city_en: "Aqaba", city_ar: "العقبة", is_active: true },

  // United States
  { country_en: "United States", country_ar: "الولايات المتحدة", city_en: "New York", city_ar: "نيويورك", is_active: true },
  { country_en: "United States", country_ar: "الولايات المتحدة", city_en: "San Francisco", city_ar: "سان فرانسيسكو", is_active: true },

  // United Kingdom
  { country_en: "United Kingdom", country_ar: "المملكة المتحدة", city_en: "London", city_ar: "لندن", is_active: true },

  // Germany
  { country_en: "Germany", country_ar: "ألمانيا", city_en: "Frankfurt", city_ar: "فرانكفورت", is_active: true },
];

export const DEFAULT_NATIONALITIES: DefaultNationality[] = [
  { name_en: "Egyptian", name_ar: "مصري", is_active: true },
  { name_en: "Saudi", name_ar: "سعودي", is_active: true },
  { name_en: "Emirati", name_ar: "إماراتي", is_active: true },
  { name_en: "Qatari", name_ar: "قطري", is_active: true },
  { name_en: "Kuwaiti", name_ar: "كويتي", is_active: true },
  { name_en: "Bahraini", name_ar: "بحريني", is_active: true },
  { name_en: "Omani", name_ar: "عماني", is_active: true },
  { name_en: "Jordanian", name_ar: "أردني", is_active: true },
  { name_en: "Lebanese", name_ar: "لبناني", is_active: true },
  { name_en: "Syrian", name_ar: "سوري", is_active: true },
  { name_en: "Iraqi", name_ar: "عراقي", is_active: true },
  { name_en: "Palestinian", name_ar: "فلسطيني", is_active: true },
  { name_en: "Sudanese", name_ar: "سوداني", is_active: true },
  { name_en: "Moroccan", name_ar: "مغربي", is_active: true },
  { name_en: "Tunisian", name_ar: "تونسي", is_active: true },
  { name_en: "Algerian", name_ar: "جزائري", is_active: true },
  { name_en: "Yemeni", name_ar: "يمني", is_active: true },
  { name_en: "British", name_ar: "بريطاني", is_active: true },
  { name_en: "American", name_ar: "أمريكي", is_active: true },
  { name_en: "German", name_ar: "ألماني", is_active: true },
  { name_en: "French", name_ar: "فرنسي", is_active: true },
  { name_en: "Indian", name_ar: "هندي", is_active: true },
  { name_en: "Pakistani", name_ar: "باكستاني", is_active: true },
  { name_en: "Turkish", name_ar: "تركي", is_active: true },
];
