export const locales = ['ar', 'en', 'fr'] as const;
export const defaultLocale = 'ar' as const;

export type Locale = (typeof locales)[number];

export const rtlLocales: Locale[] = ['ar'];

export const localeNames: Record<Locale, string> = {
  ar: 'العربية',
  en: 'English',
  fr: 'Français',
};

export const localeFlags: Record<string, string> = {
  ar: '🇸🇦',
  en: '🇬🇧',
  fr: '🇫🇷',
  de: '🇩🇪',
  es: '🇪🇸',
  it: '🇮🇹',
  pt: '🇵🇹',
  tr: '🇹🇷',
  ur: '🇵🇰',
  id: '🇮🇩',
  ms: '🇲🇾',
};

export function getLanguageWithFlag(code: string, name: string): string {
  const flag = localeFlags[code];
  return flag ? `${flag} ${name}` : name;
}

export function isRtlLocale(locale: Locale): boolean {
  return rtlLocales.includes(locale);
}
