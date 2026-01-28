import { Node as TipTapNode, mergeAttributes, CommandProps } from '@tiptap/core';
import { Node } from '@tiptap/pm/model';
import { ReactNodeViewRenderer } from '@tiptap/react';
import VideoNodeView from './video-node-view';

export interface VideoOptions {
  inline: boolean;
  HTMLAttributes: Record<string, string | number | boolean>;
}

export const CustomVideoExtension = TipTapNode.create<VideoOptions>({
  name: 'video',
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
      poster: { default: null },
    };
  },

  parseHTML() {
    return [{
      tag: 'video[data-video]',
      getAttrs: (dom) => {
        const element = dom as HTMLElement;
        return {
          mediaId: element.getAttribute('data-media-id'),
          src: element.getAttribute('src'),
          title: element.getAttribute('title'),
          poster: element.getAttribute('poster'),
        };
      },
    }];
  },

  renderHTML({ node, HTMLAttributes }: { node: Node; HTMLAttributes: Record<string, unknown> }) {
    return [
      'video',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-video': true,
        'data-media-id': node.attrs.mediaId,
        src: node.attrs.src,
        title: node.attrs.title,
        poster: node.attrs.poster,
        controls: true,
        preload: 'metadata',
      }),
    ];
  },

  addCommands() {
    return {
      setVideo:
        (options: { mediaId?: string; src?: string; title?: string; poster?: string }) =>
        ({ chain, state }: CommandProps) => {
          const { selection } = state;
          const position = selection.$anchor.pos;

          return chain()
            .focus()
            .insertContentAt(position, {
              type: this.name,
              attrs: options,
            })
            .run();
        },
      deleteVideo:
        () =>
        ({ commands }: CommandProps) => {
          return commands.deleteSelection();
        },
    } as any; // eslint-disable-line @typescript-eslint/no-explicit-any
  },

  addNodeView() {
    return ReactNodeViewRenderer(VideoNodeView);
  },
});