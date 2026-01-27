import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

export interface AutoTextDirectionOptions {
  types: string[];
}

const RTL_RANGES = [
  [0x0590, 0x05ff], // Hebrew
  [0x0600, 0x06ff], // Arabic
  [0x0700, 0x074f], // Syriac
  [0x0780, 0x07bf], // Thaana
  [0x08a0, 0x08ff], // Arabic Extended-A
  [0xfb1d, 0xfdff], // Arabic Presentation Forms-A
  [0xfe70, 0xfeff], // Arabic Presentation Forms-B
];

const LTR_RANGES = [
  [0x0041, 0x005a], // A-Z
  [0x0061, 0x007a], // a-z
  [0x00c0, 0x00ff], // Latin Extended (accented chars)
  [0x0100, 0x017f], // Latin Extended-A
  [0x0180, 0x024f], // Latin Extended-B
];

function isRTL(char: string): boolean {
  const code = char.charCodeAt(0);
  return RTL_RANGES.some(([start, end]) => code >= start && code <= end);
}

function isLTR(char: string): boolean {
  const code = char.charCodeAt(0);
  return LTR_RANGES.some(([start, end]) => code >= start && code <= end);
}

function detectTextDirection(text: string): 'rtl' | 'ltr' | null {
  const trimmedText = text.trim();
  if (!trimmedText) return null;

  let rtlCount = 0;
  let ltrCount = 0;
  let totalChars = 0;

  for (const char of trimmedText) {
    if (isRTL(char)) rtlCount++;
    else if (isLTR(char)) ltrCount++;
    if (/\S/.test(char)) totalChars++;
  }

  const total = Math.max(totalChars, 1);
  if (rtlCount / total > 0.3) return 'rtl';
  if (ltrCount / total > 0.3) return 'ltr';
  return null;
}

export const AutoTextDirectionExtension = Extension.create<AutoTextDirectionOptions>({
  name: 'autoTextDirection',

  addOptions() {
    return {
      types: ['paragraph', 'heading'],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          dir: {
            default: null,
            renderHTML: (attributes) => {
              if (!attributes.dir) {
                return {};
              }
              return {
                dir: attributes.dir,
              };
            },
            parseHTML: (element) => {
              return element.getAttribute('dir');
            },
          },
        },
      },
    ];
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('autoTextDirection'),
        
        appendTransaction: (transactions, oldState, newState) => {
          // Only process if there were actual content changes
          const hasContentChanges = transactions.some(tr => tr.docChanged);
          if (!hasContentChanges) return null;

          const tr = newState.tr;
          let modified = false;

          newState.doc.descendants((node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              const currentDir = node.attrs.dir;
              const nodeText = node.textContent.trim();
              
              // Remove dir from empty nodes
              if (!nodeText) {
                if (currentDir) {
                  tr.setNodeMarkup(pos, undefined, {
                    ...node.attrs,
                    dir: null,
                  });
                  modified = true;
                }
                return;
              }
              
              // Auto-detect direction based on content
              const shouldHaveDir = detectTextDirection(nodeText);
              
              if (currentDir !== shouldHaveDir) {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  dir: shouldHaveDir,
                });
                modified = true;
              }
            }
          });

          return modified ? tr : null;
        },
      }),
    ];
  },
});