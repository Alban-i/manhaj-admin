import { NodeViewContent, NodeViewWrapper, NodeViewProps, Editor } from '@tiptap/react';
import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface FootnoteV2NodeViewProps extends NodeViewProps {
  updateAttributes: (attributes: Record<string, unknown>) => void;
  deleteNode: () => void;
  editor: Editor;
}

export const FootnoteV2NodeView: React.FC<FootnoteV2NodeViewProps> = ({
  node,
  updateAttributes,
  deleteNode,
  editor,
}) => {
  const footnoteId = node.attrs['data-id'];

  // Get footnote number from the id attribute (format: "fn:1", "fn:2", etc.)
  // This is managed by FootnoteV2Rules plugin
  const referenceNumber = useMemo(() => {
    const id = node.attrs.id;
    if (typeof id === 'string' && id.startsWith('fn:')) {
      return parseInt(id.slice(3), 10) || 1;
    }
    return 1;
  }, [node.attrs.id]);

  const handleBackNavigation = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Find the corresponding reference and scroll to it
    if (footnoteId) {
      const { doc } = editor.state;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      doc.descendants((refNode: any, pos: number) => {
        if (
          refNode.type.name === 'footnoteReferenceV2' &&
          refNode.attrs['data-id'] === footnoteId
        ) {
          // Scroll to the reference position
          editor.commands.setTextSelection(pos);
          editor.commands.scrollIntoView();
          
          // Briefly highlight the reference
          const referenceElement = document.querySelector(
            `span[data-id="${footnoteId}"][data-type="footnote-reference-v2"]`
          );
          if (referenceElement) {
            referenceElement.classList.add('footnote-highlight');
            setTimeout(() => {
              referenceElement.classList.remove('footnote-highlight');
            }, 2000);
          }
          return false; // Stop searching
        }
        return true;
      });
    }
  };

  const handleDelete = () => {
    // Find and remove corresponding footnote reference
    // The appendTransaction in FootnoteV2Rules will automatically:
    // 1. Detect the reference was deleted
    // 2. Remove the orphaned footnote
    // 3. Renumber remaining footnotes
    if (footnoteId) {
      const { doc } = editor.state;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      doc.descendants((refNode: any, pos: number) => {
        if (
          refNode.type.name === 'footnoteReferenceV2' &&
          refNode.attrs['data-id'] === footnoteId
        ) {
          editor.commands.deleteRange({ from: pos, to: pos + refNode.nodeSize });
          return false;
        }
        return true;
      });
    }
    // DO NOT call deleteNode() - appendTransaction handles footnote removal
  };

  return (
    <NodeViewWrapper className="footnote-v2 relative group">
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={handleBackNavigation}
          className="footnote-back-link text-primary hover:underline cursor-pointer font-medium shrink-0"
          title={`Go to reference ${referenceNumber}`}
        >
          {referenceNumber}.
        </button>
        <div className="flex-1">
          <NodeViewContent className="footnote-v2-content" />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
          title="Delete footnote"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </NodeViewWrapper>
  );
};