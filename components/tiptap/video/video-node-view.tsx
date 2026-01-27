import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { VideoPlayer } from '@/components/editor/video-player';

const VideoNodeView = ({
  node,
  updateAttributes,
  deleteNode,
  selected,
  getPos,
}: NodeViewProps) => {
  const [isDragging, setIsDragging] = useState(false);

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
        {/* Edit controls when selected */}
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
                const newTitle = window.prompt(
                  'Enter title:',
                  node.attrs.title
                );
                if (newTitle !== null) {
                  updateAttributes({ title: newTitle });
                }
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
                const newPoster = window.prompt(
                  'Enter poster URL:',
                  node.attrs.poster
                );
                if (newPoster !== null) {
                  updateAttributes({ poster: newPoster });
                }
              }}
              className="p-1 text-white text-xs font-semibold hover:bg-black/20 rounded cursor-pointer"
              title="Edit poster"
            >
              Poster
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                deleteNode();
              }}
              className="p-1 hover:bg-black/20 rounded cursor-pointer"
              title="Delete video"
            >
              <Trash2 className="h-4 w-4 text-white" />
            </button>
          </div>
        )}

        <div
          className={`border rounded-3xl ${selected ? 'border-primary' : 'border-transparent'}`}
          contentEditable={false}
        >
          <VideoPlayer
            src={node.attrs.src}
            title={node.attrs.title}
            poster={node.attrs.poster}
          />
        </div>
      </div>
    </NodeViewWrapper>
  );
};

export default VideoNodeView;
