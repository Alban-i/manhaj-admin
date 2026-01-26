'use client';

import { useLocale } from 'next-intl';
import { isRtlLocale, type Locale } from '@/i18n/config';

export function useDirection() {
  const locale = useLocale() as Locale;
  const isRtl = isRtlLocale(locale);

  return {
    isRtl,
    direction: isRtl ? 'rtl' : 'ltr',
    locale,
  } as const;
}
