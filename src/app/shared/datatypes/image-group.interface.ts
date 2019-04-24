import { Thumbnail } from './thumbnail.interface'

export interface ImageGroup {
  id?: string; // new ig property
  name?: string; // new ig property
  access?: {
    entity_type: number,
    entity_identifier: string,
    access_type: number
  }[],
  owner_name?: string,
  owner_id?: string,
  public?: boolean,
  igId?: string,
  count?: number,
  total?: number,
  thumbnails?: Thumbnail[],
  items?: any[],
  description?: string,
  // description?: ImageGroupDescription, // this does not naturally come with image groups, but sometimes we attach it
  // igDownloadInfo?: IgDownloadInfo, // we also attach this to image groups when we have it
  sequence_number?: number,
  tags?: string[],
  creation_date?: string,
  update_date?: string
}

export interface GroupItem {
  id: string,
  zoom?: ImageZoomParams
}

/**
 * IIIF Zoom parameters as passed by Group service and URL params
 */
export interface ImageZoomParams {
  viewerX?: number
  viewerY?: number
  pointWidth?: number
  pointHeight?: number
  index?: number
}

export interface ImageGroupDescription {
  igId: string;
  igName: string;
  igNotes: string;
  count: number;
  isFldrOwner: boolean;
}

/**
 * Group Service requests and responses
 */

  // Group list response interface
  export interface GroupList {
    success: boolean,
    total: number,
    groups: any[],
    tags: any[]
  }
