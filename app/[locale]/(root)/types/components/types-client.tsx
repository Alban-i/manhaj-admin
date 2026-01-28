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
import { TypeWithTranslations, Language } from '@/types/types';
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

interface TypesClientProps {
  types: TypeWithTranslations[];
  languages: Language[];
  currentLocale: string;
}

const TypesClient: React.FC<TypesClientProps> = ({
  types,
  languages,
  currentLocale,
}) => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const t = useTranslations('types');

  // Get localized name for a type
  const getLocalizedName = (type: TypeWithTranslations) => {
    const translation = type.translations.find(
      (tr) => tr.language === currentLocale
    );
    const arabicTranslation = type.translations.find(
      (tr) => tr.language === 'ar'
    );
    return translation?.name ?? arabicTranslation?.name ?? type.slug;
  };

  // Get localized description for a type
  const getLocalizedDescription = (type: TypeWithTranslations) => {
    const translation = type.translations.find(
      (tr) => tr.language === currentLocale
    );
    const arabicTranslation = type.translations.find(
      (tr) => tr.language === 'ar'
    );
    return translation?.description ?? arabicTranslation?.description ?? '';
  };

  // Get localized classification name
  const getClassificationName = (type: TypeWithTranslations) => {
    if (!type.classification) return '—';
    const translation = type.classification.translations?.find(
      (tr) => tr.language === currentLocale
    );
    const arabicTranslation = type.classification.translations?.find(
      (tr) => tr.language === 'ar'
    );
    return (
      translation?.name ?? arabicTranslation?.name ?? type.classification.slug
    );
  };

  // Check if a translation exists
  const hasTranslation = (type: TypeWithTranslations, langCode: string) => {
    const translation = type.translations.find(
      (tr) => tr.language === langCode
    );
    return translation && translation.name && translation.name.trim() !== '';
  };

  const filteredTypes = types.filter((type) => {
    const localizedName = getLocalizedName(type);
    return localizedName?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="grid gap-3 px-4">
      {/* TOP FIRST LINE */}
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-bold">{t('title')}</h2>
        <div className="ml-auto flex items-center gap-2">
          <Button onClick={() => router.push('/types/new')} className="gap-1">
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
            <CardTitle>{t('listOfTypes')}</CardTitle>
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
                <TableHead>{t('classification')}</TableHead>
                <TableHead>{t('translations')}</TableHead>
                <TableHead>{t('createdAt')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTypes.map((type) => (
                <TableRow
                  key={type.id}
                  className={cn('cursor-pointer hover:bg-secondary/50')}
                  onClick={() => router.push(`/types/${type.slug}`)}
                >
                  <TableCell className="font-bold">
                    {getLocalizedName(type)}
                  </TableCell>
                  <TableCell>{getClassificationName(type)}</TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <div className="flex gap-1">
                        {languages.map((lang) => (
                          <Tooltip key={lang.code}>
                            <TooltipTrigger asChild>
                              <Badge
                                variant="outline"
                                className={cn(
                                  'text-xs cursor-default',
                                  !hasTranslation(type, lang.code) &&
                                    'opacity-40'
                                )}
                              >
                                {localeFlags[lang.code] ?? lang.code}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              {hasTranslation(type, lang.code)
                                ? type.translations.find(
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
                    {type.created_at
                      ? new Date(type.created_at).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
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

export default TypesClient;
