import OrderedList from '@tiptap/extension-ordered-list';
import { Editor } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { FootnoteV2Rules } from './footnote-v2-rules-new';
import { FootnotesV2NodeView } from './footnotes-v2-node-view';

export const FootnotesV2Extension = OrderedList.extend({
  name: 'footnotesV2',
  
  group: '', // Remove the default group of the ordered list extension
  
  isolating: true,
  defining: true,
  draggable: false,

  content() {
    return 'footnoteV2*';
  },

  addAttributes() {
    return {
      class: {
        default: 'footnotes footnotes-v2',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'ol.footnotes-v2',
        priority: 1000,
      },
    ];
  },

  addKeyboardShortcuts() {
    return {
      // Override the default behavior of Mod-a:
      // Rather than selecting the whole text content of the editor, only select the text inside the current footnote
      'Mod-a': ({ editor }: { editor: Editor }) => {
        try {
          const { selection } = editor.state;
          const { $from } = selection;
          const start = $from.start(2);
          const startNode = editor.$pos(start);
          if (startNode.node.type.name !== 'footnoteV2') return false;
          const end = $from.end(2);
          editor.commands.setTextSelection({
            from: start + 1,
            to: end - 1,
          });
          return true;
        } catch (e) {
          return false;
        }
      },
    };
  },

  addCommands() {
    return {};
  },

  addInputRules() {
    return [];
  },

  addExtensions() {
    return [FootnoteV2Rules];
  },

  addNodeView() {
    return ReactNodeViewRenderer(FootnotesV2NodeView);
  },
});