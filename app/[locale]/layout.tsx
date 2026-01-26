import type { Metadata } from 'next';
import {
  Fira_Sans_Condensed,
  Geist,
  Geist_Mono,
  Scheherazade_New,
  Oxanium,
} from 'next/font/google';
import { Toaster } from 'sonner';
import '../globals.css';
import '../editor.css';
import NextTopLoader from 'nextjs-toploader';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

import AccountServer from '@/components/layout/account-server';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ReactQueryClientProvider } from '@/providers/react-query-client-provider';
import { ThemeProvider } from '@/providers/theme-providers';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { locales, isRtlLocale, type Locale } from '@/i18n/config';
import { routing } from '@/i18n/navigation';

const fira_font = Fira_Sans_Condensed({
  weight: ['300', '400', '500', '600', '700', '800'],
  style: ['normal'],
  subsets: ['latin'],
  variable: '--font-fira',
  display: 'swap',
});

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const arabic_font = Scheherazade_New({
  weight: ['400', '500', '600', '700'],
  variable: '--font-arabic',
  subsets: ['arabic'],
  display: 'swap',
});

const oxanium = Oxanium({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-oxanium',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Obs Admin',
  description: 'Obs Admin',
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  const messages = await getMessages();
  const isRtl = isRtlLocale(locale as Locale);

  return (
    <html lang={locale} dir={isRtl ? 'rtl' : 'ltr'}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${fira_font.variable} ${oxanium.variable} ${arabic_font.variable} antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Toaster position="top-center" duration={3000} richColors />
            <NextTopLoader color="#B9795D" height={5} />
            <AccountServer />

            <ReactQueryClientProvider>
              <NuqsAdapter>
                <TooltipProvider>
                  <div data-vaul-drawer-wrapper="">{children}</div>
                </TooltipProvider>
              </NuqsAdapter>
            </ReactQueryClientProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
