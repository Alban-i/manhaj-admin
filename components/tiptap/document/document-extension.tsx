import { Node as TipTapNode, mergeAttributes, CommandProps } from '@tiptap/core';
import { Node } from '@tiptap/pm/model';
import { ReactNodeViewRenderer } from '@tiptap/react';
import DocumentNodeView from './document-node-view';

export interface DocumentOptions {
  inline: boolean;
  HTMLAttributes: Record<string, string | number | boolean>;
}

export const CustomDocumentExtension = TipTapNode.create<DocumentOptions>({
  name: 'customDocument',
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
      mediaId: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-media-id'),
        renderHTML: () => ({}),
      },
      src: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-src'),
        renderHTML: () => ({}),
      },
      title: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-title'),
        renderHTML: () => ({}),
      },
      fileType: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-file-type'),
        renderHTML: () => ({}),
      },
      fileSize: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-file-size'),
        renderHTML: () => ({}),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-document]' }];
  },

  renderHTML({ node, HTMLAttributes }: { node: Node; HTMLAttributes: Record<string, unknown> }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-document': true,
        'data-media-id': node.attrs.mediaId,
        'data-src': node.attrs.src,
        'data-title': node.attrs.title,
        'data-file-type': node.attrs.fileType,
        'data-file-size': node.attrs.fileSize,
      }),
    ];
  },

  addCommands() {
    return {
      setDocument:
        (options: { mediaId?: string; src?: string; title?: string; fileType?: string; fileSize?: string }) =>
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
      deleteDocument:
        () =>
        ({ commands }: CommandProps) => {
          return commands.deleteSelection();
        },
    } as any; // eslint-disable-line @typescript-eslint/no-explicit-any
  },

  addNodeView() {
    return ReactNodeViewRenderer(DocumentNodeView);
  },
});