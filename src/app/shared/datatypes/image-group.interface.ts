import { Thumbnail } from './thumbnail.interface';

export interface ImageGroup {
  igId: string;
  igName: string;
  count: number;
  thumbnails: Thumbnail[];
  description?: ImageGroupDescription; // this does not naturally come with image groups, but sometimes we attach it
}

export interface ImageGroupDescription {
  igId: string;
  igName: string;
  igNotes: string;
  count: number;
}