'use client';

import { CharacterCount, Placeholder } from '@tiptap/extensions';
import Document from '@tiptap/extension-document';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import { Table, TableCell, TableHeader, TableRow } from '@tiptap/extension-table';
import Typography from '@tiptap/extension-typography';
import { EditorView } from '@tiptap/pm/view';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { AutoTextDirectionExtension } from './text-direction/auto-text-direction-extension';
import { FootnotesV2Extension } from './footnotes-v2/footnotes-v2-extension-new';
import { FootnoteV2Extension } from './footnotes-v2/footnote-v2-extension-new';
import { FootnoteReferenceV2Extension } from './footnotes-v2/footnote-reference-v2-extension-new';
import QuoteExtension from './quote/quote-extension';
import QuoteTranslationExtension from './quote/quote-translation-extension';

import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import {
  Asterisk,
  Bold,
  BookOpen,
  Scroll,
  Code,
  Columns,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Layout,
  Link as LinkIcon,
  List,
  ListOrdered,
  Merge,
  Music,
  Quote,
  Rows,
  TextQuote,
  Split,
  Table as TableIcon,
  Trash2,
  Twitter,
} from 'lucide-react';
import { CldUploadWidget } from 'next-cloudinary';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CustomAudioExtension } from './audio/custom-audio-extension';
import CustomImageExtension from './image/custom-image-extension';
import { CustomVideoExtension } from './video/video-extension';
import { CustomDocumentExtension } from './document/document-extension';
// import { PostReference } from './post/static-post-reference';
// import { PostSelector } from './post/static-post-selector-dialog';
import { DynamicPostReference } from './post/dynamic-post-reference';
import { DynamicPostSelectorDialog } from './post/dynamic-post-selector-dialog';
import {
  LayoutColumnExtension,
  LayoutExtension,
} from './layout/layout-extension';
import { MediaLibraryModal } from '../media/media-library-modal';
import { MediaWithProfile } from '@/actions/media/get-media';
import { addArticleMedia } from '@/actions/media/add-article-media';
import { toast } from 'sonner';
import { GlossaryTermExtension } from './glossary/glossary-term-extension';
import { GlossarySelectorDialog } from './glossary/glossary-selector-dialog';
import { ArabicHonorificExtension, HonorificSelectorDialog } from './honorific';
import { type HonorificType } from '@/lib/honorifics';
import {
  SlashCommandExtension,
  SlashCommandMenu,
  type SlashCommandState,
  type SlashCommand,
} from './slash-command';

interface EditorProps {
  content?: string;
  onChange?: (content: string, json?: Record<string, unknown>) => void;
  articleId?: string;
  onMediaAdded?: () => void;
}

interface UploadResult {
  info?:
    | {
        secure_url: string;
      }
    | string;
}

