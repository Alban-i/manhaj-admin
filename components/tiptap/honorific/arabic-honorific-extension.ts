import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { HonorificNodeView } from './honorific-node-view';

export interface ArabicHonorificOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    arabicHonorific: {
      insertArabicHonorific: (honorificType: string) => ReturnType;
    };
  }
}

export const ArabicHonorificExtension = Node.create<ArabicHonorificOptions>({
  name: 'arabicHonorific',
  group: 'inline',
  inline: true,
  atom: true, // Cannot have content, treated as single unit

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      honorificType: {
        default: null,
        parseHTML: element => element.getAttribute('data-honorific-type'),
        renderHTML: attributes => ({
          'data-honorific-type': attributes.honorificType,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-honorific-type]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(HonorificNodeView);
  },

  addCommands() {
    return {
      insertArabicHonorific:
        (honorificType: string) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { honorificType },
          });
        },
    };
  },
});
