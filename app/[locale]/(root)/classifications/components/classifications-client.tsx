'use client';

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
import { ClassificationWithTranslations, Language } from '@/types/types';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { localeFlags } from '@/i18n/config';
import { useTranslations } from 'next-intl';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ClassificationsClientProps {
  classifications: ClassificationWithTranslations[];
  languages: Language[];
  currentLocale: string;
}

const ClassificationsClient: React.FC<ClassificationsClientProps> = ({
  classifications,
  languages,
  currentLocale,
}) => {
  const router = useRouter();
  const t = useTranslations('classifications');

  // Get localized name for a classification
  const getLocalizedName = (classification: ClassificationWithTranslations) => {
    const translation = classification.translations.find(
      (tr) => tr.language === currentLocale
    );
    const arabicTranslation = classification.translations.find(
      (tr) => tr.language === 'ar'
    );
    return translation?.name ?? arabicTranslation?.name ?? classification.slug;
  };

  // Check if a translation exists
  const hasTranslation = (
    classification: ClassificationWithTranslations,
    langCode: string
  ) => {
    const translation = classification.translations.find(
      (tr) => tr.language === langCode
    );
    return translation && translation.name && translation.name.trim() !== '';
  };

  return (
    <div className="grid gap-3 px-4">
      {/* TOP FIRST LINE */}
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-bold">{t('title')}</h2>
      </div>

      {/* TABLE */}
      <Card>
        <CardHeader>
          <CardTitle>{t('listOfClassifications')}</CardTitle>
          <CardDescription>{t('listDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('slug')}</TableHead>
                <TableHead>{t('name')}</TableHead>
                <TableHead>{t('translations')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classifications.map((classification) => (
                <TableRow
                  key={classification.id}
                  className={cn('cursor-pointer hover:bg-secondary/50')}
                  onClick={() =>
                    router.push(`/classifications/${classification.slug}`)
                  }
                >
                  <TableCell className="font-mono text-sm">
                    {classification.slug}
                  </TableCell>
                  <TableCell className="font-bold">
                    {getLocalizedName(classification)}
                  </TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <div className="flex gap-1">
                        {languages.map((lang) => (
                          <Tooltip key={lang.code}>
                            <TooltipTrigger asChild>
                              <Badge
                                variant={
                                  hasTranslation(classification, lang.code)
                                    ? 'default'
                                    : 'outline'
                                }
                                className={cn(
                                  'text-xs cursor-default',
                                  !hasTranslation(classification, lang.code) &&
                                    'opacity-40'
                                )}
                              >
                                {localeFlags[lang.code] ?? lang.code}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              {hasTranslation(classification, lang.code)
                                ? classification.translations.find(
                                    (tr) => tr.language === lang.code
                                  )?.name
                                : t('noTranslation')}
                            </TooltipContent>
                          </Tooltip>
                        ))}
                      </div>
                    </TooltipProvider>
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

export default ClassificationsClient;
