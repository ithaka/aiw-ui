export class CollectionTypeHandler { 
  public collectionTypeMap: any = {
    0: { name: '', alt: '' },
    1: { name: "artstor-asset", alt: "Artstor Digital Library" },
    2: { name: "institution-asset", alt: "Institution Collections" },
    3: { name: "personal-asset", alt: "Private Collections" },
    4: { name: "institution-asset", alt: "Institution Collections" },
    5: { name: "artstor-open-asset", alt: "Open Artstor" },
    6: { name: "personal-asset", alt: "Private Collections" },
    200: { name: "ssc-asset", alt: "Open Collection" } // an non-existant collection type used to indicate it's an open, non-artstor asset
  }

 /**
  * Returns collection name and alt text based on Collection Type number
  * - Does so in safe manner, avoiding template errors
  */
 public getCollectionType(typeId: number): { name: string, alt: string } {
   let mapResult = this.collectionTypeMap[typeId]
   return mapResult ? mapResult : { name: '', alt: ''}
 }
}