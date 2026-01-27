import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import QuoteTranslationNodeView from './quote-translation-node-view';

export interface QuoteTranslationOptions {
  HTMLAttributes: Record<string, string>;
}

const QuoteTranslationExtension = Node.create<QuoteTranslationOptions>({
  name: 'quoteTranslation',
  group: '', // Not in any group - only used inside quote
  content: 'paragraph+', // Support paragraphs for rich text editing
  defining: true,
  selectable: true,
  draggable: false,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-quote-translation]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-quote-translation': 'true',
      }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(QuoteTranslationNodeView, {
      // Prevent unnecessary re-renders by only updating when node attrs change
      update: ({ oldNode, newNode }) => {
        return oldNode.type === newNode.type;
      },
    });
  },
});

export default QuoteTranslationExtension;
