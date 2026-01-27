import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Trash2 } from 'lucide-react';
import { AudioPlayer } from '@/components/editor/audio-player';

const AudioNodeView = ({
  node,
  updateAttributes,
  deleteNode,
  selected,
  getPos,
}: NodeViewProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isTitleDialogOpen, setIsTitleDialogOpen] = useState(false);
  const [titleInput, setTitleInput] = useState('');

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    const nodeData = {
      pos: getPos(),
      node: node.toJSON(),
    };
    e.dataTransfer.setData('application/json', JSON.stringify(nodeData));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <NodeViewWrapper className="relative my-6">
      <div
        draggable={true}
        onDragStart={(e: React.DragEvent) => {
          e.stopPropagation();
          handleDragStart(e);
        }}
        onDragEnd={(e: React.DragEvent) => {
          e.stopPropagation();
          handleDragEnd();
        }}
        style={{
          opacity: isDragging ? 0.5 : 1,
          cursor: 'move',
        }}
        className="relative"
      >
        {selected && (
          <div
            className="absolute top-2 right-2 z-10 flex gap-2 bg-black/50 p-2 rounded"
            contentEditable={false}
            draggable={false}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setTitleInput(node.attrs.title || '');
                setIsTitleDialogOpen(true);
              }}
              className="p-1 text-white text-xs font-semibold hover:bg-black/20 rounded cursor-pointer"
              title="Edit title"
            >
              Title
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                deleteNode();
              }}
              className="p-1 hover:bg-black/20 rounded cursor-pointer"
              title="Delete audio"
            >
              <Trash2 className="h-4 w-4 text-white" />
            </button>
          </div>
        )}

        <div
          className={`border rounded-3xl ${selected ? 'border-primary' : 'border-transparent'}`}
          contentEditable={false}
        >
          <AudioPlayer src={node.attrs.src} title={node.attrs.title} />
        </div>
      </div>

      {/* Title Edit Dialog */}
      <Dialog open={isTitleDialogOpen} onOpenChange={setIsTitleDialogOpen}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Edit Audio Title</DialogTitle>
            <DialogDescription>
              Enter a new title for this audio file.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              placeholder="Enter title..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  updateAttributes({ title: titleInput });
                  setIsTitleDialogOpen(false);
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsTitleDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                updateAttributes({ title: titleInput });
                setIsTitleDialogOpen(false);
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </NodeViewWrapper>
  );
};

export default AudioNodeView;
