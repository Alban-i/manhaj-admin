import type { Editor } from '@tiptap/react';
import {
  Heading2,
  Heading3,
  Bold,
  Italic,
  List,
  ListOrdered,
  TextQuote,
  Quote,
  Code,
  Layout,
  Table,
  Asterisk,
  BookOpen,
  Twitter,
  Music,
  Scroll,
  type LucideIcon,
} from 'lucide-react';
import { HONORIFICS, type HonorificType, type HonorificCategory } from '@/lib/honorifics';

export type SlashCommandCategory = 'formatting' | 'blocks' | 'references' | 'honorific';

export interface SlashCommand {
  id: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  category: SlashCommandCategory;
  keywords: string[];
  command: (editor: Editor, range: { from: number; to: number }) => void;
  honorificType?: HonorificType;
}

// Category labels for grouping in the UI
export const SLASH_COMMAND_CATEGORIES: Record<SlashCommandCategory, string> = {
  formatting: 'Formatting',
  blocks: 'Blocks',
  references: 'References',
  honorific: 'Honorifics',
};

// Base commands (formatting, blocks, references)
const baseCommands: SlashCommand[] = [
  // Formatting
  {
    id: 'heading2',
    label: 'Heading 2',
    description: 'Large section heading',
    icon: Heading2,
    category: 'formatting',
    keywords: ['h2', 'heading', 'title', 'section'],
    command: (editor, range) => {
      editor.chain().focus().deleteRange(range).toggleHeading({ level: 2 }).run();
    },
  },
  {
    id: 'heading3',
    label: 'Heading 3',
    description: 'Medium section heading',
    icon: Heading3,
    category: 'formatting',
    keywords: ['h3', 'heading', 'title', 'subsection'],
    command: (editor, range) => {
      editor.chain().focus().deleteRange(range).toggleHeading({ level: 3 }).run();
    },
  },
  {
    id: 'bold',
    label: 'Bold',
    description: 'Make text bold',
    icon: Bold,
    category: 'formatting',
    keywords: ['bold', 'strong', 'gras'],
    command: (editor, range) => {
      editor.chain().focus().deleteRange(range).toggleBold().run();
    },
  },
  {
    id: 'italic',
    label: 'Italic',
    description: 'Make text italic',
    icon: Italic,
    category: 'formatting',
    keywords: ['italic', 'em', 'italique'],
    command: (editor, range) => {
      editor.chain().focus().deleteRange(range).toggleItalic().run();
    },
  },
  {
    id: 'bulletList',
    label: 'Bullet List',
    description: 'Create a bulleted list',
    icon: List,
    category: 'formatting',
    keywords: ['list', 'bullet', 'ul', 'unordered', 'liste'],
    command: (editor, range) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    id: 'numberedList',
    label: 'Numbered List',
    description: 'Create a numbered list',
    icon: ListOrdered,
    category: 'formatting',
    keywords: ['list', 'ordered', 'ol', 'number', 'numbered', 'liste'],
    command: (editor, range) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },

  // Blocks
  {
    id: 'blockquote',
    label: 'Blockquote',
    description: 'Simple blockquote',
    icon: TextQuote,
    category: 'blocks',
    keywords: ['quote', 'blockquote', 'citation'],
    command: (editor, range) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
  },
  {
    id: 'quote',
    label: 'Quote',
    description: 'Custom quote with source',
    icon: Quote,
    category: 'blocks',
    keywords: ['quote', 'citation', 'source'],
    command: (editor, range) => {
      editor.chain().focus().deleteRange(range).insertContent({
        type: 'quote',
        attrs: {
          isVerse: false,
          sourceLabel: '',
          sourceUrl: '',
        },
        content: [{ type: 'paragraph' }],
      }).run();
    },
  },
  {
    id: 'codeBlock',
    label: 'Code Block',
    description: 'Insert code snippet',
    icon: Code,
    category: 'blocks',
    keywords: ['code', 'snippet', 'pre', 'programming'],
    command: (editor, range) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
    },
  },
  {
    id: 'layout',
    label: 'Layout',
    description: 'Two-column layout',
    icon: Layout,
    category: 'blocks',
    keywords: ['layout', 'columns', 'grid', 'colonnes'],
    command: (editor, range) => {
      editor.chain().focus().deleteRange(range).insertContent({
        type: 'layout',
        content: [
          {
            type: 'layoutColumn',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: ' ' }] }],
          },
          {
            type: 'layoutColumn',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: ' ' }] }],
          },
        ],
      }).run();
    },
  },
  {
    id: 'table',
    label: 'Table',
    description: 'Insert a table',
    icon: Table,
    category: 'blocks',
    keywords: ['table', 'grid', 'tableau'],
    command: (editor, range) => {
      editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    },
  },
  {
    id: 'footnote',
    label: 'Footnote',
    description: 'Add a footnote',
    icon: Asterisk,
    category: 'blocks',
    keywords: ['footnote', 'note', 'reference', 'annotation'],
    command: (editor, range) => {
      editor.chain().focus().deleteRange(range).addFootnoteV2().run();
    },
  },

  // References
  {
    id: 'glossary',
    label: 'Glossary',
    description: 'Link to glossary term',
    icon: BookOpen,
    category: 'references',
    keywords: ['glossary', 'term', 'definition', 'glossaire'],
    command: (editor, range) => {
      editor.chain().focus().deleteRange(range).run();
      // Trigger glossary dialog via callback
      const storage = (editor.storage as unknown as Record<string, { openGlossary?: () => void }>).slashCommand;
      storage?.openGlossary?.();
    },
  },
  {
    id: 'post',
    label: 'Post',
    description: 'Embed a post reference',
    icon: Twitter,
    category: 'references',
    keywords: ['post', 'reference', 'embed', 'article'],
    command: (editor, range) => {
      editor.chain().focus().deleteRange(range).run();
      // Trigger post dialog via callback
      const storage = (editor.storage as unknown as Record<string, { openPostSelector?: () => void }>).slashCommand;
      storage?.openPostSelector?.();
    },
  },
  {
    id: 'media',
    label: 'Media',
    description: 'Insert media from library',
    icon: Music,
    category: 'references',
    keywords: ['media', 'audio', 'video', 'image', 'file'],
    command: (editor, range) => {
      editor.chain().focus().deleteRange(range).run();
      // Trigger media dialog via callback
      const storage = (editor.storage as unknown as Record<string, { openMediaLibrary?: () => void }>).slashCommand;
      storage?.openMediaLibrary?.();
    },
  },
];

