'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Image, 
  Music, 
  Video, 
  FileText, 
  Download, 
  Trash2, 
  Save,
  Calendar,
  User,
  HardDrive,
  File,
  Upload,
  Disc,
  Clock,
  Mic,
  RefreshCw
} from 'lucide-react';
import { MediaWithProfile } from '@/actions/media/get-media';
import { useUpdateMediaMutation, useDeleteMediaMutation } from '@/actions/media/media-queries';
import { MediaUploadDialog } from '@/components/media/media-upload-dialog';
import { toast } from 'sonner';
import NextImage from 'next/image';
import { generateSlug } from '@/lib/utils';
import ImageUpload from '@/components/image-upload';

const mediaFormSchema = z.object({
  alt_text: z.string().optional(),
  description: z.string().optional(),
  transcription: z.string().optional(),
  slug: z.string()
    .min(3, 'Slug must be at least 3 characters long')
    .regex(/^[a-z0-9_-]+$/, 'Slug must contain only lowercase letters, numbers, hyphens, and underscores'),
  cover_image_url: z.string().optional(),
});

const audioMetadataSchema = z.object({
  audio_title: z.string().optional(),
  audio_artist: z.string().optional(),
  audio_album: z.string().optional(),
  audio_genre: z.string().optional(),
  audio_year: z.string().regex(/^\d{4}$/, 'Year must be 4 digits').optional().or(z.literal('')),
  audio_track_number: z.string().regex(/^\d+$/, 'Track number must be a number').optional().or(z.literal('')),
  audio_album_artist: z.string().optional(),
  audio_composer: z.string().optional(),
  audio_comment: z.string().optional(),
  update_file: z.boolean(),
});

type MediaFormData = z.infer<typeof mediaFormSchema>;
type AudioMetadataFormData = z.infer<typeof audioMetadataSchema>;

interface MediaFormProps {
  media: MediaWithProfile;
  onUpdate?: () => void;
  onDelete?: () => void;
}

