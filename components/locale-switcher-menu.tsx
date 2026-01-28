'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { locales, localeNames, localeFlags, type Locale } from '@/i18n/config';
import {
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';

export function LocaleSwitcherMenu() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale as Locale });
  };

  return (
    <DropdownMenuRadioGroup value={locale} onValueChange={handleLocaleChange}>
      {locales.map((l) => (
        <DropdownMenuRadioItem key={l} value={l} className="flex gap-2">
          <span>{localeFlags[l]}</span>
          <span>{localeNames[l]}</span>
        </DropdownMenuRadioItem>
      ))}
    </DropdownMenuRadioGroup>
  );
}
