'use client';

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
  useCallback,
  useRef,
} from 'react';
import { createPortal } from 'react-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  type SlashCommand,
  SLASH_COMMAND_CATEGORIES,
  groupCommandsByCategory,
} from './slash-commands';
import { type SlashCommandState } from './slash-command-extension';
import { type HonorificType } from '@/lib/honorifics';

// Cache for SVG content (shared with honorific-selector-dialog)
const svgCache = new Map<string, string>();

function HonorificPreview({ type }: { type: HonorificType }) {
  const [svgContent, setSvgContent] = useState<string | null>(svgCache.get(type) || null);

  useEffect(() => {
    if (svgCache.has(type)) {
      setSvgContent(svgCache.get(type)!);
      return;
    }

    fetch(`/calligraphy/${type}.svg`)
      .then((res) => res.text())
      .then((svg) => {
        svgCache.set(type, svg);
        setSvgContent(svg);
      })
      .catch((err) => console.error(`Failed to load honorific: ${type}`, err));
  }, [type]);

  if (!svgContent) {
    return null;
  }

  return (
    <span
      className="inline-block [&>svg]:h-4 [&>svg]:w-auto opacity-70"
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}

export interface SlashCommandListRef {
  onKeyDown: (event: KeyboardEvent) => boolean;
}

interface SlashCommandListProps {
  items: SlashCommand[];
  command: (item: SlashCommand) => void;
}

export const SlashCommandList = forwardRef<SlashCommandListRef, SlashCommandListProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    // Group commands by category
    const groupedCommands = groupCommandsByCategory(items);

    // Flatten for keyboard navigation
    const flatItems = Array.from(groupedCommands.values()).flat();

    // Reset selection when items change
    useEffect(() => {
      setSelectedIndex(0);
    }, [items]);

    // Auto-scroll to selected item
    useEffect(() => {
      const selectedElement = scrollAreaRef.current?.querySelector(
        `[data-index="${selectedIndex}"]`
      );
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }, [selectedIndex]);

    const selectItem = useCallback(
      (index: number) => {
        const item = flatItems[index];
        if (item) {
          command(item);
        }
      },
      [flatItems, command]
    );

    useImperativeHandle(ref, () => ({
      onKeyDown: (event: KeyboardEvent) => {
        if (event.key === 'ArrowUp') {
          event.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + flatItems.length) % flatItems.length);
          return true;
        }

        if (event.key === 'ArrowDown') {
          event.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % flatItems.length);
          return true;
        }

        if (event.key === 'Enter' || event.key === 'Tab') {
          event.preventDefault();
          selectItem(selectedIndex);
          return true;
        }

        return false;
      },
    }));

    if (flatItems.length === 0) {
      return (
        <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm text-muted-foreground">
          No commands found
        </div>
      );
    }

    let currentIndex = 0;

    return (
      <div className="bg-popover border rounded-lg shadow-lg overflow-hidden w-72">
        <ScrollArea className="max-h-80" ref={scrollAreaRef}>
          <div className="p-1">
            {Array.from(groupedCommands.entries()).map(([category, categoryItems]) => {
              const startIndex = currentIndex;

              return (
                <div key={category} className="mb-1 last:mb-0">
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    {SLASH_COMMAND_CATEGORIES[category]}
                  </div>
                  {categoryItems.map((item, itemIndex) => {
                    const flatIndex = startIndex + itemIndex;
                    const isSelected = selectedIndex === flatIndex;

                    // Update currentIndex for next category
                    if (itemIndex === categoryItems.length - 1) {
                      currentIndex = startIndex + categoryItems.length;
                    }

                    return (
                      <button
                        key={item.id}
                        data-index={flatIndex}
                        className={`
                          flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-sm cursor-pointer
                          transition-colors outline-none
                          ${isSelected ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'}
                        `}
                        onClick={() => command(item)}
                        onMouseEnter={() => setSelectedIndex(flatIndex)}
                      >
                        <item.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="flex flex-col items-start min-w-0 flex-1">
                          <span className="font-medium truncate w-full text-left">
                            {item.label}
                          </span>
                          {item.description && (
                            <span className="text-xs text-muted-foreground truncate w-full text-left">
                              {item.description}
                            </span>
                          )}
                        </div>
                        {item.honorificType && (
                          <div className="shrink-0 ml-auto">
                            <HonorificPreview type={item.honorificType} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    );
  }
);

SlashCommandList.displayName = 'SlashCommandList';

// Portal wrapper component for rendering the menu
interface SlashCommandMenuProps {
  state: SlashCommandState | null;
  onCommand: (item: SlashCommand) => void;
  onClose: () => void;
}

export function SlashCommandMenu({ state, onCommand, onClose }: SlashCommandMenuProps) {
  const listRef = useRef<SlashCommandListRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle keyboard events
  useEffect(() => {
    if (!state) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Let the list handle navigation keys
      if (listRef.current?.onKeyDown(event)) {
        return;
      }

      // Close on escape
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true); // capture phase to intercept before TipTap
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [state, onClose]);

  // Handle click outside
  useEffect(() => {
    if (!state) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // Delay to avoid immediate close on the triggering click
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [state, onClose]);

  if (!state) return null;

  // Calculate position
  const style: React.CSSProperties = {
    position: 'fixed',
    left: state.coords.left,
    top: state.coords.bottom + 8, // 8px below cursor
    zIndex: 50,
  };

  return createPortal(
    <div ref={containerRef} style={style}>
      <SlashCommandList
        ref={listRef}
        items={state.items}
        command={onCommand}
      />
    </div>,
    document.body
  );
}
