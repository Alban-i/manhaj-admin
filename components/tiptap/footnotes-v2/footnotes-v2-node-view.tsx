import { NodeViewContent, NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import React from 'react';
import { Separator } from '@/components/ui/separator';

interface FootnotesV2NodeViewProps extends NodeViewProps {
  updateAttributes: (attributes: Record<string, unknown>) => void;
  deleteNode: () => void;
}

export const FootnotesV2NodeView: React.FC<FootnotesV2NodeViewProps> = ({
  node,
  updateAttributes,
  deleteNode,
}) => {
  return (
    <NodeViewWrapper className="footnotes-v2">
      {/* Separator */}
      <div className="flex justify-center px-8">
        <Separator className="my-4 !h-[2px]" />
      </div>

      {/* References container */}
      <div className="rounded-md px-4 py-4 bg-card/50">
        <div className="!text-xs font-semibold text-center">Références</div>
        <ol className="[&>li>p]:!m-0">
          <NodeViewContent />
        </ol>
      </div>
    </NodeViewWrapper>
  );
};