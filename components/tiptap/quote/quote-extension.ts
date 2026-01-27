import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import QuoteNodeView from './quote-node-view';

export interface QuoteOptions {
  HTMLAttributes: Record<string, string>;
}

export interface QuoteAttrs {
  isVerse?: boolean;
  sourceLabel?: string;
  sourceUrl?: string;
}

const QuoteExtension = Node.create<QuoteOptions, QuoteAttrs>({
  name: 'quote',
  group: 'block',
  content: 'paragraph+ quoteTranslation?', // Editable content + optional translation
  defining: true,
  draggable: true,
  selectable: false,
  priority: 1001,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      isVerse: {
        default: false,
        parseHTML: (element) => element.getAttribute('data-is-verse') === 'true',
        renderHTML: (attrs) =>
          attrs.isVerse ? { 'data-is-verse': 'true' } : {},
      },
      sourceLabel: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-source-label') || '',
        renderHTML: (attrs) =>
          attrs.sourceLabel ? { 'data-source-label': attrs.sourceLabel } : {},
      },
      sourceUrl: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-source-url') || '',
        renderHTML: (attrs) =>
          attrs.sourceUrl ? { 'data-source-url': attrs.sourceUrl } : {},
      },
      customQuote: {
        default: true,
        parseHTML: (element) =>
          element.hasAttribute('data-custom-quote') ||
          element.getAttribute('data-type') === 'quote',
        renderHTML: () => ({}), // Don't render - data-type="quote" is used instead
      },
    };
  },

  parseHTML() {
    return [
      { tag: 'div[data-type="quote"]' }, // New format (primary)
      { tag: 'blockquote[data-custom-quote]' }, // Legacy format
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': 'quote',
      }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(QuoteNodeView);
  },
});

export default QuoteExtension;
