import { CollectionTypeInfo } from "./collection-type-handler";
import { ImageZoomParams } from "./image-group.interface";

/**
 * AssetThumbnail is the type we use to represent thumbnails on the front-end
 * - Services returning thumbnails/results should map to this type
 */
export class AssetThumbnail {
  id: string
  objectTypeId: number
  img: string
  collectionTypeInfo: CollectionTypeInfo
  ssid?: string
  size?: number
  thumbnailAlt?: string
  status?: string // 'not-available', 'available'
  isDetailView?: boolean
  isMultiView?: boolean
  isDowngradedMedia?: boolean
  multiviewItemCount?: number
  media?: any
  thumbnailImgUrl?: string
  thumbnailUrls?: string[]
  compound_media?: any
  compound_media_json?: {
    types?: string[],
    objects?: any[]
  }
  doi ?: string
  // "Tombstone" Data
  name: string
  agent: string
  date: string
  // In template
  iap: boolean
  partofcluster: boolean
  clusterid?: string
  frequentlygroupedwith: string[]
  zoom?: ImageZoomParams
}

/**
 * Raw thumbnail/asset object returned by:
 * -> See RawSearchAsset in asset-search.service.ts
 */

/**
 * Raw thumbnail/asset object returned by:
 * Item/Groups Service (Team Binder)
 */
export interface RawItemAsset {
  objectId?: string
  compoundmediaCount?: number
  downloadSize?: string
  tombstone?: string[]
  collections?: string[]
  thumbnailImgUrl?: string
  media?: any
  iap?: boolean
  status: string // "available"
  objectTypeId?: number
  collectiontypes?: number[]
  contributinginstitutionid?: number
  clustered?: number
  largeImgUrl?: string
  cfObjectId?: string
  // We attach zoom from the group service
  zoom?: ImageZoomParams
}