import { Node as TipTapNode, mergeAttributes } from '@tiptap/core';
import { Node } from '@tiptap/pm/model';
import { ReactNodeViewRenderer } from '@tiptap/react';
import AudioNodeView from './audio-node-view';

export interface AudioOptions {
  inline: boolean;
  HTMLAttributes: Record<string, string | number | boolean>;
}

export const CustomAudioExtension = TipTapNode.create<AudioOptions>({
  name: 'audio',
  group: 'block',
  inline: false,
  atom: true,
  selectable: true,
  draggable: true,

  addOptions() {
    return {
      inline: false,
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      src: { default: null },
      title: { default: null },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'audio[data-audio]',
        getAttrs: (dom) => {
          const element = dom as HTMLElement;
          return {
            src: element.getAttribute('src'),
            title: element.getAttribute('title'),
          };
        },
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }: { node: Node; HTMLAttributes: Record<string, unknown> }) {
    return [
      'audio',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-audio': true,
        src: node.attrs.src,
        title: node.attrs.title,
      }),
    ];
  },


  addNodeView() {
    return ReactNodeViewRenderer(AudioNodeView);
  },
});
