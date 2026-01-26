import { type NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { updateSession } from '@/providers/supabase/middleware';
import { routing } from '@/i18n/navigation';
import { locales, defaultLocale, type Locale } from '@/i18n/config';
import {
  getArticleSlugById,
  getPostSlugById,
  getMediaSlugById,
  getCategorySlugById,
  getTagSlugById,
  getRoleSlugById,
  getTypeSlugById,
  getIndividualSlugById,
} from '@/lib/redirects';

const intlMiddleware = createMiddleware(routing);

// Helper function to extract locale from pathname
function getLocaleFromPathname(pathname: string): Locale {
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];
  if (firstSegment && locales.includes(firstSegment as Locale)) {
    return firstSegment as Locale;
  }
  return defaultLocale;
}

// Helper function to get pathname without locale
function getPathnameWithoutLocale(pathname: string): string {
  const locale = getLocaleFromPathname(pathname);
  const withoutLocale = pathname.replace(`/${locale}`, '') || '/';
  return withoutLocale;
}

export async function proxy(request: NextRequest) {
  console.log('Request URL:', request.url);

  const pathname = request.nextUrl.pathname;

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // static files
  ) {
    return NextResponse.next();
  }

  // First, handle i18n routing
  const intlResponse = intlMiddleware(request);

  // If intlMiddleware did a redirect, return it
  if (intlResponse.status !== 200) {
    return intlResponse;
  }

  // Get the pathname without locale for redirect handling
  const pathnameWithoutLocale = getPathnameWithoutLocale(pathname);
  const locale = getLocaleFromPathname(pathname);

  // Handle ID-based URL redirects to slug-based URLs
  const redirectUrl = await handleIdRedirects(request, pathnameWithoutLocale, locale);
  if (redirectUrl) {
    // Copy cookies from intl middleware to redirect response
    const redirectResponse = NextResponse.redirect(redirectUrl);
    for (const cookie of intlResponse.cookies.getAll()) {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    }
    return redirectResponse;
  }

  // Handle auth with the locale-aware request
  const authResponse = await updateSession(request);

  // If auth middleware returned a response, merge cookies from intl middleware
  if (authResponse) {
    for (const cookie of intlResponse.cookies.getAll()) {
      authResponse.cookies.set(cookie.name, cookie.value);
    }
    return authResponse;
  }

  return intlResponse;
}

async function handleIdRedirects(request: NextRequest, pathname: string, locale: Locale): Promise<URL | null> {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const numericPattern = /^\d+$/;

  // Article redirects: /articles/[uuid] -> /articles/[slug]
  const articleMatch = pathname.match(/^\/articles\/([a-f0-9-]+)$/);
  if (articleMatch && uuidPattern.test(articleMatch[1])) {
    const slug = await getArticleSlugById(articleMatch[1]);
    if (slug) {
      const url = new URL(request.url);
      url.pathname = `/${locale}/articles/${slug}`;
      return url;
    }
  }

  // Post redirects: /posts/[number] -> /posts/[slug]
  const postMatch = pathname.match(/^\/posts\/(\d+)$/);
  if (postMatch && numericPattern.test(postMatch[1])) {
    const slug = await getPostSlugById(postMatch[1]);
    if (slug) {
      const url = new URL(request.url);
      url.pathname = `/${locale}/posts/${slug}`;
      return url;
    }
  }

  // Media redirects: /media/[type]/[uuid] -> /media/[type]/[slug]
  const mediaMatch = pathname.match(/^\/media\/(audio|images|videos|documents)\/([a-f0-9-]+)$/);
  if (mediaMatch && uuidPattern.test(mediaMatch[2])) {
    const slug = await getMediaSlugById(mediaMatch[2]);
    if (slug) {
      const url = new URL(request.url);
      url.pathname = `/${locale}/media/${mediaMatch[1]}/${slug}`;
      return url;
    }
  }

  // Category redirects: /categories/[number] -> /categories/[slug]
  const categoryMatch = pathname.match(/^\/categories\/(\d+)$/);
  if (categoryMatch && numericPattern.test(categoryMatch[1])) {
    const slug = await getCategorySlugById(categoryMatch[1]);
    if (slug) {
      const url = new URL(request.url);
      url.pathname = `/${locale}/categories/${slug}`;
      return url;
    }
  }

  // Tag redirects: /tags/[number] -> /tags/[slug]
  const tagMatch = pathname.match(/^\/tags\/(\d+)$/);
  if (tagMatch && numericPattern.test(tagMatch[1])) {
    const slug = await getTagSlugById(tagMatch[1]);
    if (slug) {
      const url = new URL(request.url);
      url.pathname = `/${locale}/tags/${slug}`;
      return url;
    }
  }

  // Role redirects: /roles/[number] -> /roles/[slug]
  const roleMatch = pathname.match(/^\/roles\/(\d+)$/);
  if (roleMatch && numericPattern.test(roleMatch[1])) {
    const slug = await getRoleSlugById(roleMatch[1]);
    if (slug) {
      const url = new URL(request.url);
      url.pathname = `/${locale}/roles/${slug}`;
      return url;
    }
  }

  // Type redirects: /types/[number] -> /types/[slug]
  const typeMatch = pathname.match(/^\/types\/(\d+)$/);
  if (typeMatch && numericPattern.test(typeMatch[1])) {
    const slug = await getTypeSlugById(typeMatch[1]);
    if (slug) {
      const url = new URL(request.url);
      url.pathname = `/${locale}/types/${slug}`;
      return url;
    }
  }

  // Individual redirects: /individuals/[number] -> /individuals/[slug]
  const individualMatch = pathname.match(/^\/individuals\/(\d+)$/);
  if (individualMatch && numericPattern.test(individualMatch[1])) {
    const slug = await getIndividualSlugById(individualMatch[1]);
    if (slug) {
      const url = new URL(request.url);
      url.pathname = `/${locale}/individuals/${slug}`;
      return url;
    }
  }

  return null;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - .css (CSS files)
     * - api (API routes)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css)$).*)',
  ],
};
