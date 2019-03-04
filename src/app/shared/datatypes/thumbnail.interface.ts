// I've seeded the interface with a few parameters that I know to exist on (most) thumbnails
//  if you need more, you can add them to the interface

export interface Thumbnail {
  name?: string
  agent?: string
  date?: string
  tombstone?: string[]
  clustered?: number
  partofcluster?: boolean
  frequentlygroupedwith?: string[]
  objectId?: string
  objectTypeId?: number
  artstorid?: string
  collectionId: string
  collectionType: number
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

// export interface SearchThumbnail {
//   artstorid: string
//   collections: string[]
//   collectiontypenameid: string[]
//   collectiontypes: number[]
// }
