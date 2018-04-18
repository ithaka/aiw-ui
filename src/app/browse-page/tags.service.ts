import { Injectable } from '@angular/core';

import { AssetService } from './../shared/assets.service';
import { Tag } from './tag/tag.class';

@Injectable()
export class TagsService {

  constructor(private _assets: AssetService) {
  }

  /**
   * Should be first call to get tags that a page makes
   * @param type Can be values: "commons", and nothing else yet
   * @returns a chainable promise resolved with an array of tags
   */
  public initTags(switchObj: any): Promise<Tag[]> {
    if (switchObj.type === "commons") {
      return this.loadCollectionsList('ssc');
    } else if (switchObj.type === "institution") {
      return this.loadCollectionsList('institution');
    } else if (switchObj.type === "library" && switchObj.collectionId) {
      return this.getCategories(null, switchObj.collectionId);
    }
  }

  /**
   * Called by initTags
   * @returns a chainable promise, resolved with an array of tags
   */
  private loadCollectionsList(type: string): Promise<Tag[]> {
    let colTypeValue: number
    if(type === 'institution'){
      // Institutional Collections = Type #2
      colTypeValue = 2
    } else if(type === 'ssc'){
      // Public Collections = Type #5
      colTypeValue = 5
    }

    if(colTypeValue){
      // Use SOLR to load collection list by faceting on collectiontypenameid and filtering on colTypeValue
      return this._assets.categoryByFacet('collectiontypenameid', colTypeValue)
        .then( (facetData) => {
          if(facetData){
            // Filter for the required collectionType
            facetData = facetData.filter((facet) => {
              return parseInt(facet.name.split('|')[0]) === colTypeValue
            })

            let tags: Tag[] = []
            
            // Extract required facets data
            let facetsArray: any[] = []
            facetData.forEach((facet, index) => {
              let facetSplitArray = facet.name.split('|')
              facetsArray.push({ name: facetSplitArray[1], id: facetSplitArray[1] })
            })

            // Sorts facets alphabetically on name
            facetsArray = facetsArray.sort(
              (facet1, facet2) => {
                let name1 = facet1.name.toUpperCase();
                let name2 = facet2.name.toUpperCase();
                return (name1 < name2) ? -1 : (name1 > name2) ? 1 : 0;
              }
            )

            // Create tags
            facetsArray.forEach((facet, index) => {
              tags.push(new Tag(facet.id, facet.name, true, null, { label: "collection", folder: true }, true))
            })

            return tags
          }
        })
    } else{
      // Deprecated collection list call as fallback
      return this._assets.getCollectionsList( type )
        .toPromise()
        .then((data) => {
          if (data && data['Collections']) {
            let tags: Tag[] = []
            data['Collections'].forEach((collection, index) => {
              let openable = collection.collectionType === 5 || collection.collectionType === 2
              tags.push(new Tag(collection.collectionid, collection.collectionname, true, null, { label: "collection", folder: true }, openable))
            });
            return tags
          } else {
            throw new Error("no Collections returned in data")
          }

        })
    }
  }

  /**
   * Called by both getChildTags and initTags
   * @returns a chainable promise, resolved with an array of tags
   */
  private getCategories(tag?: Tag, collectionId?: string): Promise<Tag[]> {
    //the tag doesn't have any children, so we run a call to get any
    let childArr: Tag[] = [];
    if (tag && tag.type && tag.type.label === "collection") {
      collectionId = tag.tagId;
    }
    
    if (tag.type.label === "group") {
      // Image Group folders come through with ugly widgetIds
      let tagId = tag.tagId.replace('fldr_','');

      return this._assets.subGroups(tagId)
        .then((data) => {
          let arr: any = data;
          for(let group of arr) {
            let groupTag = new Tag(group.widgetId.replace('fldr_',''), group.title, true, tag, { label: "group", folder: group.isFolder }, true);
            // Is folder property cleaning: comes through as string
            group.isFolder = (group.isFolder === 'true') ?  true : false;
            // Set description if it exists
            if (group.igDesc) {
              groupTag.setDescription(group.igDesc);
            }
            childArr.push(groupTag);
          }
          return childArr;
        });
    }
  }
}
