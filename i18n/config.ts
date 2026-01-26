export const locales = ['ar', 'en', 'fr'] as const;
export const defaultLocale = 'ar' as const;

export type Locale = (typeof locales)[number];

export const rtlLocales: Locale[] = ['ar'];

export const localeNames: Record<Locale, string> = {
  ar: 'العربية',
  en: 'English',
  fr: 'Français',
};

export function isRtlLocale(locale: Locale): boolean {
  return rtlLocales.includes(locale);
}