const getMediaIcon = (mediaType: string) => {
  switch (mediaType) {
    case 'audio':
      return Music;
    case 'image':
      return Image;
    case 'video':
      return Video;
    case 'document':
      return FileText;
    default:
      return FileText;
  }
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const MediaForm: React.FC<MediaFormProps> = ({ 
  media, 
  onUpdate, 
  onDelete 
}) => {
  const router = useRouter();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isExtractingMetadata, setIsExtractingMetadata] = useState(false);
  const [isUpdatingAudioMetadata, setIsUpdatingAudioMetadata] = useState(false);
  
  const updateMutation = useUpdateMediaMutation();
  const deleteMutation = useDeleteMediaMutation();

  const form = useForm<MediaFormData>({
    resolver: zodResolver(mediaFormSchema),
    defaultValues: {
      alt_text: media.alt_text || '',
      description: media.description || '',
      transcription: media.transcription || '',
      slug: media.slug || generateSlug(media.original_name),
      cover_image_url: media.cover_image_url || '',
    },
  });

  const audioForm = useForm<AudioMetadataFormData>({
    resolver: zodResolver(audioMetadataSchema),
    defaultValues: {
      audio_title: media.audio_title || '',
      audio_artist: media.audio_artist || '',
      audio_album: media.audio_album || '',
      audio_genre: media.audio_genre || '',
      audio_year: media.audio_year || '',
      audio_track_number: media.audio_track_number || '',
      audio_album_artist: media.audio_album_artist || '',
      audio_composer: media.audio_composer || '',
      audio_comment: media.audio_comment || '',
      update_file: true,
    },
  });

  const handleSubmit = async (data: MediaFormData) => {
    updateMutation.mutate({
      id: media.id,
      alt_text: data.alt_text,
      description: data.description,
      transcription: data.transcription,
      slug: data.slug,
      cover_image_url: data.cover_image_url,
    }, {
      onSuccess: () => {
        onUpdate?.();
      },
      onError: () => {
        toast.error('Failed to update media');
      }
    });
  };

  const handleDelete = async () => {
    deleteMutation.mutate(media.id, {
      onSuccess: () => {
        onDelete?.();
        router.push(`/media/${media.media_type}`);
      }
    });
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = media.url;
    link.download = media.original_name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUploadSuccess = () => {
    // Upload completed successfully - user can manually close the dialog
  };

  const handleRegenerateSlug = () => {
    const newSlug = generateSlug(media.original_name);
    form.setValue('slug', newSlug);
    toast.success('Slug regenerated from filename');
  };

  const handleExtractMetadata = async () => {
    console.log('🔍 Extract metadata clicked for media:', media.id);
    if (media.media_type !== 'audio') {
      console.error('❌ Media is not audio type:', media.media_type);
      toast.error('Metadata extraction is only available for audio files');
      return;
    }

    setIsExtractingMetadata(true);
    try {
      console.log('🚀 Calling extract metadata API...');
      const response = await fetch('/api/media/audio-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'extract',
          mediaId: media.id
        })
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('📥 Extract metadata result:', result);
      
      if (result.success && result.metadata) {
        // Update audio form with extracted metadata
        audioForm.setValue('audio_title', result.metadata.title || '');
        audioForm.setValue('audio_artist', result.metadata.artist || '');
        audioForm.setValue('audio_album', result.metadata.album || '');
        audioForm.setValue('audio_genre', result.metadata.genre || '');
        audioForm.setValue('audio_year', result.metadata.year || '');
        audioForm.setValue('audio_track_number', result.metadata.trackNumber || '');
        audioForm.setValue('audio_album_artist', result.metadata.albumArtist || '');
        audioForm.setValue('audio_composer', result.metadata.composer || '');
        audioForm.setValue('audio_comment', result.metadata.comment || '');
        
        toast.success('Metadata extracted successfully from audio file');
      } else {
        toast.error(result.error || 'Failed to extract metadata from audio file');
      }
    } catch (error) {
      toast.error('Failed to extract metadata from audio file');
    } finally {
      setIsExtractingMetadata(false);
    }
  };

  const handleAudioMetadataSubmit = async (data: AudioMetadataFormData) => {
    console.log('🎵 Audio metadata form submitted:', data);
    console.log('📊 Form data processed:', {
      mediaId: media.id,
      updateFile: data.update_file,
      metadata: {
        title: data.audio_title || undefined,
        artist: data.audio_artist || undefined,
        album: data.audio_album || undefined,
        genre: data.audio_genre || undefined,
        year: data.audio_year || undefined,
        trackNumber: data.audio_track_number || undefined,
        albumArtist: data.audio_album_artist || undefined,
        composer: data.audio_composer || undefined,
        comment: data.audio_comment || undefined,
      }
    });
    
    setIsUpdatingAudioMetadata(true);
    try {
      console.log('🚀 Calling update metadata API...');
      const response = await fetch('/api/media/audio-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          mediaId: media.id,
          metadata: {
            title: data.audio_title || undefined,
            artist: data.audio_artist || undefined,
            album: data.audio_album || undefined,
            genre: data.audio_genre || undefined,
            year: data.audio_year || undefined,
            trackNumber: data.audio_track_number || undefined,
            albumArtist: data.audio_album_artist || undefined,
            composer: data.audio_composer || undefined,
            comment: data.audio_comment || undefined,
          },
          updateFile: data.update_file,
        })
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('📥 Update metadata result:', result);

      if (result.success) {
        console.log('✅ Audio metadata update successful!');
        toast.success(`Audio metadata updated successfully${data.update_file ? ' and written to file' : ' in database'}`);
        onUpdate?.();
      } else {
        console.error('❌ Audio metadata update failed:', result.error);
        toast.error(result.error || 'Failed to update audio metadata');
      }
    } catch (error) {
      console.error('❌ Audio metadata update error:', error);
      toast.error(`Failed to update audio metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUpdatingAudioMetadata(false);
    }
  };

  const renderMediaPreview = () => {
    switch (media.media_type) {
      case 'image':
        return (
          <div className="relative w-full h-64 bg-muted rounded-lg overflow-hidden">
            <NextImage
              src={media.url}
              alt={media.alt_text || media.original_name}
              fill
              className="object-contain"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.style.display = 'none';
              }}
            />
          </div>
        );
      case 'audio':
        return (
          <div className="w-full bg-muted rounded-lg p-6">
            <div className="flex items-center justify-center mb-4">
              {media.cover_image_url ? (
                <div className="relative w-32 h-32 rounded-lg overflow-hidden">
                  <NextImage
                    src={media.cover_image_url}
                    alt={media.alt_text || 'Cover image'}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.style.display = 'none';
                    }}
                  />
                </div>
              ) : (
                <Music className="h-12 w-12 text-muted-foreground" />
              )}
            </div>
            <audio controls className="w-full">
              <source src={media.url} type={media.mime_type} />
              Your browser does not support the audio element.
            </audio>
          </div>
        );
      case 'video':
        return (
          <div className="w-full bg-muted rounded-lg overflow-hidden">
            <video controls className="w-full max-h-64">
              <source src={media.url} type={media.mime_type} />
              Your browser does not support the video element.
            </video>
          </div>
        );
      case 'document':
        return (
          <div className="w-full bg-muted rounded-lg p-6 flex flex-col items-center justify-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground text-center">
              Document preview not available. Click download to view the file.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  const MediaIcon = getMediaIcon(media.media_type);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MediaIcon className="h-8 w-8 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-bold">{media.original_name}</h1>
            <p className="text-sm text-muted-foreground">
              {media.media_type} • {formatFileSize(media.file_size)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => setIsUploadDialogOpen(true)}
            className="gap-2"
          >
            <Upload className="h-3.5 w-3.5" />
            Upload New
          </Button>
          <Button 
            variant="outline" 
            onClick={handleDownload}
            className="gap-2"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2">
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Media</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{media.original_name}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  className="bg-destructive text-destructive-foreground"
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            {renderMediaPreview()}
          </CardContent>
        </Card>

        {/* File Information */}
        <Card>
          <CardHeader>
            <CardTitle>File Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
              <div className="flex items-center gap-2">
                <File className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Original Name</p>
                  <p className="text-sm text-muted-foreground">{media.original_name}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize">
                  {media.media_type}
                </Badge>
                <div>
                  <p className="text-sm font-medium">Type</p>
                  <p className="text-sm text-muted-foreground">{media.mime_type}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Size</p>
                  <p className="text-sm text-muted-foreground">{formatFileSize(media.file_size)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Uploaded</p>
                  <p className="text-sm text-muted-foreground">{media.created_at ? formatDate(media.created_at) : 'Unknown'}</p>
                </div>
              </div>
              
              {media.profiles && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Uploaded by</p>
                    <p className="text-sm text-muted-foreground">
                      {media.profiles.full_name || 'Unknown'}
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Audio Metadata Display */}
            {media.media_type === 'audio' && (
              <>
                <Separator className="my-4" />
                <div className="space-y-3">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Music className="h-4 w-4" />
                    Audio Metadata
                  </h4>
                  <div className="grid gap-3 md:grid-cols-1 lg:grid-cols-2">
                    {media.audio_title && (
                      <div>
                        <p className="text-sm font-medium">Title</p>
                        <p className="text-sm text-muted-foreground">{media.audio_title}</p>
                      </div>
                    )}
                    {media.audio_artist && (
                      <div>
                        <p className="text-sm font-medium">Artist</p>
                        <p className="text-sm text-muted-foreground">{media.audio_artist}</p>
                      </div>
                    )}
                    {media.audio_album && (
                      <div className="flex items-center gap-2">
                        <Disc className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Album</p>
                          <p className="text-sm text-muted-foreground">{media.audio_album}</p>
                        </div>
                      </div>
                    )}
                    {media.audio_genre && (
                      <div>
                        <p className="text-sm font-medium">Genre</p>
                        <p className="text-sm text-muted-foreground">{media.audio_genre}</p>
                      </div>
                    )}
                    {media.audio_year && (
                      <div>
                        <p className="text-sm font-medium">Year</p>
                        <p className="text-sm text-muted-foreground">{media.audio_year}</p>
                      </div>
                    )}
                    {media.audio_track_number && (
                      <div>
                        <p className="text-sm font-medium">Track #</p>
                        <p className="text-sm text-muted-foreground">{media.audio_track_number}</p>
                      </div>
                    )}
                    {media.audio_duration && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Duration</p>
                          <p className="text-sm text-muted-foreground">
                            {Math.floor(media.audio_duration / 60)}:{(media.audio_duration % 60).toString().padStart(2, '0')}
                          </p>
                        </div>
                      </div>
                    )}
                    {media.has_cover_art && (
                      <div>
                        <p className="text-sm font-medium">Embedded Cover Art</p>
                        <p className="text-sm text-muted-foreground">Available in file</p>
                      </div>
                    )}
                    {media.cover_image_url && (
                      <div>
                        <p className="text-sm font-medium">Cover Image</p>
                        <p className="text-sm text-muted-foreground">Custom uploaded</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Edit Media</CardTitle>
          <CardDescription>
            Update the metadata for this media file
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="alt_text">Alt Text</Label>
              <Input
                id="alt_text"
                {...form.register('alt_text')}
                placeholder="Descriptive text for accessibility"
              />
              <p className="text-xs text-muted-foreground">
                Helps screen readers and improves accessibility
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="slug">Slug *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRegenerateSlug}
                  className="gap-1 text-xs"
                >
                  <RefreshCw className="h-3 w-3" />
                  Regenerate
                </Button>
              </div>
              <Input
                id="slug"
                {...form.register('slug')}
                placeholder="url-friendly-identifier"
              />
              <p className="text-xs text-muted-foreground">
                Required URL-friendly identifier using only lowercase letters, numbers, hyphens, and underscores (minimum 3 characters)
              </p>
              {form.formState.errors.slug && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.slug.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...form.register('description')}
                placeholder="Optional description of the media"
                rows={3}
              />
            </div>

            {(media.media_type === 'audio' || media.media_type === 'video') && (
              <div className="space-y-2">
                <Label htmlFor="transcription">Transcription</Label>
                <Textarea
                  id="transcription"
                  {...form.register('transcription')}
                  placeholder="Optional transcription or notes for this audio/video"
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Add transcription text or notes for this audio/video content
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="cover_image">Cover Image</Label>
              <ImageUpload
                value={form.watch('cover_image_url') ? [form.watch('cover_image_url')!] : []}
                disabled={updateMutation.isPending}
                onChange={(url) => form.setValue('cover_image_url', url)}
                onRemove={() => form.setValue('cover_image_url', '')}
              />
              <p className="text-xs text-muted-foreground">
                Upload a cover image for this media file. This is especially useful for audio files.
              </p>
            </div>

            <Button 
              type="submit" 
              disabled={updateMutation.isPending}
              className="w-full gap-2"
            >
              <Save className="h-4 w-4" />
              {updateMutation.isPending ? 'Updating...' : 'Update Media'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Audio Metadata Card */}
      {media.media_type === 'audio' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="h-5 w-5" />
              Audio Metadata
            </CardTitle>
            <CardDescription>
              Edit ID3 tags and metadata for this audio file. Changes can be saved to database only or written to the actual file.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={audioForm.handleSubmit(handleAudioMetadataSubmit)} className="space-y-4">
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleExtractMetadata}
                  disabled={isExtractingMetadata}
                  className="gap-2"
                >
                  {isExtractingMetadata ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Extracting metadata...
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4" />
                      Extract from File
                    </>
                  )}
                </Button>
              </div>
              
              {isExtractingMetadata && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span className="text-sm text-muted-foreground">
                    Reading ID3 tags from audio file...
                  </span>
                </div>
              )}
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="audio_title">Title</Label>
                  <Input
                    id="audio_title"
                    {...audioForm.register('audio_title')}
                    placeholder="Song title"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="audio_artist">Artist</Label>
                  <Input
                    id="audio_artist"
                    {...audioForm.register('audio_artist')}
                    placeholder="Artist name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="audio_album">Album</Label>
                  <Input
                    id="audio_album"
                    {...audioForm.register('audio_album')}
                    placeholder="Album title"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="audio_genre">Genre</Label>
                  <Input
                    id="audio_genre"
                    {...audioForm.register('audio_genre')}
                    placeholder="Music genre"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="audio_year">Year</Label>
                  <Input
                    id="audio_year"
                    {...audioForm.register('audio_year')}
                    placeholder="2024"
                    maxLength={4}
                  />
                  {audioForm.formState.errors.audio_year && (
                    <p className="text-xs text-destructive">
                      {audioForm.formState.errors.audio_year.message}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="audio_track_number">Track Number</Label>
                  <Input
                    id="audio_track_number"
                    {...audioForm.register('audio_track_number')}
                    placeholder="1"
                  />
                  {audioForm.formState.errors.audio_track_number && (
                    <p className="text-xs text-destructive">
                      {audioForm.formState.errors.audio_track_number.message}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="audio_album_artist">Album Artist</Label>
                  <Input
                    id="audio_album_artist"
                    {...audioForm.register('audio_album_artist')}
                    placeholder="Album artist (if different)"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="audio_composer">Composer</Label>
                  <Input
                    id="audio_composer"
                    {...audioForm.register('audio_composer')}
                    placeholder="Composer name"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="audio_comment">Comment</Label>
                <Textarea
                  id="audio_comment"
                  {...audioForm.register('audio_comment')}
                  placeholder="Additional comments or notes"
                  rows={2}
                />
              </div>

              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="update_file"
                    checked={audioForm.watch('update_file')}
                    onCheckedChange={(checked) => audioForm.setValue('update_file', !!checked)}
                  />
                  <Label htmlFor="update_file" className="text-sm">
                    Update file metadata (writes ID3 tags to actual audio file)
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  If unchecked, metadata will only be saved to the database for faster updates. 
                  If checked, ID3 tags will be written to the audio file itself (slower but persistent).
                </p>
              </div>

              <Button 
                type="submit" 
                disabled={isUpdatingAudioMetadata}
                className="w-full gap-2"
              >
                {isUpdatingAudioMetadata ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    {audioForm.watch('update_file') ? 'Writing to file...' : 'Updating database...'}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Update Audio Metadata
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Upload Dialog */}
      <MediaUploadDialog
        isOpen={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
        mediaType={media.media_type as 'audio' | 'image' | 'video' | 'document'}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
};