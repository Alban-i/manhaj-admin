import { mergeAttributes } from '@tiptap/core';
import ListItem from '@tiptap/extension-list-item';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { FootnoteV2NodeView } from './footnote-v2-node-view';

interface FootnoteV2Options {
  content: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  HTMLAttributes: Record<string, any>;
}

export const FootnoteV2Extension = ListItem.extend<FootnoteV2Options>({
  name: 'footnoteV2',

  content() {
    return this.options.content;
  },

  isolating: true,
  defining: true,
  draggable: false,

  addOptions() {
    return {
      ...this.parent?.(),
      content: 'paragraph+',
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      id: {
        isRequired: true,
      },
      // The data-id field should match the data-id field of a footnote reference.
      // It's used to link footnotes and references together.
      'data-id': {
        isRequired: true,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'li',
        getAttrs(node) {
          const id = (node as HTMLElement).getAttribute('data-id');
          if (id) {
            return {
              'data-id': id,
            };
          }
          return false;
        },
        priority: 1000,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'li',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0,
    ];
  },

  addCommands() {
    return {
      focusFootnoteV2:
        (id: string) =>
        ({ editor, chain }) => {
          // Use the same approach as the original: find by $node helper
          const matchedFootnote = editor.$node('footnoteV2', {
            'data-id': id,
          });
          if (matchedFootnote) {
            chain()
              .focus()
              .setTextSelection(
                matchedFootnote.from + matchedFootnote.content.size
              )
              .run();
            matchedFootnote.element?.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
            });
            return true;
          }
          return false;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      // Tab navigation between footnotes (copied from original)
      Tab: ({ editor }) => {
        try {
          const { selection } = editor.state;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const pos = (editor as any).$pos(selection.anchor);
          if (!pos.after) return false;
          if (pos.after.node.type.name === 'footnotesV2') {
            const firstChild = pos.after.node.child(0);
            editor
              .chain()
              .setTextSelection(pos.after.from + firstChild.content.size)
              .scrollIntoView()
              .run();
            return true;
          } else {
            const startPos = selection.$from.start(2);
            if (Number.isNaN(startPos)) return false;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const parent = (editor as any).$pos(startPos);
            if (parent.node.type.name !== 'footnoteV2' || !parent.after) {
              return false;
            }
            editor
              .chain()
              .setTextSelection(parent.after.to - 1)
              .scrollIntoView()
              .run();
            return true;
          }
        } catch {
          return false;
        }
      },
      // Shift-Tab for reverse navigation (copied from original)
      'Shift-Tab': ({ editor }) => {
        const { selection } = editor.state;
        const startPos = selection.$from.start(2);
        if (Number.isNaN(startPos)) return false;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const parent = (editor as any).$pos(startPos);
        if (parent.node.type.name !== 'footnoteV2' || !parent.before) {
          return false;
        }
        editor
          .chain()
          .setTextSelection(parent.before.to - 1)
          .scrollIntoView()
          .run();
        return true;
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(FootnoteV2NodeView);
  },
});