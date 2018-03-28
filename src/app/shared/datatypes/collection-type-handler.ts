export class CollectionTypeHandler {

  private isPublicAsset: boolean = false  // Collection type of 200
  private isOpenAsset: boolean = false    // Condition of Collection type 5 AND 2
  private typeId : number


  public collectionTypeMap: any = {
    0: { name: '', alt: '' },
    1: { name: "artstor-asset", alt: "Artstor Digital Library" },
    2: { name: "institution-asset", alt: "Institution Collections" },
    3: { name: "personal-asset", alt: "Private Collections" },
    4: { name: "institution-asset", alt: "Institution Collections" },
    5: { name: "artstor-open-asset", alt: "Open Artstor" },
    6: { name: "personal-asset", alt: "Private Collections" },
    200: { name: "ssc-asset", alt: "Public Collection" } // an non-existant collection type used to indicate it's an open, non-artstor asset
  }

 /**
  * Returns collection name and alt text based on Collection Type number
  * - Does so in safe manner, avoiding template errors
  * @param typeId the collection type of the asset
  * @param contributinginstitutionid the id of the institution that uploaded the asset, used to modify the collection type
  *  if the asset was uploaded by Artstor
  */
 public getCollectionType(typeIds: Array<number>, contributinginstitutionid: number): { name: string, alt: string } {
  if (!typeIds) { typeIds = [] }

  this.isPublicAsset = typeIds.indexOf(200) > -1
  this.isOpenAsset = (typeIds.indexOf(2) > -1) && (typeIds.indexOf(5) > -1)

  if (this.isPublicAsset) {
     this.typeId = 200
  }
  else if (this.isOpenAsset) {
    this.typeId = 5
  }
  else {
    this.typeId = typeIds[0]
  }

  // Incase, if the asset has both public (5) and inst. (2) colType, then display the public colType indicator
  
  let typeId = (typeIds.indexOf(2) > -1) && (typeIds.indexOf(5) > -1) ? 5 : typeIds[0]

  // all open collections come with collectiontypes[0] == 5, but we want to show a different icon for an
  //  Open Artstor asset vs an open institutional asset
  if (typeId === 5 && contributinginstitutionid !== 1000) {
    typeId = 200
  }

   let mapResult = this.collectionTypeMap[typeId]
   return mapResult ? mapResult : { name: '', alt: ''}
 }
}