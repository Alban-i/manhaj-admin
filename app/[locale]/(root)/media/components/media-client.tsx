'use client';

import { useState, useMemo, useCallback } from 'react';
import { PlusCircle, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MediaWithProfile } from '@/actions/media/get-media';
import { MediaDataTable } from './media-data-table';
import { createMediaColumns } from './media-columns';
import { MediaUploadDialog } from '@/components/media/media-upload-dialog';
import { RevalidateButton } from '@/components/revalidate-button';
import { toast } from 'sonner';
import { useMediaByTypeQuery } from '@/actions/media/media-queries';
import { useQueryClient } from '@tanstack/react-query';
import { mediaKeys } from '@/actions/media/media-api';

interface MediaClientProps {
  initialMedia: MediaWithProfile[];
  mediaType: 'audio' | 'image' | 'video' | 'document';
  title: string;
  revalidatePath: string;
}

const MediaClient: React.FC<MediaClientProps> = ({ 
  initialMedia, 
  mediaType, 
  title,
  revalidatePath 
}) => {
  const queryClient = useQueryClient();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  // Use TanStack Query with initial data from SSR
  const { data: media = [], isLoading, error } = useMediaByTypeQuery(mediaType);

  // Use initial data if available and query hasn't loaded yet
  const displayMedia = media.length > 0 ? media : initialMedia;

  const refreshMedia = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: mediaKeys.byType(mediaType) });
  }, [queryClient, mediaType]);

  const columns = useMemo(() => createMediaColumns(refreshMedia), [refreshMedia]);

  return (
    <div className="grid gap-3 px-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-bold">{title}</h2>
        <div className="ml-auto flex items-center gap-2">
          <RevalidateButton path={revalidatePath} label={`Revalidate ${title} Page`} />
          
          <Button 
            onClick={() => setIsUploadDialogOpen(true)}
            className="gap-1"
          >
            <Upload className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Upload
            </span>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        <div className="rounded-lg border p-4">
          <div className="text-2xl font-bold">{displayMedia.length}</div>
          <p className="text-sm text-muted-foreground">Total Files</p>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-2xl font-bold">
            {(displayMedia.reduce((acc, item) => acc + item.file_size, 0) / 1024 / 1024).toFixed(1)}MB
          </div>
          <p className="text-sm text-muted-foreground">Total Size</p>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-2xl font-bold">
            {displayMedia.filter(item => {
              if (!item.created_at) return false;
              const uploadDate = new Date(item.created_at);
              const oneWeekAgo = new Date();
              oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
              return uploadDate > oneWeekAgo;
            }).length}
          </div>
          <p className="text-sm text-muted-foreground">Recent (7 days)</p>
        </div>
      </div>

      {/* Data Table */}
      <MediaDataTable 
        columns={columns} 
        data={displayMedia} 
        searchPlaceholder={`Search ${title.toLowerCase()}...`}
        mediaType={mediaType}
      />

      {/* Upload Dialog */}
      <MediaUploadDialog
        isOpen={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
        mediaType={mediaType}
        onSuccess={() => refreshMedia()}
      />
    </div>
  );
};

export default MediaClient;