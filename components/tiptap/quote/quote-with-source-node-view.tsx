import { useState } from 'react';
import { NodeViewWrapper, NodeViewProps, NodeViewContent } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Quote as QuoteIcon, ArrowLeftRight } from 'lucide-react';

/**
 * Quote node-view with :
 *   • optional *source* (label + URL)
 *   • style switch (regular / hadith / Qur'an)
 *   • **drag handle** limited to the "⋮⋮" dots
 *
 * Implementation notes
 * --------------------
 * • The node spec has `draggable: true`, so ProseMirror attaches the built-in
 *   drag behaviour to the *root* DOM element (rendered by <NodeViewWrapper />).
 * • We prevent accidental drags from empty areas by cancelling `dragstart`
 *   unless the event originates from the element that bears
 *   `data-drag-handle`.
 * • To get rid of the default grey "ghost" icon the browser shows while
 *   dragging, we set an **empty 1×1 transparent drag image** on the handle's
 *   own `dragstart`.
 */
const QuoteWithSourceNodeView = ({ node, updateAttributes }: NodeViewProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [label, setLabel] = useState(node.attrs.sourceLabel || '');
  const [url, setUrl] = useState(node.attrs.sourceUrl || '');
  const [direction, setDirection] = useState<'ltr' | 'rtl'>(
    node.attrs.direction || 'ltr'
  );

  /* -------------------------------------------------- actions */
  const handleSave = () => {
    updateAttributes({ sourceLabel: label, sourceUrl: url });
    setDialogOpen(false);
  };

  const handleDirectionToggle = () => {
    const newDir = direction === 'ltr' ? 'rtl' : 'ltr';
    setDirection(newDir);
    updateAttributes({ direction: newDir });
  };

  /* -------------------------------------------------- drag logic */
  const cancelIfNotHandle: React.DragEventHandler = (e) => {
    if (!(e.target as HTMLElement).closest('[data-drag-handle]')) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const hideGhostImage: React.DragEventHandler = (e) => {
    // 1×1 px transparent gif
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
    e.dataTransfer?.setDragImage(img, 0, 0);
  };

  /* -------------------------------------------------- render */
  return (
    <NodeViewWrapper
      onDragStart={cancelIfNotHandle}
      className="relative my-6 group bg-muted text-foreground border-l-primary rounded border-l-4 shadow-sm p-0"
    >
      {/* DRAG HANDLE */}
      <span
        contentEditable={false}
        data-drag-handle
        draggable="true"
        onDragStart={hideGhostImage}
        className="absolute left-2 top-2 w-6 h-6 flex items-center justify-center cursor-grab select-none text-muted-foreground z-50"
      >
        ⋮⋮
      </span>

      {/* CONTROL BAR */}
      <div
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition flex gap-2"
        contentEditable={false}
      >
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={handleDirectionToggle}
          aria-label="Toggle text direction"
        >
          <ArrowLeftRight className="w-4 h-4 mr-1" />
          {direction === 'ltr' ? 'LTR' : 'RTL'}
        </Button>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" type="button">
              Edit Source
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Source</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <Input
                placeholder="Source label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
              <Input
                placeholder="Source URL (optional)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <Button onClick={handleSave} type="button">
                Save
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* BODY */}
      <blockquote
        className="m-0 p-0 border-none bg-transparent"
        dir={direction}
      >
        <NodeViewContent as="div" />
        {node.attrs.sourceLabel && (
          <div
            className="absolute bottom-2 right-4 text-xs pointer-events-none text-muted-foreground"
            contentEditable={false}
          >
            {node.attrs.sourceUrl ? (
              <a
                href={node.attrs.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                {node.attrs.sourceLabel}
              </a>
            ) : (
              node.attrs.sourceLabel
            )}
          </div>
        )}

        {/* DECORATIVE ICON */}
        <span
          className="pointer-events-none select-none absolute top-1/2 right-6 -translate-y-1/2 opacity-10 text-[64px] font-bold"
          aria-hidden="true"
        >
          <QuoteIcon className="w-16 h-16" />
        </span>
      </blockquote>
    </NodeViewWrapper>
  );
};

export default QuoteWithSourceNodeView;
