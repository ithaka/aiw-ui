export class CollectionTypeHandler { 
  public static collectionTypeMap: {
    [key: string]: CollectionTypeInfo
  } = {
    0: { name: '', alt: '', badgeText: '' },
    1: { name: "artstor-asset", alt: "The Artstor Digital Library is accessible to all participating institutions", badgeText: 'Artstor' },
    2: { name: "institution-asset", alt: "Available to your institution only", badgeText: 'Institutional' },
    3: { name: "personal-asset", alt: "Available only to the owner unless shared in a group", badgeText: 'Personal' },
    4: { name: "institution-asset", alt: "Available to your institution only", badgeText: 'Institutional' },
    5: { name: "artstor-open-asset", alt: "Available to everyone", badgeText: 'Open Artstor' },
    6: { name: "personal-asset", alt: "Available only to the owner unless shared in a group", badgeText: 'Personal' },
    200: { name: "ssc-asset", alt: "Available to everyone", badgeText: 'Public' } // an non-existant collection type used to indicate it's an open, non-artstor asset
  }

 /**
  * Returns collection name and alt text based on Collection Type number
  * - Does so in safe manner, avoiding template errors
  * @param typeId the collection type of the asset
  * @param contributinginstitutionid the id of the institution that uploaded the asset, used to modify the collection type
  *  if the asset was uploaded by Artstor
  */
 public static getCollectionType(typeIds: Array<number>, contributinginstitutionid: number): CollectionTypeInfo {
  if (!typeIds) { typeIds = [] }
  // Incase, if the asset has both public (5) and inst. (2) colType, then display the public colType indicator
  let typeId = (typeIds.indexOf(2) > -1) && (typeIds.indexOf(5) > -1) ? 5 : typeIds[0]

  // all open collections come with collectiontypes[0] == 5, but we want to show a different icon for an
  //  Open Artstor asset vs an open institutional asset
  if (typeId === 5 &&  contributinginstitutionid !== 1000) {
    typeId = 200
  }

   let mapResult = this.collectionTypeMap[typeId]
   return mapResult ? mapResult : this.collectionTypeMap[0]
 }
}

export interface CollectionTypeInfo {
  name: string
  alt: string
  badgeText: string
}