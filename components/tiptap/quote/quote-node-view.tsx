import { useState, useId } from 'react';
import { NodeViewWrapper, NodeViewContent, NodeViewProps } from '@tiptap/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { BookOpen, Languages, Link2, Trash2 } from 'lucide-react';

const QuoteNodeView = ({
  node,
  updateAttributes,
  deleteNode,
  getPos,
  editor,
}: NodeViewProps) => {
  const sourceLabelId = useId();
  const sourceUrlId = useId();
  const [sourcePopoverOpen, setSourcePopoverOpen] = useState(false);
  const [tempSourceLabel, setTempSourceLabel] = useState(
    node.attrs.sourceLabel || ''
  );
  const [tempSourceUrl, setTempSourceUrl] = useState(
    node.attrs.sourceUrl || ''
  );

  const isVerse = node.attrs.isVerse ?? false;
  const sourceLabel = node.attrs.sourceLabel || '';
  const sourceUrl = node.attrs.sourceUrl || '';

  // Check if translation exists (safely)
  const hasTranslation =
    node.content?.content?.some(
      (child) => child.type.name === 'quoteTranslation'
    ) ?? false;

  const handleVerseToggle = () => {
    updateAttributes({ isVerse: !isVerse });
  };

  const handleAddTranslation = () => {
    if (!editor || typeof getPos !== 'function') return;

    const pos = getPos();
    if (pos === undefined) return;
    const endPos = pos + node.nodeSize - 1;

    editor
      .chain()
      .focus()
      .insertContentAt(endPos, {
        type: 'quoteTranslation',
        content: [{ type: 'paragraph' }],
      })
      .run();
  };

  const handleSaveSource = () => {
    updateAttributes({
      sourceLabel: tempSourceLabel,
      sourceUrl: tempSourceUrl,
    });
    setSourcePopoverOpen(false);
  };

  const handleSourcePopoverOpen = (open: boolean) => {
    if (open) {
      setTempSourceLabel(sourceLabel);
      setTempSourceUrl(sourceUrl);
    }
    setSourcePopoverOpen(open);
  };

  return (
    <NodeViewWrapper className="relative my-6 group bg-card/80 rounded-3xl py-4 px-6 pb-8">
      {/* Hover toolbar */}
      <div
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10"
        contentEditable={false}
      >
        {/* Verse toggle */}
        <Button
          variant={isVerse ? 'default' : 'ghost'}
          size="sm"
          type="button"
          onClick={handleVerseToggle}
          title={isVerse ? 'Remove verse style' : 'Mark as verse'}
          className="h-7 w-7 p-0"
        >
          <BookOpen className="w-4 h-4" />
        </Button>

        {/* Add translation - only if no translation exists */}
        {!hasTranslation && (
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={handleAddTranslation}
            title="Add translation"
            className="h-7 w-7 p-0"
          >
            <Languages className="w-4 h-4" />
          </Button>
        )}

        {/* Source popover */}
        <Popover open={sourcePopoverOpen} onOpenChange={handleSourcePopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant={sourceLabel ? 'default' : 'ghost'}
              size="sm"
              type="button"
              title="Edit source"
              className="h-7 w-7 p-0"
            >
              <Link2 className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="flex flex-col gap-3">
              <div className="font-medium text-sm">Source</div>
              <Input
                id={sourceLabelId}
                autoComplete="off"
                placeholder="Source label (e.g., Surah Al-Baqarah: 255)"
                value={tempSourceLabel}
                onChange={(e) => setTempSourceLabel(e.target.value)}
              />
              <Input
                id={sourceUrlId}
                autoComplete="off"
                placeholder="Source URL (optional)"
                value={tempSourceUrl}
                onChange={(e) => setTempSourceUrl(e.target.value)}
              />
              <Button onClick={handleSaveSource} type="button" size="sm">
                Save
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Delete */}
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={deleteNode}
          title="Delete quote"
          className="h-7 w-7 p-0 hover:bg-destructive hover:text-destructive-foreground"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Editable content - verse brackets added via CSS pseudo-elements */}
      <div
        className={cn(
          'quote-content',
          isVerse
            ? 'quote-verse text-2xl text-primary text-center'
            : '[&>p]:text-xl [&>p]:leading-relaxed [&>p]:m-0 [&>p]:mb-2'
        )}
      >
        <NodeViewContent className="outline-none" />
      </div>

      {/* Source label */}
      {sourceLabel && (
        <div
          className="absolute bottom-2 right-4 text-xs text-muted-foreground pointer-events-none"
          contentEditable={false}
        >
          {sourceUrl ? (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline pointer-events-auto"
            >
              {sourceLabel}
            </a>
          ) : (
            <span>{sourceLabel}</span>
          )}
        </div>
      )}
    </NodeViewWrapper>
  );
};

export default QuoteNodeView;
