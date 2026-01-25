import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { DocumentViewer } from '@/components/editor/document-viewer';

const DocumentNodeView = ({
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
    <NodeViewWrapper className="relative">
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
                const newFileType = window.prompt(
                  'Enter file type:',
                  node.attrs.fileType
                );
                if (newFileType !== null) {
                  updateAttributes({ fileType: newFileType });
                }
              }}
              className="p-1 text-white text-xs font-semibold hover:bg-black/20 rounded cursor-pointer"
              title="Edit file type"
            >
              Type
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                deleteNode();
              }}
              className="p-1 hover:bg-black/20 rounded cursor-pointer"
              title="Delete document"
            >
              <Trash2 className="h-4 w-4 text-white" />
            </button>
          </div>
        )}

        <div
          className={`border rounded-md ${selected ? 'border-primary' : 'border-transparent'}`}
          contentEditable={false}
        >
          <DocumentViewer
            src={node.attrs.src}
            title={node.attrs.title || 'Untitled Document'}
            fileType={node.attrs.fileType || 'unknown'}
            fileSize={node.attrs.fileSize}
          />
        </div>
      </div>
    </NodeViewWrapper>
  );
};

export default DocumentNodeView;
