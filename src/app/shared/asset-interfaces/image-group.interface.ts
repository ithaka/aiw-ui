import { Thumbnail } from './thumbnail.interface';

export interface ImageGroup {
  id: string;
  name: string;
  count: number;
  thumbnails: Thumbnail[];
  description?: string;
}