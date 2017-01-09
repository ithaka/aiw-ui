import { Thumbnail } from './thumbnail.interface';

export interface ImageGroup {
  igId: string;
  name: string;
  count: number;
  thumbnails: Thumbnail[];
  description?: string;
}