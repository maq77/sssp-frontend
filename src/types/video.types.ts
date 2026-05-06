export interface VideoContent {
  title: string;
  description: string;
  videoPlaceholder?: string;

  embedUrl?: string;
  mp4Url?: string;
  posterUrl?: string;

  previewStartSeconds?: number;
  previewSeconds?: number;
}
