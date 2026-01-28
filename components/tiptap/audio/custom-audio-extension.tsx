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
      mediaId: { default: null },
      src: { default: null },
      title: { default: null },
      transcription: { default: null },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'audio[data-audio]',
        getAttrs: (dom) => {
          const element = dom as HTMLElement;
          return {
            mediaId: element.getAttribute('data-media-id'),
            src: element.getAttribute('src'),
            title: element.getAttribute('title'),
            transcription: element.getAttribute('data-transcription'),
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
        'data-media-id': node.attrs.mediaId,
        src: node.attrs.src,
        title: node.attrs.title,
        'data-transcription': node.attrs.transcription,
      }),
    ];
  },


  addNodeView() {
    return ReactNodeViewRenderer(AudioNodeView);
  },
});
