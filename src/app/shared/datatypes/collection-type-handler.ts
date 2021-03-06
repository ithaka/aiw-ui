// import { CollectionData } from '../../asset-page/asset';

export class CollectionTypeHandler {
  public static collectionTypeMap: {
    [key: string]: CollectionTypeInfo
  } = {
    0: { name: '', alt: '', badgeText: '', type: 0 },
    1: { name: 'artstor-asset', alt: 'The Artstor Digital Library is accessible to all participating institutions', badgeText: 'Artstor', type: 1 },
    2: { name: 'institution-asset', alt: 'Available to your institution only', badgeText: 'Institutional', type: 2 },
    3: { name: 'personal-asset', alt: 'Available only to the owner unless shared in a group', badgeText: 'Personal', type: 3 },
    4: { name: 'institution-asset', alt: 'Available to your institution only', badgeText: 'Institutional', type: 4 },
    5: { name: 'ssc-asset', alt: 'Available to everyone', badgeText: 'Public', type: 5 },
    6: { name: 'personal-asset', alt: 'Available only to the owner unless shared in a group', badgeText: 'Personal', type: 6 },
    7: { name: 'open-artstor', alt: 'Available to everyone', badgeText: 'Open Artstor', type: 7 }
  }

  /**
   * An array indicating the priority of the collection type to display - higher index indicates higher priority
   */
  private static collectionTypePriorityArray: number[] = [
    6,
    3,
    4,
    2,
    1,
    5,
    7
  ]

 /**
  * Returns collection name and alt text based on Collection Type number
  * - Does so in safe manner, avoiding template errors
  * @param typeId the collection type of the asset
  * @param contributinginstitutionid the id of the institution that uploaded the asset, used to modify the collection type
  *  if the asset was uploaded by Artstor
  */
 public static getCollectionType(typeIds: number[], contributinginstitutionid: number): CollectionTypeInfo {
  if (!typeIds) { typeIds = [] }
  let typeId: number

  // find which type has highest index in collectionTypePriorityArray and assign that as type
  typeIds.forEach((type) => {

    // Display Open Artstor badge for type 5 published by institution 1000, badge # 7
    if (type === 5 && contributinginstitutionid === 1000) {
      type = 7
    }

    let currentPriority: number = this.collectionTypePriorityArray.indexOf(typeId)
    let nextPriority: number = this.collectionTypePriorityArray.indexOf(type)

    if (nextPriority > currentPriority) {
      typeId = type
    }
  })

  let mapResult = this.collectionTypeMap[typeId]
  return mapResult ? mapResult : this.collectionTypeMap[0]
 }

}

export interface CollectionTypeInfo {
  name: string
  alt: string
  badgeText: string
  type: number
}

/**
 * CollectionLink type
 * Used in AssetPage component array of collectionLinks
 */
export interface CollectionLink {
  displayName: string
  route: any
}
