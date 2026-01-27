import { useCallback, useEffect, useRef, useState } from 'react';

import {
  NodeViewProps,
  NodeViewWrapper,
  Editor as TiptapEditor,
} from '@tiptap/react';

import { AlignCenter, AlignLeft, AlignRight, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ImageNodeViewProps extends NodeViewProps {
  updateAttributes: (attrs: {
    alt?: string;
    title?: string;
    width?: number;
    height?: number;
    alignment?: string;
    legend?: string;
  }) => void;
  deleteNode: () => void;
  selected: boolean;
  getPos: () => number | undefined;
  editor: TiptapEditor;
}

const ImageNodeView = ({
  node,
  updateAttributes,
  deleteNode,
  selected,
  getPos,
  editor,
}: ImageNodeViewProps) => {
  const [isResizing, setIsResizing] = useState(false);
  const [initialSize, setInitialSize] = useState({ width: 0, height: 0 });
  const [initialMousePos, setInitialMousePos] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAltDialogOpen, setIsAltDialogOpen] = useState(false);
  const [altInputValue, setAltInputValue] = useState(node.attrs.alt || '');
  const [legendInputValue, setLegendInputValue] = useState(
    node.attrs.legend || ''
  );

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    setIsResizing(true);
    setInitialSize({
      width: rect.width,
      height: rect.height,
    });
    setInitialMousePos({
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleResize = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !imageRef.current) return;

      const deltaX = e.clientX - initialMousePos.x;
      const deltaY = e.clientY - initialMousePos.y;
      const aspectRatio = initialSize.height / initialSize.width;

      const newWidth = Math.max(100, initialSize.width + deltaX);
      const newHeight = Math.round(newWidth * aspectRatio);

      updateAttributes({
        width: newWidth,
        height: newHeight,
      });
    },
    [isResizing, initialMousePos, initialSize, updateAttributes]
  );

  const stopResize = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResize);
      window.addEventListener('mouseup', stopResize);
    }
    return () => {
      window.removeEventListener('mousemove', handleResize);
      window.removeEventListener('mouseup', stopResize);
    };
  }, [isResizing, handleResize, stopResize]);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    const pos = getPos();
    if (pos === undefined) return;
    
    // Store the current position and node data in the dataTransfer
    const nodeData = {
      pos,
      node: {
        ...node.toJSON(),
        attrs: {
          ...node.attrs,
          width: node.attrs.width,
          height: node.attrs.height,
          alignment: node.attrs.alignment,
        },
      },
    };
    e.dataTransfer.setData('application/json', JSON.stringify(nodeData));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <NodeViewWrapper
      as="figure"
      className="relative my-6"
      data-alignment={node.attrs.alignment || 'center'}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imageRef}
        src={node.attrs.src}
        alt={node.attrs.alt || ''}
        draggable={true}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        style={{
          margin:
            node.attrs.alignment === 'left'
              ? '0 auto 0 0'
              : node.attrs.alignment === 'right'
              ? '0 0 0 auto'
              : '0 auto',
          display: 'block',
          maxWidth: '100%',
          width: node.attrs.width || 'auto',
          height: node.attrs.height || 'auto',
          opacity: isDragging ? 0.5 : 1,
          cursor: 'move',
        }}
        className="rounded-3xl shadow-md"
      />
      {/* Show legend only when selected and legend exists */}
      {true && node.attrs.legend && (
        <div
          className="block w-full text-center mt-2 text-[0.95em] italic"
          style={{ color: 'var(--muted-foreground)' }}
          contentEditable={false}
          draggable={false}
        >
          {node.attrs.legend}
        </div>
      )}
      {selected && (
        <>
          <div
            className="absolute top-2 left-2 flex gap-2 bg-black/50 p-2 rounded"
            contentEditable={false}
            draggable={false}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                updateAttributes({ alignment: 'left' });
              }}
              className="p-1 text-white hover:bg-black/20 rounded cursor-pointer"
              title="Align left"
            >
              <AlignLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                updateAttributes({ alignment: 'center' });
              }}
              className="p-1 text-white hover:bg-black/20 rounded cursor-pointer"
              title="Center"
            >
              <AlignCenter className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                updateAttributes({ alignment: 'right' });
              }}
              className="p-1 text-white hover:bg-black/20 rounded cursor-pointer"
              title="Align right"
            >
              <AlignRight className="h-4 w-4" />
            </button>
          </div>
          <div
            className="absolute top-2 right-2 flex gap-2 bg-black/50 p-2 rounded"
            contentEditable={false}
            draggable={false}
            onClick={(e) => e.stopPropagation()}
          >
            <Dialog open={isAltDialogOpen} onOpenChange={setIsAltDialogOpen}>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="p-1 text-white text-xs font-semibold hover:bg-black/20 rounded cursor-pointer"
                  title="Edit alt text"
                  onClick={() => {
                    setAltInputValue(node.attrs.alt || '');
                    setLegendInputValue(node.attrs.legend || '');
                  }}
                >
                  Alt
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Alt Text & Legend</DialogTitle>
                </DialogHeader>

                <Input
                  value={altInputValue}
                  onChange={(e) => setAltInputValue(e.target.value)}
                  placeholder="Enter alt text"
                  autoFocus
                />
                <Input
                  value={legendInputValue}
                  onChange={(e) => setLegendInputValue(e.target.value)}
                  placeholder="Enter legend (optional)"
                  className="mt-2"
                />
                <DialogFooter className="mt-4">
                  <DialogClose asChild>
                    <Button type="button" variant="outline" className="mr-2">
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button
                    type="button"
                    onClick={() => {
                      updateAttributes({
                        alt: altInputValue,
                        legend: legendInputValue,
                      });
                      setIsAltDialogOpen(false);
                    }}
                    className=""
                  >
                    Save
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                deleteNode();
              }}
              className="p-1 hover:bg-black/20 rounded cursor-pointer"
              title="Delete image"
            >
              <Trash2 className="h-4 w-4 text-white" />
            </button>
          </div>
          <div
            className="absolute bottom-0 right-0 w-4 h-4 bg-black/50 cursor-se-resize"
            contentEditable={false}
            draggable={false}
            onMouseDown={startResize}
            title="Resize image"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-full h-full text-white p-0.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 3L14 10M21 7V3H17M10 14L3 21M7 21H3V17" />
            </svg>
          </div>
        </>
      )}
    </NodeViewWrapper>
  );
};

export default ImageNodeView;
