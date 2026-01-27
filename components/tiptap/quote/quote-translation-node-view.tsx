import { NodeViewContent, NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

const QuoteTranslationNodeView = ({ deleteNode }: NodeViewProps) => {
  return (
    <NodeViewWrapper
      className="relative group mt-3"
      data-quote-translation="true"
    >
      {/* Delete button - appears on hover */}
      <div
        className="absolute -top-2 right-0 opacity-0 group-hover:opacity-100 transition-opacity z-10"
        contentEditable={false}
      >
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={deleteNode}
          title="Remove translation"
          className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>

      {/* Editable translation content - inherits text-align from parent quote via CSS */}
      <NodeViewContent
        className="outline-none text-muted-foreground italic text-base min-h-[24px] [&>p]:m-0"
      />
    </NodeViewWrapper>
  );
};

export default QuoteTranslationNodeView;
