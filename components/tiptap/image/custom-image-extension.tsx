// Custom Image Extension
import Image, { type ImageOptions } from '@tiptap/extension-image';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { mergeAttributes, CommandProps } from '@tiptap/core';
import ImageNodeView from './image-node-view';

interface ImageAttributes {
  mediaId?: string | null;
  width?: string | null;
  height?: string | null;
  alt?: string | null;
  title?: string | null;
  alignment?: string;
  legend?: string | null;
}

interface ImageNode {
  attrs: ImageAttributes & { src: string };
}

const CustomImageExtension = Image.extend({
  name: 'customImage',

  addOptions() {
    return {
      ...this.parent?.(),
      inline: true,
      allowBase64: true,
      HTMLAttributes: {},
      resize: false,
    };
  },

  addAttributes() {
    const parentAttributes = {};

    return {
      ...parentAttributes,
      mediaId: {
        default: null,
        renderHTML: (attributes: ImageAttributes) => {
          if (!attributes.mediaId) return {};
          return { 'data-media-id': attributes.mediaId };
        },
        parseHTML: (element: HTMLElement) => element.getAttribute('data-media-id') || null,
      },
      width: {
        default: null,
        renderHTML: (attributes: ImageAttributes) => {
          if (!attributes.width) return {};
          return { width: attributes.width };
        },
      },
      height: {
        default: null,
        renderHTML: (attributes: ImageAttributes) => {
          if (!attributes.height) return {};
          return { height: attributes.height };
        },
      },
      alt: {
        default: null,
        renderHTML: (attributes: ImageAttributes) => {
          if (!attributes.alt) return {};
          return { alt: attributes.alt };
        },
      },
      title: {
        default: null,
        renderHTML: (attributes: ImageAttributes) => {
          if (!attributes.title) return {};
          return { title: attributes.title };
        },
      },
      alignment: {
        default: 'center',
        renderHTML: (attributes: ImageAttributes) => {
          const margin =
            attributes.alignment === 'left'
              ? '0 auto 0 0'
              : attributes.alignment === 'right'
              ? '0 0 0 auto'
              : '0 auto';

          return {
            style: `display: block; margin: ${margin}`,
          };
        },
        parseHTML: (element: HTMLElement) => {
          // Try to get from the parent <figure> if available
          if (
            element.parentElement &&
            element.parentElement.tagName === 'FIGURE'
          ) {
            return (
              element.parentElement.getAttribute('data-alignment') || 'center'
            );
          }
          // fallback: try to get from the element itself
          return element.getAttribute('data-alignment') || 'center';
        },
      },
      legend: {
        default: null,
        renderHTML: (attributes: ImageAttributes) => {
          if (!attributes.legend) return {};
          return { 'data-legend': attributes.legend };
        },
        parseHTML: (element: HTMLElement) => element.getAttribute('data-legend') || null,
      },
    };
  },

  addCommands() {
    return {
      ...this.parent?.(),
      setCustomImage:
        (options: ImageAttributes & { src: string }) =>
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
      deleteImage:
        () =>
        ({ commands }: CommandProps) => {
          return commands.deleteSelection();
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },

  renderHTML({ node, HTMLAttributes }: { node: { attrs: Record<string, unknown> }; HTMLAttributes: Record<string, unknown> }) {
    const { mediaId, src, alt, title, width, height, alignment } = node.attrs as unknown as ImageAttributes & { src: string };
    const margin =
      alignment === 'left'
        ? '0 auto 0 0'
        : alignment === 'right'
        ? '0 0 0 auto'
        : '0 auto';

    const imgAttrs = mergeAttributes(HTMLAttributes, {
      'data-media-id': mediaId,
      src,
      alt,
      title,
      width,
      height,
      class: 'rounded-lg shadow-md',
      style: `display: block; margin: ${margin}; max-width: 100%; height: auto;`,
      'data-alignment': alignment || 'center',
    });

    return ['img', imgAttrs];
  },
});

export default CustomImageExtension;
