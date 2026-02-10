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
import { FatwaClassificationWithTranslations, Language } from '@/types/types';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { localeFlags } from '@/i18n/config';
import { useTranslations } from 'next-intl';
import { PlusCircle } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { createClient } from '@/providers/supabase/client';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface FatwaClassificationsClientProps {
  classifications: FatwaClassificationWithTranslations[];
  languages: Language[];
  currentLocale: string;
}

const FatwaClassificationsClient: React.FC<FatwaClassificationsClientProps> = ({
  classifications,
  languages,
  currentLocale,
}) => {
  const router = useRouter();
  const t = useTranslations('fatwaClassifications');
  const supabase = createClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newSlug, setNewSlug] = useState('');
  const [newDisplayOrder, setNewDisplayOrder] = useState(0);
  const [newTranslations, setNewTranslations] = useState<Record<string, { name: string; description: string }>>({});

  const getLocalizedName = (classification: FatwaClassificationWithTranslations) => {
    const translation = classification.fatwa_classification_translations.find(
      (tr) => tr.language === currentLocale
    );
    const arabicTranslation = classification.fatwa_classification_translations.find(
      (tr) => tr.language === 'ar'
    );
    return translation?.name ?? arabicTranslation?.name ?? classification.slug;
  };

  const hasTranslation = (
    classification: FatwaClassificationWithTranslations,
    langCode: string
  ) => {
    const translation = classification.fatwa_classification_translations.find(
      (tr) => tr.language === langCode
    );
    return translation && translation.name && translation.name.trim() !== '';
  };

  const handleCreate = async () => {
    if (!newSlug.trim()) {
      toast.error('Slug is required');
      return;
    }

    try {
      setLoading(true);

      // Create classification
      const { data: newClassification, error: clsError } = await supabase
        .from('fatwa_classifications')
        .insert({
          slug: newSlug.trim(),
          display_order: newDisplayOrder,
        })
        .select()
        .single();

      if (clsError) {
        toast.error(clsError.message);
        return;
      }

      // Insert translations
      const translationEntries = Object.entries(newTranslations)
        .filter(([_, data]) => data.name.trim() !== '');

      if (translationEntries.length > 0) {
        const translationData = translationEntries.map(([language, data]) => ({
          classification_id: newClassification.id,
          language,
          name: data.name.trim(),
          description: data.description?.trim() || null,
        }));

        const { error: trError } = await supabase
          .from('fatwa_classification_translations')
          .insert(translationData);

        if (trError) {
          toast.error(trError.message);
          return;
        }
      }

      toast.success(t('classificationCreated'));
      setDialogOpen(false);
      setNewSlug('');
      setNewDisplayOrder(0);
      setNewTranslations({});
      router.refresh();
    } catch (error) {
      toast.error(t('somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-3 px-4">
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-bold">{t('title')}</h2>
        <div className="ml-auto">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-1">
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  {t('newClassification')}
                </span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t('newClassification')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>{t('slug')}</Label>
                  <Input
                    placeholder={t('slugPlaceholder')}
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('displayOrder')}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={newDisplayOrder}
                    onChange={(e) => setNewDisplayOrder(Number(e.target.value))}
                  />
                </div>
                {languages.map((lang) => (
                  <div key={lang.code} className="space-y-2 p-3 border rounded-md">
                    <span className="text-sm font-medium">{lang.native_name}</span>
                    <div className="space-y-2">
                      <Label>{t('name')}</Label>
                      <Input
                        placeholder={`${t('classificationNameIn')} ${lang.name}`}
                        dir={lang.direction}
                        value={newTranslations[lang.code]?.name ?? ''}
                        onChange={(e) =>
                          setNewTranslations((prev) => ({
                            ...prev,
                            [lang.code]: {
                              ...prev[lang.code],
                              name: e.target.value,
                              description: prev[lang.code]?.description ?? '',
                            },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('description')}</Label>
                      <Textarea
                        placeholder={`${t('classificationDescriptionIn')} ${lang.name}`}
                        dir={lang.direction}
                        rows={2}
                        value={newTranslations[lang.code]?.description ?? ''}
                        onChange={(e) =>
                          setNewTranslations((prev) => ({
                            ...prev,
                            [lang.code]: {
                              ...prev[lang.code],
                              name: prev[lang.code]?.name ?? '',
                              description: e.target.value,
                            },
                          }))
                        }
                      />
                    </div>
                  </div>
                ))}
                <Button onClick={handleCreate} disabled={loading} className="w-full">
                  {loading ? '...' : t('create')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

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
                <TableHead>{t('displayOrder')}</TableHead>
                <TableHead>{t('translations')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classifications.map((classification) => (
                <TableRow
                  key={classification.id}
                  className={cn('cursor-pointer hover:bg-secondary/50')}
                  onClick={() =>
                    router.push(`/fatwa-classifications/${classification.id}`)
                  }
                >
                  <TableCell className="font-mono text-sm">
                    {classification.slug}
                  </TableCell>
                  <TableCell className="font-bold">
                    {getLocalizedName(classification)}
                  </TableCell>
                  <TableCell>
                    {classification.display_order ?? 0}
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
                                ? classification.fatwa_classification_translations.find(
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
              {classifications.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No classifications found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default FatwaClassificationsClient;
