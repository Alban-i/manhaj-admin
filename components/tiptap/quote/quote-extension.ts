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
        parseHTML: (element) => element.hasAttribute('data-custom-quote'),
        renderHTML: (attrs) => (attrs.customQuote ? { 'data-custom-quote': true } : {}),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'blockquote[data-custom-quote]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'blockquote',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-custom-quote': true,
      }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(QuoteNodeView);
  },
});

export default QuoteExtension;
