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
import {
  PlusCircle,
  ChevronRight,
  ChevronDown,
  GripVertical,
} from 'lucide-react';
import { Fragment, useEffect, useMemo, useState } from 'react';
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
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { reorderFatwaClassifications } from '@/actions/reorder-fatwa-classifications';

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

  const [localClassifications, setLocalClassifications] =
    useState(classifications);

  useEffect(() => {
    setLocalClassifications(classifications);
  }, [classifications]);

  const { topLevel, childrenMap } = useMemo(() => {
    const top: FatwaClassificationWithTranslations[] = [];
    const children = new Map<number, FatwaClassificationWithTranslations[]>();
    for (const c of localClassifications) {
      if (c.parent_id === null) {
        top.push(c);
      } else {
        const existing = children.get(c.parent_id) ?? [];
        existing.push(c);
        children.set(c.parent_id, existing);
      }
    }
    top.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
    for (const [, arr] of children) {
      arr.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
    }
    return { topLevel: top, childrenMap: children };
  }, [localClassifications]);

  const [expandedBooks, setExpandedBooks] = useState<Set<number>>(() => {
    return new Set(classifications.filter((c) => c.parent_id === null).map((b) => b.id));
  });

  const toggleBook = (id: number) => {
    setExpandedBooks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeGroup = active.data.current?.group as string | undefined;
    const overGroup = over.data.current?.group as string | undefined;
    if (!activeGroup || activeGroup !== overGroup) return;

    if (activeGroup === 'books') {
      const oldIndex = topLevel.findIndex((b) => b.id === active.id);
      const newIndex = topLevel.findIndex((b) => b.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;
      const reordered = arrayMove(topLevel, oldIndex, newIndex);

      setLocalClassifications((prev) => {
        const next = [...prev];
        for (let i = 0; i < reordered.length; i++) {
          const idx = next.findIndex((c) => c.id === reordered[i].id);
          if (idx !== -1) next[idx] = { ...next[idx], display_order: i };
        }
        return next;
      });

      const items = reordered.map((item, i) => ({
        id: item.id,
        display_order: i,
      }));
      const result = await reorderFatwaClassifications(items);
      if (!result.success) {
        toast.error(result.error ?? 'Failed to reorder');
        setLocalClassifications(classifications);
      }
    } else {
      const parentId = Number(activeGroup.replace('children-', ''));
      const children = childrenMap.get(parentId) ?? [];
      const oldIndex = children.findIndex((c) => c.id === active.id);
      const newIndex = children.findIndex((c) => c.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;
      const reordered = arrayMove(children, oldIndex, newIndex);

      setLocalClassifications((prev) => {
        const next = [...prev];
        for (let i = 0; i < reordered.length; i++) {
          const idx = next.findIndex((c) => c.id === reordered[i].id);
          if (idx !== -1) next[idx] = { ...next[idx], display_order: i };
        }
        return next;
      });

      const items = reordered.map((item, i) => ({
        id: item.id,
        display_order: i,
      }));
      const result = await reorderFatwaClassifications(items);
      if (!result.success) {
        toast.error(result.error ?? 'Failed to reorder');
        setLocalClassifications(classifications);
      }
    }
  };

  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newSlug, setNewSlug] = useState('');
  const [newDisplayOrder, setNewDisplayOrder] = useState(0);
  const [newTranslations, setNewTranslations] = useState<
    Record<string, { name: string; description: string }>
  >({});

  const getLocalizedName = (
    classification: FatwaClassificationWithTranslations
  ) => {
    const translation =
      classification.fatwa_classification_translations.find(
        (tr) => tr.language === currentLocale
      );
    const arabicTranslation =
      classification.fatwa_classification_translations.find(
        (tr) => tr.language === 'ar'
      );
    return translation?.name ?? arabicTranslation?.name ?? classification.slug;
  };

  const hasTranslation = (
    classification: FatwaClassificationWithTranslations,
    langCode: string
  ) => {
    const translation =
      classification.fatwa_classification_translations.find(
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

      const translationEntries = Object.entries(newTranslations).filter(
        ([, data]) => data.name.trim() !== ''
      );

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
    } catch {
      toast.error(t('somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };

  const bookIds = topLevel.map((b) => b.id);

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
                  <div
                    key={lang.code}
                    className="space-y-2 p-3 border rounded-md"
                  >
                    <span className="text-sm font-medium">
                      {lang.native_name}
                    </span>
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
                              description:
                                prev[lang.code]?.description ?? '',
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
                <Button
                  onClick={handleCreate}
                  disabled={loading}
                  className="w-full"
                >
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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" />
                  <TableHead>{t('name')}</TableHead>
                  <TableHead>{t('slug')}</TableHead>
                  <TableHead>{t('displayOrder')}</TableHead>
                  <TableHead>{t('translations')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topLevel.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No classifications found.
                    </TableCell>
                  </TableRow>
                )}
                <SortableContext
                  items={bookIds}
                  strategy={verticalListSortingStrategy}
                >
                  {topLevel.map((book) => {
                    const children = childrenMap.get(book.id) ?? [];
                    const isExpanded = expandedBooks.has(book.id);
                    const childIds = children.map((c) => c.id);
                    return (
                      <Fragment key={book.id}>
                        <SortableBookRow
                          book={book}
                          childCount={children.length}
                          isExpanded={isExpanded}
                          onToggle={() => toggleBook(book.id)}
                          onNavigate={() =>
                            router.push(`/fatwa-classifications/${book.id}`)
                          }
                          getLocalizedName={getLocalizedName}
                          languages={languages}
                          hasTranslation={hasTranslation}
                          t={t}
                        />
                        {isExpanded && children.length > 0 && (
                          <SortableContext
                            items={childIds}
                            strategy={verticalListSortingStrategy}
                          >
                            {children.map((child) => (
                              <SortableChildRow
                                key={child.id}
                                child={child}
                                parentId={book.id}
                                onNavigate={() =>
                                  router.push(
                                    `/fatwa-classifications/${child.id}`
                                  )
                                }
                                getLocalizedName={getLocalizedName}
                                languages={languages}
                                hasTranslation={hasTranslation}
                                t={t}
                              />
                            ))}
                          </SortableContext>
                        )}
                      </Fragment>
                    );
                  })}
                </SortableContext>
              </TableBody>
            </Table>
          </DndContext>
        </CardContent>
      </Card>
    </div>
  );
};

function SortableBookRow({
  book,
  childCount,
  isExpanded,
  onToggle,
  onNavigate,
  getLocalizedName,
  languages,
  hasTranslation,
  t,
}: {
  book: FatwaClassificationWithTranslations;
  childCount: number;
  isExpanded: boolean;
  onToggle: () => void;
  onNavigate: () => void;
  getLocalizedName: (c: FatwaClassificationWithTranslations) => string;
  languages: Language[];
  hasTranslation: (
    c: FatwaClassificationWithTranslations,
    lang: string
  ) => boolean | '' | undefined;
  t: (key: string) => string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: book.id,
    data: { group: 'books' },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="bg-muted/40 hover:bg-muted/60"
    >
      <TableCell className="w-10 px-2">
        <button
          ref={setActivatorNodeRef}
          {...listeners}
          className="cursor-grab touch-none rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </TableCell>
      <TableCell className="font-bold">
        <div className="flex items-center gap-2">
          {childCount > 0 ? (
            <button
              className="p-0.5 rounded hover:bg-muted"
              onClick={onToggle}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          ) : (
            <span className="w-5" />
          )}
          <span
            className="cursor-pointer hover:underline"
            onClick={onNavigate}
          >
            {getLocalizedName(book)}
          </span>
          {childCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {childCount}
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="font-mono text-sm">{book.slug}</TableCell>
      <TableCell>{book.display_order ?? 0}</TableCell>
      <TableCell>
        <TranslationBadges
          classification={book}
          languages={languages}
          hasTranslation={hasTranslation}
          t={t}
        />
      </TableCell>
    </TableRow>
  );
}

function SortableChildRow({
  child,
  parentId,
  onNavigate,
  getLocalizedName,
  languages,
  hasTranslation,
  t,
}: {
  child: FatwaClassificationWithTranslations;
  parentId: number;
  onNavigate: () => void;
  getLocalizedName: (c: FatwaClassificationWithTranslations) => string;
  languages: Language[];
  hasTranslation: (
    c: FatwaClassificationWithTranslations,
    lang: string
  ) => boolean | '' | undefined;
  t: (key: string) => string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: child.id,
    data: { group: `children-${parentId}` },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="hover:bg-secondary/50"
    >
      <TableCell className="w-10 px-2">
        <button
          ref={setActivatorNodeRef}
          {...listeners}
          className="cursor-grab touch-none rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </TableCell>
      <TableCell>
        <div className="pl-8">
          <span
            className="cursor-pointer hover:underline"
            onClick={onNavigate}
          >
            {getLocalizedName(child)}
          </span>
        </div>
      </TableCell>
      <TableCell className="font-mono text-sm">{child.slug}</TableCell>
      <TableCell>{child.display_order ?? 0}</TableCell>
      <TableCell>
        <TranslationBadges
          classification={child}
          languages={languages}
          hasTranslation={hasTranslation}
          t={t}
        />
      </TableCell>
    </TableRow>
  );
}

function TranslationBadges({
  classification,
  languages,
  hasTranslation,
  t,
}: {
  classification: FatwaClassificationWithTranslations;
  languages: Language[];
  hasTranslation: (
    c: FatwaClassificationWithTranslations,
    lang: string
  ) => boolean | '' | undefined;
  t: (key: string) => string;
}) {
  return (
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
                  !hasTranslation(classification, lang.code) && 'opacity-40'
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
  );
}

export default FatwaClassificationsClient;
