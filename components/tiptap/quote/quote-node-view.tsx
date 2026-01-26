import { useState, useEffect, useRef } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { TabToggle } from '@/components/ui/tab-toggle';
import { Quote as QuoteIcon } from 'lucide-react';

const QuoteNodeView = ({
  node,
  updateAttributes,
}: NodeViewProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const hasOpenedRef = useRef(false);
  const [original, setOriginal] = useState(node.attrs.original || '');
  const [translation, setTranslation] = useState(node.attrs.translation || '');
  const [sourceLabel, setSourceLabel] = useState(node.attrs.sourceLabel || '');
  const [sourceUrl, setSourceUrl] = useState(node.attrs.sourceUrl || '');
  const [styleType, setStyleType] = useState(node.attrs.styleType || 'verse');

  useEffect(() => {
    if (node.attrs.autoOpen && !hasOpenedRef.current) {
      setDialogOpen(true);
      hasOpenedRef.current = true;
    }
  }, [node.attrs.autoOpen]);

  // When the dialog is actually opened/closed, clear the autoOpen attribute if needed
  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open && node.attrs.autoOpen) {
      updateAttributes({ autoOpen: false });
    }
  };

  const handleSave = () => {
    updateAttributes({
      original,
      translation,
      sourceLabel,
      sourceUrl,
      styleType,
    });
    setDialogOpen(false);
  };

  // Drag logic (optional, can be added if needed)

  return (
    <NodeViewWrapper className="relative my-6 group text-foreground border-l-primary rounded border-l-4 shadow-sm p-0 text-center">
      {/* CONTROL BAR */}
      <div
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition flex gap-2"
        contentEditable={false}
      >
        <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" type="button">
              Edit Quote
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Quote</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <TabToggle
                picklist={[
                  { label: 'Verse', value: 'verse' },
                  { label: 'Hadith', value: 'hadith' },
                  { label: 'Regular', value: 'regular' },
                ]}
                state={styleType}
                setState={setStyleType}
                className="mb-2"
              />
              <Input
                placeholder="Original"
                value={original}
                onChange={(e) => setOriginal(e.target.value)}
              />
              <Input
                placeholder="Translation (optional)"
                value={translation}
                onChange={(e) => setTranslation(e.target.value)}
              />
              <Input
                placeholder="Source label (optional)"
                value={sourceLabel}
                onChange={(e) => setSourceLabel(e.target.value)}
              />
              <Input
                placeholder="Source URL (optional)"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
              />
              <Button onClick={handleSave} type="button">
                Save
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* BODY */}
      <blockquote className="m-0 p-0 border-none">
        {original && (
          <p
            className="text-2xl font-serif leading-relaxed mb-2"
            style={{ color: 'var(--primary)' }}
          >
            {styleType === 'verse' ? `﴾ ${original} ﴿` : original}
          </p>
        )}
        {translation && (
          <p className="text-base italic text-muted-foreground mb-2">
            {translation}
          </p>
        )}
        {sourceLabel && (
          <div
            className="absolute bottom-2 right-4 text-xs pointer-events-none text-muted-foreground"
            contentEditable={false}
          >
            {sourceUrl ? (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                {sourceLabel}
              </a>
            ) : (
              sourceLabel
            )}
          </div>
        )}
      </blockquote>
      {/* DECORATIVE ICON */}
      <span
        className="pointer-events-none select-none absolute top-1/2 right-6 -translate-y-1/2 opacity-10 text-[64px] font-bold"
        aria-hidden="true"
      >
        {styleType === 'regular' && <QuoteIcon className="w-16 h-16" />}
        {styleType === 'verse' && <span className="font-serif">Q</span>}
        {styleType === 'hadith' && <span className="font-serif">H</span>}
      </span>
    </NodeViewWrapper>
  );
};

export default QuoteNodeView;
