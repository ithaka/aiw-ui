import { CollectionTypeInfo } from "./collection-type-handler";

// I've seeded the interface with a few parameters that I know to exist on (most) thumbnails
//  if you need more, you can add them to the interface
export class Thumbnail {
  name?: string
  agent?: string
  date?: string
  img?: string // Set locally in our app to be the image displayed
  tombstone?: string[]
  clustered?: number
  partofcluster?: boolean
  frequentlygroupedwith?: string[]
  objectId?: string
  objectTypeId?: number
  artstorid?: string
  collectionId: string
  collectionType: number
  compound_media_json?: {
    types?: string[],
    objects?: any[]
  }
  cfObjCount: number // number of associated assets
  cfObjectId: string // haven't seen any for which this is different than objectId
  count: number
  largeImageUrl: string
  publicAccess: boolean
  iap?: number
  status: string
  media: {
    adlObjectType: number
    thumbnailSizeOnePath: string
    format?: string
  }
  compound_media: any
  thumbnailImgUrl: string
  thumbnail1: any
  thumbnail2: any
  thumbnail3: any
  thumbnail4: any
  navigationCommands: any[] // added when thumbnail is constructed, allows proper navigation from search
  zoom?: { // optional zoom params to be available only for detail view thumbnails
    index: number
    pointHeight: number
    pointWidth: number
    viewerX: number
    viewerY: number
  }
}


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
  // In template
  // tombstone: any
  name: string
  agent: string
  date: string
  // thumbnail1?: string
  // thumbnail2?: string
  // thumbnail3?: string
  // thumbnail4?: string
  // cfObjectId?: string
  // clustered?: any
  iap?: any
  partofcluster?: any
  frequentlygroupedwith?: any
  zoom?: any
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
}