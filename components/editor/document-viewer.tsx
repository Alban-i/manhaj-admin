'use client';

import { FileText, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface DocumentViewerProps {
  src: string;
  title: string;
  fileType: string;
  fileSize?: number;
}

export function DocumentViewer({
  src,
  title,
  fileType,
  fileSize,
}: DocumentViewerProps) {
  const handleOpen = () => {
    window.open(src, '_blank', 'noopener,noreferrer');
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = src;
    link.download = title;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFileIconColor = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('pdf')) return 'text-red-600';
    if (lowerType.includes('doc')) return 'text-blue-600';
    if (lowerType.includes('xls')) return 'text-green-600';
    if (lowerType.includes('ppt')) return 'text-orange-600';
    return 'text-muted-foreground';
  };

  const formatFileSize = (size: number) => {
    if (!size) return '';

    const units = ['B', 'KB', 'MB', 'GB'];
    let unitIndex = 0;
    let fileSize = size;

    while (fileSize >= 1024 && unitIndex < units.length - 1) {
      fileSize /= 1024;
      unitIndex++;
    }

    return `${fileSize.toFixed(1)} ${units[unitIndex]}`;
  };

  return (
    <div className="flex justify-center">
      <div className="p-4 bg-card rounded-md max-w-lg w-full">
        <div className="flex flex-col gap-3">
          <div className="text-center">
            <span className="text-sm text-muted-foreground">
              {title.replace(/\.[^/.]+$/, '')}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <FileText className={`w-8 h-8 ${getFileIconColor(fileType)}`} />
            </div>
            <div className="flex-grow min-w-0">
              <p className="text-xs text-muted-foreground">
                {fileType.toUpperCase()}
                {fileSize && ` • ${formatFileSize(fileSize)}`}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleOpen}
                size="sm"
                variant="outline"
                className="flex-shrink-0"
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                Ouvrir
              </Button>
              <Button
                onClick={handleDownload}
                size="sm"
                variant="outline"
                className="flex-shrink-0"
              >
                <Download className="w-4 h-4 mr-1" />
                Télécharger
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
