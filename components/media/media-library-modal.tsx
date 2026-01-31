'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  Upload, 
  Filter, 
  Image, 
  Music, 
  Video, 
  FileText,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { MediaWithProfile, MediaFilters } from '@/actions/media/get-media';
import { MediaItem } from './media-item';
import { ImageGridItem } from './image-grid-item';
import { MediaUploadDialog } from './media-upload-dialog';
import { toast } from 'sonner';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TablesInsert } from '@/types/types_db';
import wait from '@/hooks/use-wait';
import { useMediaQuery } from '@/actions/media/media-queries';
import { useQueryClient } from '@tanstack/react-query';
import { mediaKeys } from '@/actions/media/media-api';

export interface MediaLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (media: MediaWithProfile) => void;
  mediaType?: 'audio' | 'image' | 'video' | 'document';
  title?: string;
  multiSelect?: boolean;
}

export const MediaLibraryModal: React.FC<MediaLibraryModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  mediaType,
  title = 'Media Library',
  multiSelect = false,
}) => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>(mediaType || 'all');
  const [selectedMedia, setSelectedMedia] = useState<MediaWithProfile[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [highlightedMediaIds, setHighlightedMediaIds] = useState<Set<string>>(new Set());
  
  const itemsPerPage = 20;

  // Memoize filters to prevent unnecessary re-renders
  const filters = useMemo((): MediaFilters => ({
    limit: itemsPerPage,
    offset: (currentPage - 1) * itemsPerPage,
    search: searchTerm || undefined,
    mediaType: selectedType && selectedType !== 'all' ? selectedType as 'audio' | 'image' | 'video' | 'document' : undefined,
  }), [currentPage, searchTerm, selectedType]);

  // Use TanStack Query for media fetching
  const { 
    data: mediaResult, 
    isLoading, 
    error, 
    isError 
  } = useMediaQuery(filters);

  const media = mediaResult?.data || [];
  const totalCount = mediaResult?.count || 0;

  const mediaTypeIcons = {
    audio: Music,
    image: Image,
    video: Video,
    document: FileText,
  };

  // Handle errors from TanStack Query
  useEffect(() => {
    if (isError && error) {
      console.error('Error fetching media:', error);
      toast.error('Failed to load media');
    }
  }, [isError, error]);

  // Reset page when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchTerm, selectedType, currentPage]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handleTypeChange = (value: string) => {
    setSelectedType(value);
  };

  const handleMediaSelect = (mediaItem: MediaWithProfile) => {
    if (multiSelect) {
      setSelectedMedia(prev => {
        const isSelected = prev.some(item => item.id === mediaItem.id);
        if (isSelected) {
          return prev.filter(item => item.id !== mediaItem.id);
        }
        return [...prev, mediaItem];
      });
    } else {
      onSelect(mediaItem);
      onClose();
    }
  };

  const handleMultiSelectConfirm = () => {
    if (selectedMedia.length > 0) {
      selectedMedia.forEach(mediaItem => onSelect(mediaItem));
      onClose();
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleUploadSuccess = async (uploadedMedia: (TablesInsert<'media'> & { id: string })[]) => {
    // Invalidate all media queries to refresh the data
    queryClient.invalidateQueries({ queryKey: mediaKeys.all });
    
    // Reset to page 1
    setCurrentPage(1);
    
    // Highlight the newly uploaded media
    const newMediaIds = new Set(uploadedMedia.map(media => media.id));
    setHighlightedMediaIds(newMediaIds);
    
    // Remove highlighting after 3 seconds
    wait(3000).then(() => {
      setHighlightedMediaIds(new Set());
    });
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] sm:max-w-[95vw] w-[95vw] h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {title}
              {selectedMedia.length > 0 && (
                <Badge variant="secondary">
                  {selectedMedia.length} selected
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 flex-1 overflow-hidden">
            {/* Filter and Upload Bar */}
            <div className="flex items-center gap-4 pb-4">
              <Select value={selectedType} onValueChange={handleTypeChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                  <SelectItem value="image">Images</SelectItem>
                  <SelectItem value="video">Videos</SelectItem>
                  <SelectItem value="document">Documents</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={() => setIsUploadDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload
              </Button>
            </div>

            {/* Search Bar */}
            <div className="pb-4 border-b">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search media..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
            </div>

            {/* Media Display */}
            <ScrollArea className="flex-1">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : media.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <FileText className="h-12 w-12 mb-4" />
                  <p>No media found</p>
                  <p className="text-sm">Try adjusting your search or upload new media</p>
                </div>
              ) : selectedType === 'image' ? (
                /* Grid view for images */
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-1">
                  {media.map((mediaItem) => (
                    <ImageGridItem
                      key={mediaItem.id}
                      media={mediaItem}
                      isSelected={selectedMedia.some(item => item.id === mediaItem.id)}
                      isHighlighted={highlightedMediaIds.has(mediaItem.id)}
                      onSelect={() => handleMediaSelect(mediaItem)}
                    />
                  ))}
                </div>
              ) : (
                /* Table view for other media types */
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {media.map((mediaItem) => (
                      <MediaItem
                        key={mediaItem.id}
                        media={mediaItem}
                        isSelected={selectedMedia.some(item => item.id === mediaItem.id)}
                        isHighlighted={highlightedMediaIds.has(mediaItem.id)}
                        onSelect={() => handleMediaSelect(mediaItem)}
                        onRefresh={() => queryClient.invalidateQueries({ queryKey: mediaKeys.all })}
                      />
                    ))}
                  </TableBody>
                </Table>
              )}
            </ScrollArea>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t pt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} results
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {multiSelect && (
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleMultiSelectConfirm}
                disabled={selectedMedia.length === 0}
              >
                Select {selectedMedia.length > 0 ? `(${selectedMedia.length})` : ''}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <MediaUploadDialog
        isOpen={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
        mediaType={mediaType}
        onSuccess={handleUploadSuccess}
      />
    </>
  );
};