export default function Editor({
  content = '',
  onChange,
  articleId,
  onMediaAdded,
}: EditorProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);
  const [isGlossarySelectorOpen, setIsGlossarySelectorOpen] = useState(false);
  const [isHonorificSelectorOpen, setIsHonorificSelectorOpen] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [showRawHtml, setShowRawHtml] = useState(false);
  const [slashCommandState, setSlashCommandState] = useState<SlashCommandState | null>(null);
  const savedCursorPositionRef = useRef<number | null>(null);
  const lastContentRef = useRef<string>(content);
  const isInitializedRef = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        document: false,
        // Explicitly disable link from StarterKit to prevent duplicate extension warning
        // We use our own Link configuration below
        link: false,
      }),
      Document.extend({
        content: 'block+ footnotesV2?',
      }),
      Highlight,
      Typography,
      Link,
      CustomImageExtension.configure({
        inline: true,
        allowBase64: true,
      }),
      CustomAudioExtension,
      CustomVideoExtension,
      CustomDocumentExtension,
      CharacterCount,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader.extend({
        content: 'paragraph',
      }),
      TableCell.extend({
        content: 'paragraph',
      }),
      AutoTextDirectionExtension.configure({
        types: ['paragraph', 'heading'],
      }),
      Placeholder.configure({
        placeholder: '',
      }),
      LayoutExtension,
      LayoutColumnExtension,
      FootnotesV2Extension,
      FootnoteV2Extension,
      FootnoteReferenceV2Extension,
      // PostReference,
      DynamicPostReference,
      QuoteExtension,
      QuoteTranslationExtension,
      GlossaryTermExtension,
      ArabicHonorificExtension,
      SlashCommandExtension.configure({
        onStateChange: setSlashCommandState,
        onOpenGlossary: () => {
          setIsGlossarySelectorOpen(true);
        },
        onOpenPostSelector: () => {
          // Will be handled by DynamicPostSelectorDialog
        },
        onOpenMediaLibrary: () => {
          setIsMediaLibraryOpen(true);
        },
      }),
    ],
    content: content || '<p></p>',
    immediatelyRender: false, // Fix SSR hydration mismatch in TipTap v3
    onCreate: () => {
      isInitializedRef.current = true;
    },
    onUpdate: ({ editor }) => {
      const newContent = editor.getHTML();

      // Ignore updates during initialization
      if (!isInitializedRef.current) return;

      // Only notify parent if content actually changed
      if (lastContentRef.current !== newContent) {
        lastContentRef.current = newContent;
        onChange?.(newContent, editor.getJSON());
      }
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none min-h-[200px] w-full',
      },
      handleDrop: (view: EditorView, event: DragEvent, _slice, _moved) => {
        try {
          const jsonData = event.dataTransfer?.getData('application/json');
          if (!jsonData) return false;

          event.preventDefault();

          const { pos: sourcePos, node: sourceNodeData } = JSON.parse(jsonData);

          // Get coordinates relative to the editor view
          const coordinates = view.posAtCoords({
            left: event.clientX,
            top: event.clientY,
          });

          if (!coordinates) return false;

          const tr = view.state.tr;

          // Delete the node from its original position
          const sourcePosition = parseInt(sourcePos);
          const sourceNode = view.state.doc.nodeAt(sourcePosition);

          if (!sourceNode) return false;

          console.log('Source node type:', sourceNode.type.name);
          console.log(
            'Available node types:',
            Object.keys(view.state.schema.nodes)
          );

          // Delete old node and insert new one at drop position
          tr.delete(sourcePosition, sourcePosition + sourceNode.nodeSize);

          // Check node type and insert appropriate node
          if (sourceNode.type.name === 'customImage') {
            tr.insert(
              coordinates.pos,
              view.state.schema.nodes.customImage.create(sourceNodeData.attrs)
            );
          } else if (sourceNode.type.name === 'audio') {
            tr.insert(
              coordinates.pos,
              view.state.schema.nodes.audio.create(sourceNodeData.attrs)
            );
          } else if (sourceNode.type.name === 'video') {
            tr.insert(
              coordinates.pos,
              view.state.schema.nodes.video.create(sourceNodeData.attrs)
            );
          } else if (sourceNode.type.name === 'customDocument') {
            tr.insert(
              coordinates.pos,
              view.state.schema.nodes.customDocument.create(
                sourceNodeData.attrs
              )
            );
          }

          view.dispatch(tr);
          return true;
        } catch (error) {
          console.error('Error handling node drop:', error);
          return false;
        }
      },
    },
  }, []); // Empty dependency array prevents editor from being recreated

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const onImageUpload = useCallback(
    (result: UploadResult) => {
      if (
        editor &&
        typeof result.info === 'object' &&
        result.info?.secure_url
      ) {
        editor
          .chain()
          .focus()
          .setImage({
            src: result.info.secure_url,
            alt: 'Uploaded image',
            title: 'Click to edit image properties',
          })
          .run();
      }
    },
    [editor]
  );


  const insertLayout = useCallback(() => {
    if (!editor) return;

    const layoutStructure = {
      type: 'layout',
      content: [
        {
          type: 'layoutColumn',
          // attrs: { width: '50%' },
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: ' ' }],
            },
          ],
        },
        {
          type: 'layoutColumn',
          // attrs: { width: '50%' },
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: ' ' }],
            },
          ],
        },
      ],
    };

    editor.chain().focus().insertContent(layoutStructure).run();
  }, [editor]);


  const insertFootnoteV2 = useCallback(() => {
    if (!editor) return;

    editor.chain().focus().addFootnoteV2().run();
  }, [editor]);

  const handleMediaSelect = useCallback(
    async (media: MediaWithProfile) => {
      if (!editor) return;

      // Get saved cursor position, fallback to current selection
      const position = savedCursorPositionRef.current ?? editor.state.selection.$anchor.pos;

      // Clear saved position after use
      savedCursorPositionRef.current = null;

      // Insert different types of media based on their type
      switch (media.media_type) {
        case 'audio':
          editor
            .chain()
            .focus()
            .insertContentAt(position, {
              type: 'audio',
              attrs: {
                src: media.url,
                title: media.original_name,
              },
            })
            .run();
          break;
        case 'image':
          editor
            .chain()
            .focus()
            .insertContentAt(position, {
              type: 'customImage',
              attrs: {
                src: media.url,
                alt: media.alt_text || media.original_name,
                title: media.original_name,
              },
            })
            .run();
          break;
        case 'video':
          editor
            .chain()
            .focus()
            .insertContentAt(position, {
              type: 'video',
              attrs: {
                src: media.url,
                title: media.original_name,
              },
            })
            .run();
          break;
        case 'document':
          editor
            .chain()
            .focus()
            .insertContentAt(position, {
              type: 'customDocument',
              attrs: {
                src: media.url,
                title: media.original_name,
                fileType: media.original_name?.split('.').pop()?.toUpperCase(),
              },
            })
            .run();
          break;
      }

      // Create article-media relationship if articleId exists
      if (articleId) {
        try {
          const result = await addArticleMedia(articleId, media.id);
          if (result.error) {
            toast.error('Failed to create media relationship: ' + result.error);
          } else {
            onMediaAdded?.();
          }
        } catch (error) {
          toast.error('Failed to create media relationship');
        }
      }
    },
    [editor, articleId, onMediaAdded]
  );

  if (!editor || !isMounted) {
    return null;
  }

  return (
    <div className="w-full">
      {/* MENU BAR */}
      <div className="flex flex-wrap items-center gap-2 mb-4 p-2 bg-muted rounded-lg">
        {/* GROUP 1: Bold & Italic */}
        <ButtonGroup>
          <Toggle
            pressed={editor.isActive('bold')}
            onPressedChange={() => editor.chain().focus().toggleBold().run()}
            size="sm"
            variant="outline"
            title="Bold (Ctrl+B)"
          >
            <Bold className="h-4 w-4" />
          </Toggle>
          <Toggle
            pressed={editor.isActive('italic')}
            onPressedChange={() => editor.chain().focus().toggleItalic().run()}
            size="sm"
            variant="outline"
            title="Italic (Ctrl+I)"
          >
            <Italic className="h-4 w-4" />
          </Toggle>
        </ButtonGroup>

        {/* GROUP 2: Headings */}
        <ButtonGroup>
          <Toggle
            pressed={editor.isActive('heading', { level: 2 })}
            onPressedChange={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            size="sm"
            variant="outline"
            title="Heading 2"
          >
            <Heading2 className="h-4 w-4" />
          </Toggle>
          <Toggle
            pressed={editor.isActive('heading', { level: 3 })}
            onPressedChange={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            size="sm"
            variant="outline"
            title="Heading 3"
          >
            <Heading3 className="h-4 w-4" />
          </Toggle>
        </ButtonGroup>

        {/* GROUP 3: Lists */}
        <ButtonGroup>
          <Toggle
            pressed={editor.isActive('bulletList')}
            onPressedChange={() =>
              editor.chain().focus().toggleBulletList().run()
            }
            size="sm"
            variant="outline"
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </Toggle>
          <Toggle
            pressed={editor.isActive('orderedList')}
            onPressedChange={() =>
              editor.chain().focus().toggleOrderedList().run()
            }
            size="sm"
            variant="outline"
            title="Ordered List"
          >
            <ListOrdered className="h-4 w-4" />
          </Toggle>
        </ButtonGroup>

        {/* GROUP 4: Code, Link, Quote Dropdown */}
        <ButtonGroup>
          <Toggle
            pressed={editor.isActive('codeBlock')}
            onPressedChange={() => editor.chain().focus().toggleCodeBlock().run()}
            size="sm"
            variant="outline"
            title="Code Block"
          >
            <Code className="h-4 w-4" />
          </Toggle>
          <Toggle
            pressed={editor.isActive('link')}
            onPressedChange={() => {
              const url = window.prompt('URL');
              if (url) {
                editor.chain().focus().setLink({ href: url }).run();
              }
            }}
            size="sm"
            variant="outline"
            title="Link"
          >
            <LinkIcon className="h-4 w-4" />
          </Toggle>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="bg-transparent border-input h-8 w-8"
            title="Quote"
            onClick={() => {
              if (!editor) return;
              editor
                .chain()
                .focus()
                .insertContent({
                  type: 'quote',
                  attrs: {
                    isVerse: false,
                    sourceLabel: '',
                    sourceUrl: '',
                  },
                  content: [
                    {
                      type: 'paragraph',
                    },
                  ],
                })
                .run();
            }}
          >
            <Quote className="h-4 w-4" />
          </Button>
          <Toggle
            pressed={editor.isActive('blockquote')}
            onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
            size="sm"
            variant="outline"
            className="bg-transparent border-input h-8 w-8 data-[state=on]:bg-accent"
            title="Simple Blockquote"
          >
            <TextQuote className="h-4 w-4" />
          </Toggle>
        </ButtonGroup>

        {/* GROUP 7: Layout, Footnote, Table */}
        <ButtonGroup>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="bg-transparent border-input"
            onClick={(e) => {
              e.preventDefault();
              insertLayout();
            }}
            title="Insert Layout"
          >
            <Layout className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="bg-transparent border-input"
            onClick={insertFootnoteV2}
            title="Insert Footnote"
          >
            <Asterisk className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="bg-transparent border-input" title="Table">
                <TableIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Table Operations</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                  .run()
              }
            >
              <TableIcon className="h-4 w-4" />
              <span>Insert Table</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Columns</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().addColumnBefore().run()}
              disabled={!editor.can().addColumnBefore()}
            >
              <Columns className="h-4 w-4" />
              <span>Add Column Before</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              disabled={!editor.can().addColumnAfter()}
            >
              <Columns className="h-4 w-4 rotate-180" />
              <span>Add Column After</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().deleteColumn().run()}
              disabled={!editor.can().deleteColumn()}
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete Column</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Rows</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().addRowBefore().run()}
              disabled={!editor.can().addRowBefore()}
            >
              <Rows className="h-4 w-4" />
              <span>Add Row Before</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().addRowAfter().run()}
              disabled={!editor.can().addRowAfter()}
            >
              <Rows className="h-4 w-4 rotate-180" />
              <span>Add Row After</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().deleteRow().run()}
              disabled={!editor.can().deleteRow()}
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete Row</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Cells</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().mergeCells().run()}
              disabled={!editor.can().mergeCells()}
            >
              <Merge className="h-4 w-4" />
              <span>Merge Cells</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().splitCell().run()}
              disabled={!editor.can().splitCell()}
            >
              <Split className="h-4 w-4" />
              <span>Split Cell</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => editor.chain().focus().deleteTable().run()}
              disabled={!editor.can().deleteTable()}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete Table</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </ButtonGroup>

        {/* SEPARATOR 1 */}
        <Separator className="h-6" />

        {/* GROUP 6: MEDIA MANAGEMENT */}
        <ButtonGroup>
          <CldUploadWidget onSuccess={onImageUpload} uploadPreset="markazshaafii">
            {({ open }) => {
              const onClick = () => {
                open();
              };
              return (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClick}
                  size="sm"
                  className="bg-transparent border-input"
                >
                  <ImagePlus className="h-4 w-4" />
                  Image (Cloud)
                </Button>
              );
            }}
          </CldUploadWidget>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="bg-transparent border-input"
            onClick={() => {
              if (editor) {
                savedCursorPositionRef.current = editor.state.selection.$anchor.pos;
              }
              setIsMediaLibraryOpen(true);
            }}
          >
            <Music className="h-4 w-4" />
            Media
          </Button>
        </ButtonGroup>

        {/* GROUP 8: Post & Glossary */}
        <ButtonGroup>
          <DynamicPostSelectorDialog
            onSelect={(postId) => {
              if (editor) {
                editor
                  .chain()
                  .focus()
                  .insertContent({
                    type: 'dynamicPostReference',
                    attrs: {
                      postId,
                    },
                  })
                  .run();
              }
            }}
            triggerButton={
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="bg-transparent border-input"
                title="Post"
              >
                <Twitter className="h-4 w-4" />
                Post
              </Button>
            }
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="bg-transparent border-input"
            onClick={() => {
              const { from, to } = editor.state.selection;
              const text = editor.state.doc.textBetween(from, to);
              setSelectedText(text);
              setIsGlossarySelectorOpen(true);
            }}
            title="Add Glossary Term"
          >
            <BookOpen className="h-4 w-4" />
            Glossary
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="bg-transparent border-input"
            onClick={() => setIsHonorificSelectorOpen(true)}
            title="Insert Arabic Honorific"
          >
            <Scroll className="h-4 w-4" />
            Honorific
          </Button>
        </ButtonGroup>
      </div>

      {/* ERROR MESSAGE */}
      {uploadError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{uploadError}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                type="button"
                onClick={() => setUploadError(null)}
                className="inline-flex text-red-400 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <span className="sr-only">Dismiss</span>
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDITOR CONTENT */}
      <EditorContent
        editor={editor}
        className="border rounded-lg p-4 bg-muted w-full tiptap [&_.footnotes]:mt-8 [&_.footnotes]:pt-8 [&_.footnotes]:border-t [&_.footnotes]:border-border [&_.footnotes]:list-decimal [&_.footnote-reference]:text-primary [&_.footnote-reference]:align-super [&_.footnote-reference]:text-xs [&_.footnote-reference]:cursor-pointer [&_.footnote-reference]:ml-0.5"
      />
      <div className="mt-2 text-sm text-muted-foreground">
        {editor.storage.characterCount.characters()} characters
      </div>

      <Separator className="my-4" />

      <div className="flex items-center space-x-2">
        <Switch
          id="show-raw-html"
          checked={showRawHtml}
          onCheckedChange={setShowRawHtml}
        />
        <Label htmlFor="show-raw-html" className="text-sm font-medium">
          Show Raw HTML
        </Label>
      </div>

      {showRawHtml && (
        <div className="mt-4">
          <pre className="bg-muted p-4 rounded-3xl border text-sm font-mono overflow-x-auto shadow-md max-h-96">
            <code className="whitespace-pre-wrap">
              {editor.getHTML().replace(/></g, '>\n<')}
            </code>
          </pre>
        </div>
      )}

      {/* Media Library Modal */}
      <MediaLibraryModal
        isOpen={isMediaLibraryOpen}
        onClose={() => setIsMediaLibraryOpen(false)}
        onSelect={handleMediaSelect}
        title="Select Media"
      />

      {/* Glossary Selector Dialog */}
      <GlossarySelectorDialog
        isOpen={isGlossarySelectorOpen}
        onClose={() => setIsGlossarySelectorOpen(false)}
        onSelect={(term) => {
          if (editor) {
            const { from, to } = editor.state.selection;
            const selectedText = editor.state.doc.textBetween(from, to);

            if (selectedText) {
              // Mark selected text as glossary term
              editor
                .chain()
                .focus()
                .setGlossaryTerm(term.id.toString(), term.definition)
                .run();
            } else {
              // Insert the term text and mark it
              const currentPos = editor.state.selection.from;
              editor
                .chain()
                .focus()
                .insertContent(term.term)
                .setTextSelection({
                  from: currentPos,
                  to: currentPos + term.term.length,
                })
                .setGlossaryTerm(term.id.toString(), term.definition)
                .run();
            }
          }
        }}
        selectedText={selectedText}
      />

      {/* Honorific Selector Dialog */}
      <HonorificSelectorDialog
        isOpen={isHonorificSelectorOpen}
        onClose={() => setIsHonorificSelectorOpen(false)}
        onSelect={(type: HonorificType) => {
          if (editor) {
            editor.chain().focus().insertArabicHonorific(type).run();
          }
        }}
      />

      {/* Slash Command Menu */}
      <SlashCommandMenu
        state={slashCommandState}
        onCommand={(item: SlashCommand) => {
          if (slashCommandState?.range) {
            item.command(editor, slashCommandState.range);
          }
          setSlashCommandState(null);
        }}
        onClose={() => setSlashCommandState(null)}
      />
    </div>
  );
}
