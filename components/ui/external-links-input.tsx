'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Plus,
  X,
  ChevronUp,
  ChevronDown,
  Pencil,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  parseExternalLink,
  getPlatformFromUrl,
  type ExternalLink,
} from '@/lib/parse-external-link';

interface ExternalLinksInputProps {
  value: ExternalLink[];
  onChange: (links: ExternalLink[]) => void;
  disabled?: boolean;
}

export function ExternalLinksInput({
  value,
  onChange,
  disabled,
}: ExternalLinksInputProps) {
  const [inputUrl, setInputUrl] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const addLink = () => {
    if (!inputUrl.trim()) return;

    try {
      // Validate URL
      let urlToAdd = inputUrl.trim();
      if (!urlToAdd.startsWith('http://') && !urlToAdd.startsWith('https://')) {
        urlToAdd = 'https://' + urlToAdd;
      }

      new URL(urlToAdd); // Validate URL format

      // Check for duplicates
      if (value.some((link) => link.url === urlToAdd)) {
        setError('This link already exists');
        return;
      }

      const parsed = parseExternalLink(urlToAdd);
      const newLink: ExternalLink = {
        url: parsed.url,
        display_name: parsed.suggestedDisplayName,
      };

      onChange([...value, newLink]);
      setInputUrl('');
      setError(null);
    } catch {
      setError('Invalid URL');
    }
  };

  const removeLink = (index: number) => {
    const newLinks = [...value];
    newLinks.splice(index, 1);
    onChange(newLinks);
  };

  const moveLink = (index: number, direction: 'up' | 'down') => {
    const newLinks = [...value];
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= newLinks.length) return;

    [newLinks[index], newLinks[newIndex]] = [newLinks[newIndex], newLinks[index]];
    onChange(newLinks);
  };

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setEditingName(value[index].display_name);
  };

  const saveEditing = () => {
    if (editingIndex === null) return;

    const newLinks = [...value];
    newLinks[editingIndex] = {
      ...newLinks[editingIndex],
      display_name: editingName.trim() || newLinks[editingIndex].display_name,
    };
    onChange(newLinks);
    setEditingIndex(null);
    setEditingName('');
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setEditingName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addLink();
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEditing();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  return (
    <div className="space-y-3">
      {/* Input row */}
      <div className="flex gap-2">
        <Input
          value={inputUrl}
          onChange={(e) => {
            setInputUrl(e.target.value);
            setError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder="https://youtube.com/..."
          disabled={disabled}
          className={cn(error && 'border-destructive')}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={addLink}
          disabled={disabled || !inputUrl.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Links list */}
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((link, index) => {
            const platform = getPlatformFromUrl(link.url);
            const Icon = platform.icon;
            const isEditing = editingIndex === index;

            return (
              <div
                key={index}
                className="flex items-center gap-2 p-2 rounded-md border bg-muted/30"
              >
                {/* Reorder buttons */}
                <div className="flex flex-col">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => moveLink(index, 'up')}
                    disabled={disabled || index === 0}
                  >
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => moveLink(index, 'down')}
                    disabled={disabled || index === value.length - 1}
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </div>

                {/* Platform icon */}
                <div className="flex items-center justify-center w-8 h-8 rounded bg-muted">
                  <Icon className="h-4 w-4" />
                </div>

                {/* Display name */}
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={handleEditKeyDown}
                      onBlur={saveEditing}
                      autoFocus
                      className="h-7 text-sm"
                    />
                  ) : (
                    <div className="flex flex-col">
                      <span className="text-sm font-medium truncate">
                        {link.display_name}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        {link.url}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {isEditing ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={saveEditing}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => startEditing(index)}
                      disabled={disabled}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => removeLink(index)}
                    disabled={disabled}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
