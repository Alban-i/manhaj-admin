import { Extension } from '@tiptap/core';
import { PluginKey, Plugin } from '@tiptap/pm/state';
import {
  slashCommands,
  filterCommands,
  type SlashCommand,
} from './slash-commands';

export interface SlashCommandStorage {
  openGlossary?: () => void;
  openPostSelector?: () => void;
  openMediaLibrary?: () => void;
}

export interface SlashCommandOptions {
  onOpenGlossary?: () => void;
  onOpenPostSelector?: () => void;
  onOpenMediaLibrary?: () => void;
  onStateChange?: (state: SlashCommandState | null) => void;
}

export interface SlashCommandState {
  active: boolean;
  range: { from: number; to: number };
  query: string;
  coords: { left: number; top: number; bottom: number };
  items: SlashCommand[];
}

// Plugin key for the slash command
export const SlashCommandPluginKey = new PluginKey('slashCommand');

// Internal state type
interface InternalSuggestionState {
  active: boolean;
  range: { from: number; to: number } | null;
  query: string;
  text: string;
}

export const SlashCommandExtension = Extension.create<SlashCommandOptions, SlashCommandStorage>({
  name: 'slashCommand',

  addOptions() {
    return {
      onOpenGlossary: undefined,
      onOpenPostSelector: undefined,
      onOpenMediaLibrary: undefined,
      onStateChange: undefined,
    };
  },

  addStorage() {
    return {
      openGlossary: undefined,
      openPostSelector: undefined,
      openMediaLibrary: undefined,
    };
  },

  onCreate() {
    // Store callbacks in storage for access from commands
    this.storage.openGlossary = this.options.onOpenGlossary;
    this.storage.openPostSelector = this.options.onOpenPostSelector;
    this.storage.openMediaLibrary = this.options.onOpenMediaLibrary;
  },

  addKeyboardShortcuts() {
    return {
      Escape: () => {
        const state = SlashCommandPluginKey.getState(this.editor.state) as InternalSuggestionState;
        if (state?.active && state.range) {
          // Delete the slash command text and close
          this.editor.commands.deleteRange(state.range);
          return true;
        }
        return false;
      },
    };
  },

  addProseMirrorPlugins() {
    const editor = this.editor;
    const onStateChange = this.options.onStateChange;

    return [
      new Plugin({
        key: SlashCommandPluginKey,

        state: {
          init(): InternalSuggestionState {
            return {
              active: false,
              range: null,
              query: '',
              text: '',
            };
          },

          apply(tr, prev): InternalSuggestionState {
            // Check meta for explicit state update
            const meta = tr.getMeta(SlashCommandPluginKey);
            if (meta !== undefined) {
              return meta;
            }

            // If document didn't change and no selection change, keep previous state
            if (!tr.docChanged && tr.selection.eq(prev.range ? editor.state.selection : tr.selection)) {
              return prev;
            }

            // Check if we have a selection (non-empty selection disables)
            if (!tr.selection.empty) {
              return { active: false, range: null, query: '', text: '' };
            }

            const $from = tr.selection.$from;

            // Get text content before cursor in the current block
            const textBefore = $from.parent.textBetween(
              Math.max(0, $from.parentOffset - 100),
              $from.parentOffset,
              undefined,
              '\ufffc'
            );

            // Find slash command trigger - "/" followed by optional non-space characters
            const match = textBefore.match(/\/([^\s]*)$/);

            if (match) {
              const from = $from.pos - match[0].length;
              const to = $from.pos;
              const query = match[1] || '';

              return {
                active: true,
                range: { from, to },
                query,
                text: match[0],
              };
            }

            return { active: false, range: null, query: '', text: '' };
          },
        },

        view() {
          return {
            update(view, prevState) {
              const state = SlashCommandPluginKey.getState(view.state) as InternalSuggestionState;
              const prevPluginState = SlashCommandPluginKey.getState(prevState) as InternalSuggestionState | undefined;

              const hasChanged =
                state.active !== prevPluginState?.active ||
                state.query !== prevPluginState?.query ||
                state.range?.from !== prevPluginState?.range?.from;

              if (!hasChanged) {
                return;
              }

              if (!state.active || !state.range) {
                onStateChange?.(null);
                return;
              }

              // Filter commands based on query
              const filteredCommands = filterCommands(slashCommands, state.query);

              if (filteredCommands.length === 0) {
                onStateChange?.(null);
                return;
              }

              // Get cursor position for popup
              const coords = view.coordsAtPos(state.range.from);

              onStateChange?.({
                active: true,
                range: state.range,
                query: state.query,
                coords: {
                  left: coords.left,
                  top: coords.top,
                  bottom: coords.bottom,
                },
                items: filteredCommands,
              });
            },

            destroy() {
              onStateChange?.(null);
            },
          };
        },
      }),
    ];
  },
});

// Helper to execute a slash command
export function executeSlashCommand(
  editor: { chain: () => unknown; state: unknown; commands: { deleteRange: (range: { from: number; to: number }) => void } },
  command: SlashCommand,
  range: { from: number; to: number }
) {
  command.command(editor as Parameters<SlashCommand['command']>[0], range);
}

// Helper to close the slash command menu
export function closeSlashCommand(editor: {
  state: Parameters<typeof SlashCommandPluginKey.getState>[0];
  commands: { deleteRange: (range: { from: number; to: number }) => void };
  view: { dispatch: (tr: unknown) => void; state: { tr: { setMeta: (key: typeof SlashCommandPluginKey, value: InternalSuggestionState) => unknown } } };
}) {
  const state = SlashCommandPluginKey.getState(editor.state) as InternalSuggestionState;
  if (state?.range) {
    editor.commands.deleteRange(state.range);
  }
  editor.view.dispatch(
    editor.view.state.tr.setMeta(SlashCommandPluginKey, {
      active: false,
      range: null,
      query: '',
      text: '',
    })
  );
}
