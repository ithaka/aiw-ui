import { CollectionTypeInfo } from "./collection-type-handler";
import { ImageZoomParams } from "./image-group.interface";

/**
 * AssetThumbnail is the type we use to represent thumbnails on the front-end
 * - Services returning thumbnails/results should map to this type
 */
export class AssetThumbnail {
  objectId?: string
  objectTypeId: number
  img: string
  collectionTypeInfo: CollectionTypeInfo
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
  artstorid ?: string
  // "Tombstone" Data
  name: string
  agent: string
  date: string
  // In template
  iap?: any
  partofcluster?: any
  frequentlygroupedwith?: any
  zoom?: ImageZoomParams
}

// export interface SearchServiceThumbnail {
  // id	664db63b-d45e-3ad3-aad2-a3828dc819f2
  // doi	10.2307/artstor.12240886
  // debug_fields	{}
  // agent	Pollock
  // artdiscoverysite	[]
  // artstorid	SCHLES_130736960
  // artadditionalfields	null
  // clusterid	null
  // categoryid	1034302695
  // collectiontypes	[…]
  // collectiontypenameid	[…]
  // collections	[…]
  // compound_media	null
  // contributinginstitutionid	1000
  // date	n.d. (circa 1850-1880)
  // donatinginstitutionids	[]
  // frequentlygroupedwith	[]
  // iap	false
  // media	{"format":null,"thumbnailSizeOnePath":"imgstor/size1/schles/d0001/sch_007133010551_img0068.jpg","width":2048,"sizeInBytes":null,"downloadSize":1024,"type":null,"icc_profile_location":null,"thumbnailSizeZeroPath":"imgstor/size0/schles/d0001/sch_007133010551_img0068.jpg","filename":"SCHLES_130736960","lps":"schles/d0001","iiif":null,"storId":null,"adlObjectType":10,"height":3072}
  // name	Unidentified portraits of Boit family women.
  // partofcluster	false
  // tokens	[…]
  // type	art
  // updatedon	2017-12-14T23:12:25Z
  // workid	null
  // year	1865
  // yearbegin	1850
  // yearend	1880
  // additional_Fields	{}
// }

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