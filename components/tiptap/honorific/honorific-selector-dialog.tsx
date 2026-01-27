'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  HONORIFICS,
  HONORIFIC_CATEGORIES,
  type HonorificType,
  type HonorificCategory,
} from '@/lib/honorifics';

interface HonorificSelectorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: HonorificType) => void;
}

// Cache for SVG content
const svgCache = new Map<string, string>();

function HonorificPreview({ type }: { type: HonorificType }) {
  const [svgContent, setSvgContent] = useState<string | null>(svgCache.get(type) || null);

  useEffect(() => {
    if (svgCache.has(type)) {
      setSvgContent(svgCache.get(type)!);
      return;
    }

    fetch(`/calligraphy/${type}.svg`)
      .then(res => res.text())
      .then(svg => {
        svgCache.set(type, svg);
        setSvgContent(svg);
      })
      .catch(err => console.error(`Failed to load honorific: ${type}`, err));
  }, [type]);

  if (!svgContent) {
    return <span className="text-muted-foreground text-xs">Loading...</span>;
  }

  return (
    <span
      className="inline-block [&>svg]:h-6 [&>svg]:w-auto"
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}

export function HonorificSelectorDialog({
  isOpen,
  onClose,
  onSelect,
}: HonorificSelectorDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const groupedHonorifics = useMemo(() => {
    const groups: Record<HonorificCategory, Array<{ type: HonorificType; data: typeof HONORIFICS[HonorificType] }>> = {
      allah: [],
      prophet: [],
      prophets: [],
      companions: [],
      scholars: [],
    };

    (Object.entries(HONORIFICS) as Array<[HonorificType, typeof HONORIFICS[HonorificType]]>).forEach(
      ([type, data]) => {
        // Filter by search query
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const matchesArabic = data.arabic.includes(searchQuery);
          const matchesLabel = data.label.toLowerCase().includes(query);
          const matchesType = type.toLowerCase().includes(query);
          if (!matchesArabic && !matchesLabel && !matchesType) {
            return;
          }
        }
        groups[data.category].push({ type, data });
      }
    );

    return groups;
  }, [searchQuery]);

  const handleSelect = (type: HonorificType) => {
    onSelect(type);
    onClose();
    setSearchQuery('');
  };

  const handleClose = () => {
    onClose();
    setSearchQuery('');
  };

  const hasResults = Object.values(groupedHonorifics).some(group => group.length > 0);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Insérer une formule honorifique</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            placeholder="Rechercher par texte arabe ou translittération..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
            autoFocus
          />

          <ScrollArea className="h-96">
            {!hasResults ? (
              <div className="text-center p-4 text-muted-foreground">
                Aucune formule trouvée pour cette recherche.
              </div>
            ) : (
              <div className="space-y-4">
                {(Object.entries(HONORIFIC_CATEGORIES) as Array<[HonorificCategory, typeof HONORIFIC_CATEGORIES[HonorificCategory]]>).map(
                  ([category, categoryData]) => {
                    const items = groupedHonorifics[category];
                    if (items.length === 0) return null;

                    return (
                      <div key={category}>
                        <h3 className="text-sm font-semibold mb-2 text-muted-foreground">
                          {categoryData.labelFr}
                        </h3>
                        <div className="space-y-1">
                          {items.map(({ type, data }) => (
                            <div
                              key={type}
                              className="flex items-center justify-between p-2 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                              onClick={() => handleSelect(type)}
                            >
                              <div className="flex items-center gap-3">
                                <HonorificPreview type={type} />
                                <div>
                                  <div className="text-sm font-medium">{data.arabic}</div>
                                  <div className="text-xs text-muted-foreground">{data.label}</div>
                                </div>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {type}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </ScrollArea>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              Annuler
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
