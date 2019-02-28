import { Injectable } from '@angular/core';

import { AssetService } from './../shared/assets.service';
import { Tag } from './tag/tag.class';

@Injectable()
export class TagsService {

  constructor(private _assets: AssetService) {}

  /**
   * Should be first call to get tags that a page makes
   * @param type Can be values: "commons", "ssc", "institution", "private"
   * @returns a chainable promise resolved with an array of tags
   */
  public initTags(switchObj: any): Promise<Tag[]> {
    if (switchObj.type === 'commons') {
      return this.loadCollectionsList('ssc');
    } else if (switchObj.type === 'institution') {
      return this.loadCollectionsList('institution');
    }
  }

  /**
   * Called by initTags
   * @returns a chainable promise, resolved with an array of tags
   */
  private loadCollectionsList(type: string): Promise<Tag[]> {
    let colTypeValue: number
    if (type === 'institution') {
      // Institutional Collections = Type #2
      colTypeValue = 2
    } else if (type === 'ssc') {
      // Public Collections = Type #5
      colTypeValue = 5
    }

    if (colTypeValue) {
      // Use SOLR to load collection list by faceting on collectiontypenameid and filtering on colTypeValue
      return this._assets.categoryByFacet('collectiontypenameid', colTypeValue)
        .then((facetData) => {
          if (facetData) {
            // Filter for the required collectionType
            facetData = facetData.filter((facet) => {
              return parseInt(facet.name.split('|')[0]) === colTypeValue
            })

            let tags: Tag[] = []

            // Extract required facets data
            let facetsArray: any[] = []
            facetData.forEach((facet, index) => {
              let facetSplitArray = facet.name.split('|')
              facetsArray.push({ name: facetSplitArray[1], id: facetSplitArray[2] })
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
              tags.push(new Tag(facet.id, facet.name, true, null, { label: 'collection', folder: true }, true))
            })

            return tags
          }
        })
      }
  }
}