// Generate honorific commands from HONORIFICS data
const honorificCommands: SlashCommand[] = Object.entries(HONORIFICS).map(([type, data]) => ({
  id: `honorific-${type}`,
  label: data.label,
  description: data.arabic,
  icon: Scroll,
  category: 'honorific' as const,
  keywords: [
    type,
    data.arabic,
    data.label.toLowerCase(),
    data.category,
    // Add transliteration parts for better searchability
    ...data.label.toLowerCase().split(' '),
  ],
  honorificType: type as HonorificType,
  command: (editor, range) => {
    editor.chain().focus().deleteRange(range).insertArabicHonorific(type as HonorificType).run();
  },
}));

// Export all commands
export const slashCommands: SlashCommand[] = [...baseCommands, ...honorificCommands];

// Filter commands based on query
export function filterCommands(commands: SlashCommand[], query: string): SlashCommand[] {
  if (!query) return commands;

  const normalizedQuery = query.toLowerCase().trim();

  return commands.filter((command) => {
    // Check label
    if (command.label.toLowerCase().includes(normalizedQuery)) return true;

    // Check description (including Arabic text for honorifics)
    if (command.description?.toLowerCase().includes(normalizedQuery)) return true;
    if (command.description?.includes(query)) return true; // For Arabic text (case-sensitive)

    // Check keywords
    if (command.keywords.some((keyword) => keyword.toLowerCase().includes(normalizedQuery))) return true;

    // Check id
    if (command.id.toLowerCase().includes(normalizedQuery)) return true;

    return false;
  });
}

// Group commands by category
export function groupCommandsByCategory(commands: SlashCommand[]): Map<SlashCommandCategory, SlashCommand[]> {
  const grouped = new Map<SlashCommandCategory, SlashCommand[]>();

  // Initialize all categories in order
  const categoryOrder: SlashCommandCategory[] = ['formatting', 'blocks', 'references', 'honorific'];
  categoryOrder.forEach((category) => {
    grouped.set(category, []);
  });

  // Group commands
  commands.forEach((command) => {
    const categoryCommands = grouped.get(command.category) || [];
    categoryCommands.push(command);
    grouped.set(command.category, categoryCommands);
  });

  // Remove empty categories
  categoryOrder.forEach((category) => {
    if (grouped.get(category)?.length === 0) {
      grouped.delete(category);
    }
  });

  return grouped;
}
