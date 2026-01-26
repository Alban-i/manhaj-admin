import { getMedia } from '@/actions/media/get-media';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const dynamic = 'force-dynamic';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Image, 
  Music, 
  Video, 
  FileText, 
  Upload, 
  TrendingUp, 
  HardDrive,
  Calendar
} from 'lucide-react';
import Link from 'next/link';

// Helper function to map database media_type to route paths
const getMediaRoutePath = (mediaType: string): string => {
  const mediaTypeMap: Record<string, string> = {
    audio: 'audio',
    image: 'images', 
    video: 'videos',
    document: 'documents'
  };
  return mediaTypeMap[mediaType] || mediaType;
};

export default async function MediaDashboard() {
  const allMedia = await getMedia();

  const mediaStats = {
    total: allMedia.count,
    audio: allMedia.data.filter(m => m.media_type === 'audio').length,
    images: allMedia.data.filter(m => m.media_type === 'image').length,
    videos: allMedia.data.filter(m => m.media_type === 'video').length,
    documents: allMedia.data.filter(m => m.media_type === 'document').length,
    totalSize: allMedia.data.reduce((acc, item) => acc + item.file_size, 0),
    recentCount: allMedia.data.filter(item => {
      if (!item.created_at) return false;
      const uploadDate = new Date(item.created_at);
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return uploadDate > oneWeekAgo;
    }).length,
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const recentMedia = allMedia.data
    .filter(item => item.created_at !== null)
    .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
    .slice(0, 6);

  const mediaTypes = [
    {
      title: 'Audio Files',
      icon: Music,
      count: mediaStats.audio,
      href: '/media/audio',
      color: 'bg-blue-500',
    },
    {
      title: 'Images',
      icon: Image,
      count: mediaStats.images,
      href: '/media/images',
      color: 'bg-green-500',
    },
    {
      title: 'Videos',
      icon: Video,
      count: mediaStats.videos,
      href: '/media/videos',
      color: 'bg-purple-500',
    },
    {
      title: 'Documents',
      icon: FileText,
      count: mediaStats.documents,
      href: '/media/documents',
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Media Library</h1>
          <p className="text-muted-foreground">
            Manage all your media files in one place
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/media/audio">
            <Upload className="h-4 w-4" />
            Upload Media
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Files</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mediaStats.total}</div>
            <p className="text-xs text-muted-foreground">
              All media files
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatFileSize(mediaStats.totalSize)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total file size
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Uploads</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mediaStats.recentCount}</div>
            <p className="text-xs text-muted-foreground">
              Last 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Active</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mediaStats.audio >= mediaStats.images ? 'Audio' : 'Images'}
            </div>
            <p className="text-xs text-muted-foreground">
              Most uploaded type
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Media Type Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {mediaTypes.map((type) => (
          <Card key={type.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${type.color}`}>
                  <type.icon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">{type.title}</CardTitle>
                  <CardDescription>{type.count} files</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href={type.href}>
                  View All
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Media */}
      <Card>
        <CardHeader>
          <CardTitle>Recently Uploaded</CardTitle>
          <CardDescription>
            Your latest media files
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentMedia.length === 0 ? (
            <div className="text-center py-6">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No media files yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentMedia.map((media) => {
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

                const MediaIcon = getMediaIcon(media.media_type);

                return (
                  <div key={media.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <MediaIcon className="h-8 w-8 text-muted-foreground" />
                    <div className="flex-1">
                      <h4 className="font-medium">{media.original_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(media.file_size)} • {media.created_at ? new Date(media.created_at).toLocaleDateString() : 'Unknown date'}
                      </p>
                    </div>
                    <Badge variant="secondary" className="capitalize">
                      {media.media_type}
                    </Badge>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/media/${getMediaRoutePath(media.media_type)}/${media.slug}`}>
                        View
                      </Link>
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}