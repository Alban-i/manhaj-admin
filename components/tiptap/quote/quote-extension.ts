import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import QuoteNodeView from './quote-node-view';

export interface QuoteOptions {
  HTMLAttributes: Record<string, string>;
}

export interface QuoteAttrs {
  quote?: string;
  translation?: string;
  sourceLabel?: string;
  sourceUrl?: string;
}

const QuoteExtension = Node.create<
  QuoteOptions,
  QuoteAttrs
>({
  name: 'quote',
  group: 'block',
  content: '', // no inner content, just attributes
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
      original: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-original') || '',
        renderHTML: (attrs) =>
          attrs.original ? { 'data-original': attrs.original } : {},
      },
      translation: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-translation') || '',
        renderHTML: (attrs) =>
          attrs.translation ? { 'data-translation': attrs.translation } : {},
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
      quoteType: {
        default: 'quote',
        parseHTML: () => 'quote',
        renderHTML: () => ({ 'data-quote-type': 'quote' }),
      },
      styleType: {
        default: 'verse',
        parseHTML: (element) => element.getAttribute('data-style') || 'verse',
        renderHTML: (attrs) =>
          attrs.styleType ? { 'data-style': attrs.styleType } : {},
      },
      autoOpen: {
        default: false,
        parseHTML: () => false,
        renderHTML: () => ({}),
      },
    };
  },

  parseHTML() {
    return [
      { tag: 'blockquote[data-quote-type="quote"]' },
      // Backwards compatibility: also parse old quote-with-translation blocks
      { tag: 'blockquote[data-quote-type="quote-with-translation"]' },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'blockquote',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-quote-type': 'quote',
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(QuoteNodeView);
  },
});

export default QuoteExtension;
