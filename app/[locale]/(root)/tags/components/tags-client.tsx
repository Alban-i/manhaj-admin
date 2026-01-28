'use client';

import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TagWithTranslations, Language } from '@/types/types';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { localeFlags } from '@/i18n/config';
import { useTranslations } from 'next-intl';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TagsClientProps {
  tags: TagWithTranslations[];
  languages: Language[];
  currentLocale: string;
}

const TagsClient: React.FC<TagsClientProps> = ({
  tags,
  languages,
  currentLocale,
}) => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const t = useTranslations('tags');

  // Get Arabic name for a tag (primary display name)
  const getArabicName = (tag: TagWithTranslations) => {
    const arabicTranslation = tag.translations.find((tr) => tr.language === 'ar');
    return arabicTranslation?.name ?? tag.slug;
  };

  // Get localized name for a tag
  const getLocalizedName = (tag: TagWithTranslations) => {
    const translation = tag.translations.find(
      (tr) => tr.language === currentLocale
    );
    const arabicTranslation = tag.translations.find((tr) => tr.language === 'ar');
    return translation?.name ?? arabicTranslation?.name ?? tag.slug;
  };

  const filteredTags = tags.filter((tag) => {
    const arabicName = getArabicName(tag);
    return arabicName?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Check if a translation exists and is different from the default
  const hasTranslation = (tag: TagWithTranslations, langCode: string) => {
    const translation = tag.translations.find((tr) => tr.language === langCode);
    return translation && translation.name && translation.name.trim() !== '';
  };

  return (
    <div className="grid gap-3 px-4">
      {/* TOP FIRST LINE */}
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-bold">{t('title')}</h2>
        <div className="ml-auto flex items-center gap-2">
          <Button onClick={() => router.push('/tags/new')} className="gap-1">
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              {t('new')}
            </span>
          </Button>
        </div>
      </div>

      {/* TABLE */}
      <Card>
        <CardHeader className="grid grid-cols-[1fr_auto] gap-2">
          <div className="flex flex-col items-start gap-2">
            <CardTitle>{t('listOfTags')}</CardTitle>
            <CardDescription>{t('listDescription')}</CardDescription>
          </div>

          <Input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border p-2 rounded w-[300px]"
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('name')}</TableHead>
                <TableHead>{t('translations')}</TableHead>
                <TableHead>{t('createdAt')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTags.map((tag) => (
                <TableRow
                  key={tag.id}
                  className={cn('cursor-pointer hover:bg-secondary/50')}
                  onClick={() => router.push(`/tags/${tag.slug}`)}
                >
                  <TableCell>{getLocalizedName(tag)}</TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <div className="flex gap-1">
                        {languages.map((lang) => (
                          <Tooltip key={lang.code}>
                            <TooltipTrigger asChild>
                              <Badge
                                variant={
                                  hasTranslation(tag, lang.code)
                                    ? 'default'
                                    : 'outline'
                                }
                                className={cn(
                                  'text-xs cursor-default',
                                  !hasTranslation(tag, lang.code) &&
                                    'opacity-40'
                                )}
                              >
                                {localeFlags[lang.code] ?? lang.code}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              {hasTranslation(tag, lang.code)
                                ? tag.translations.find(
                                    (tr) => tr.language === lang.code
                                  )?.name
                                : t('noTranslation')}
                            </TooltipContent>
                          </Tooltip>
                        ))}
                      </div>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>
                    {tag.created_at
                      ? new Date(tag.created_at).toLocaleString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : ''}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default TagsClient;
