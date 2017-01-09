import { Thumbnail } from './thumbnail.interface';

export interface ImageGroup {
  igId: string;
  igName: string;
  count: number;
  thumbnails: Thumbnail[];
  description?: string;
}