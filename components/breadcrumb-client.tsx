'use client';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { usePathname, Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Fragment } from 'react';

const BreadcrumbClient = () => {
  const pathname = usePathname(); // Returns pathname without locale prefix
  const t = useTranslations('breadcrumb');

  // Split pathname into segments
  const pathSegments = pathname.split('/').filter(Boolean);

  // Detect and exclude empty grouping folders dynamically
  const filteredSegments = pathSegments.filter(
    (segment, index, allSegments) => {
      if (index === 0) return true; // Always keep the first segment (e.g., "sessions")

      const parentSegment = allSegments[index - 1]; // Previous segment
      return segment !== parentSegment.slice(0, -1); // Exclude if it's singular form of the parent
    }
  );

  // Capitalize function and format slugs
  const formatSegment = (segment: string) => {
    // If it's a simple word (like 'articles', 'posts'), capitalize it
    if (/^[a-zA-Z]+$/.test(segment)) {
      return segment.charAt(0).toUpperCase() + segment.slice(1);
    }

    // If it's a slug (contains hyphens or is complex), make it readable
    if (segment.includes('-')) {
      return segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }

    // For UUIDs or other complex identifiers, show as-is
    return segment;
  };

  // Build breadcrumb items
  const breadcrumbs = filteredSegments.map((segment, index) => {
    const href = '/' + filteredSegments.slice(0, index + 1).join('/');
    return { label: formatSegment(segment), href };
  });

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {/* Home Link */}
        <BreadcrumbItem key="home" className="hidden md:block">
          <BreadcrumbLink asChild>
            <Link href="/">{t('home')}</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {breadcrumbs.map((breadcrumb, index) => (
          <Fragment key={breadcrumb.href}>
            <BreadcrumbSeparator className="hidden md:block rtl:rotate-180" />
            <BreadcrumbItem>
              {index === breadcrumbs.length - 1 ? (
                <BreadcrumbPage>{breadcrumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={breadcrumb.href}>{breadcrumb.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default BreadcrumbClient;
