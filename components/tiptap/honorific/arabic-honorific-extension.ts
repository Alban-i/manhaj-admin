import { Mark, mergeAttributes } from '@tiptap/core';

export interface ArabicHonorificOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    arabicHonorific: {
      setArabicHonorific: (honorificType: string) => ReturnType;
      unsetArabicHonorific: () => ReturnType;
    };
  }
}

export const ArabicHonorificExtension = Mark.create<ArabicHonorificOptions>({
  name: 'arabicHonorific',
  inclusive: false,

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'arabic-honorific',
      },
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
    return [
      {
        tag: 'span[data-honorific-type]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0,
    ];
  },

  addCommands() {
    return {
      setArabicHonorific:
        (honorificType: string) =>
        ({ commands }) => {
          return commands.setMark(this.name, { honorificType });
        },
      unsetArabicHonorific:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },
});
