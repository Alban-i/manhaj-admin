'use client';

import * as React from 'react';
import {
  Activity,
  AtSign,
  BookOpen,
  FileUser,
  Folder,
  GraduationCap,
  Hash,
  LifeBuoy,
  ListCheck,
  Send,
  StickyNote,
  TableOfContents,
  Tag,
  Twitter,
  Users,
  Image as ImageIcon,
  Music,
  Video,
  FileText,
  Globe,
  History,
  Palette,
  ImagePlus,
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

import { NavMain } from '@/components/layout/nav-main';
import { NavProjects } from '@/components/layout/nav-projects';
import { NavSecondary } from '@/components/layout/nav-secondary';
import { NavUser } from '@/components/layout/nav-user';
import { SidebarVersion } from '@/components/layout/sidebar-version';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Link } from '@/i18n/navigation';
import { isRtlLocale, type Locale } from '@/i18n/config';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const t = useTranslations('sidebar');
  const locale = useLocale();
  const isRtl = isRtlLocale(locale as Locale);

  const navMainData = [
    {
      title: t('admin'),
      url: '#',
      icon: Activity,
      isActive: true,
      items: [
        {
          title: t('profiles'),
          icon: GraduationCap,
          url: '/profiles',
        },
        {
          title: t('roles'),
          icon: ListCheck,
          url: '/roles',
        },
      ],
    },
    {
      title: t('contents'),
      url: '#',
      icon: TableOfContents,
      isActive: true,
      items: [
        {
          title: t('articles'),
          icon: StickyNote,
          url: '/articles',
        },
        {
          title: t('posts'),
          icon: Twitter,
          url: '/posts',
        },
        {
          title: t('categories'),
          icon: Tag,
          url: '/categories',
        },
        {
          title: t('tags'),
          icon: Hash,
          url: '/tags',
        },
        {
          title: t('glossaries'),
          icon: BookOpen,
          url: '/glossaries',
        },
        {
          title: t('timelines'),
          icon: History,
          url: '/timelines',
        },
      ],
    },
    {
      title: t('peopleAndTypes'),
      url: '#',
      icon: FileUser,
      isActive: true,
      items: [
        {
          title: t('individuals'),
          icon: FileUser,
          url: '/individuals',
        },
        {
          title: t('types'),
          icon: Users,
          url: '/types',
        },
        {
          title: t('classifications'),
          icon: Tag,
          url: '/classifications',
        },
      ],
    },
    {
      title: t('media'),
      url: '#',
      icon: Folder,
      isActive: true,
      items: [
        {
          title: t('audioFiles'),
          icon: Music,
          url: '/media/audio',
        },
        {
          title: t('images'),
          icon: ImageIcon,
          url: '/media/images',
        },
        {
          title: t('videos'),
          icon: Video,
          url: '/media/videos',
        },
        {
          title: t('documents'),
          icon: FileText,
          url: '/media/documents',
        },
      ],
    },
    {
      title: t('imageGenerator'),
      url: '#',
      icon: ImagePlus,
      isActive: true,
      items: [
        {
          title: t('imageProjects'),
          icon: ImageIcon,
          url: '/images',
        },
        {
          title: t('imagePresets'),
          icon: Palette,
          url: '/images/presets',
        },
      ],
    },
  ];

  const navSecondaryData = [
    {
      title: t('support'),
      url: '#',
      icon: LifeBuoy,
    },
    {
      title: t('feedback'),
      url: '#',
      icon: Send,
    },
  ];

  const projectsData = [
    {
      name: t('emails'),
      url: '/emails',
      icon: AtSign,
    },
    {
      name: t('languages'),
      url: '/languages',
      icon: Globe,
    },
  ];

  return (
    <Sidebar variant="inset" collapsible="icon" side={isRtl ? 'right' : 'left'} {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg">
              <Link href="/" className="cursor-pointer">
                <div className="bg-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                </div>
                <div className="grid flex-1 text-start text-sm leading-tight">
                  <span className="truncate font-semibold font-fira uppercase">
                    {t('manhajSalafi')}
                  </span>
                  <span className="truncate text-xs">{t('researchCenter')}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainData} />
        <NavProjects projects={projectsData} />
        <SidebarVersion />
        <NavSecondary items={navSecondaryData} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
