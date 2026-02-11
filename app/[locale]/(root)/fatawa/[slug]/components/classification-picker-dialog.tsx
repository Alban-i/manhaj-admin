'use client';

import { useMemo, useState } from 'react';
import { useLocale } from 'next-intl';
import { FatwaClassificationWithTranslations } from '@/types/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Check, ChevronDown, ChevronRight, ChevronsUpDown } from 'lucide-react';

interface ClassificationPickerDialogProps {
  classifications: FatwaClassificationWithTranslations[];
  value: string | undefined;
  onSelect: (value: string) => void;
  placeholder: string;
}

export function ClassificationPickerDialog({
  classifications,
  value,
  onSelect,
  placeholder,
}: ClassificationPickerDialogProps) {
  const [open, setOpen] = useState(false);

  const { topLevel, childrenMap } = useMemo(() => {
    const top: FatwaClassificationWithTranslations[] = [];
    const children = new Map<number, FatwaClassificationWithTranslations[]>();
    for (const c of classifications) {
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
  }, [classifications]);

  // Expand the chapter containing the current selection by default
  const [expanded, setExpanded] = useState<Set<number>>(() => {
    if (!value) return new Set<number>();
    const numValue = Number(value);
    const selected = classifications.find((c) => c.id === numValue);
    if (selected?.parent_id) return new Set([selected.parent_id]);
    return new Set<number>();
  });

  const toggleExpanded = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const locale = useLocale();

  const getName = (c: FatwaClassificationWithTranslations) => {
    const translation =
      c.fatwa_classification_translations?.find((t) => t.language === locale);
    const fallback =
      c.fatwa_classification_translations?.find((t) => t.language === 'ar');
    return translation?.name ?? fallback?.name ?? c.slug;
  };

  const getDisplayLabel = () => {
    if (!value) return null;
    const numValue = Number(value);
    const selected = classifications.find((c) => c.id === numValue);
    if (!selected) return null;

    if (selected.parent_id) {
      const parent = classifications.find((c) => c.id === selected.parent_id);
      if (parent) return `${getName(parent)} > ${getName(selected)}`;
    }
    return getName(selected);
  };

  const handleSelect = (id: number) => {
    onSelect(id.toString());
    setOpen(false);
  };

  const displayLabel = getDisplayLabel();
  const numValue = value ? Number(value) : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn(
            'w-full justify-between font-normal',
            !value && 'text-muted-foreground'
          )}
        >
          <span className="truncate">{displayLabel ?? placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{placeholder}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-1 py-2">
            {topLevel.map((chapter) => {
              const children = childrenMap.get(chapter.id) ?? [];
              const hasChildren = children.length > 0;
              const isExpanded = expanded.has(chapter.id);

              if (!hasChildren) {
                // Selectable leaf chapter
                return (
                  <button
                    key={chapter.id}
                    type="button"
                    onClick={() => handleSelect(chapter.id)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors',
                      numValue === chapter.id && 'bg-accent text-accent-foreground'
                    )}
                  >
                    <Check
                      className={cn(
                        'h-4 w-4 shrink-0',
                        numValue === chapter.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <span>{getName(chapter)}</span>
                  </button>
                );
              }

              // Expandable chapter with children
              return (
                <div key={chapter.id}>
                  <button
                    type="button"
                    onClick={() => toggleExpanded(chapter.id)}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0" />
                    )}
                    <span>{getName(chapter)}</span>
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {children.length}
                    </Badge>
                  </button>

                  {isExpanded && (
                    <div className="ml-4 border-l pl-2 space-y-0.5">
                      {children.map((child) => (
                        <button
                          key={child.id}
                          type="button"
                          onClick={() => handleSelect(child.id)}
                          className={cn(
                            'flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors',
                            numValue === child.id && 'bg-accent text-accent-foreground'
                          )}
                        >
                          <Check
                            className={cn(
                              'h-4 w-4 shrink-0',
                              numValue === child.id ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          <span>{getName(child)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
