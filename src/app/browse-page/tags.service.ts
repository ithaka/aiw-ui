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
   * This is the call that the tag.component uses to get child tags
   * @param tag tag.type.label should contain the value which lets TagsService know which function to call
   * @returns a chanable promise, resolved with an array of tags
   */
  public getChildTags(tag: Tag): Promise<Tag[]> {
    if (tag.type && tag.type.label) {
      let label = tag.type.label;
      return this.getCategories(tag);
    }
  }

  /**
   * Called by initTags
   * @returns a chainable promise, resolved with an array of tags
   */
  private loadCollectionsList(type: string): Promise<Tag[]> {
    return this._assets.getCollectionsList( type )
      .toPromise()
      .then((data) => {
        if (data && data.Collections) {
          let tags: Tag[] = [];
          data.Collections.forEach((collection, index) => {
            let openable = collection.collectionType === 5 || collection.collectionType === 2;
            tags.push(new Tag(collection.collectionid, collection.collectionname, true, null, { label: "collection", folder: true }, openable));
          });
          return tags;
        } else {
          throw new Error("no Collections returned in data");
        }

      });
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

    // logic determines which call to make, to categories or subcategories
    if (collectionId || tag.type.label === "collection") {
      return this._assets.category(collectionId)
        .then((data) => {
          for(let category of data.Categories) {
            let categoryTag = new Tag(category.widgetId, category.title, true, tag, { label: "category", folder: category.isFolder }, category['enableDblClick'] );
            childArr.push(categoryTag);
          }
          return childArr;
        });
    } else if (tag.type.label === "group") {
      // Image Group folders come through with ugly widgetIds
      let tagId = tag.tagId.replace('fldr_','');

      return this._assets.subGroups(tagId)
        .then((data) => {
          for(let group of data) {
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
    } else {
      return this._assets.subcategories(tag.tagId)
        .then((data) => {
          for(let category of data) {
            let categoryTag;
            if (category.grpId) {
              categoryTag = new Tag(category.grpId, category.title, true, tag, { label: "group", folder: false }, category['enableDblClick']);
            } else {
              categoryTag = new Tag(category.widgetId, category.title, true, tag, { label: "subcategory", folder: category.isFolder }, category['enableDblClick']);
            }

            childArr.push(categoryTag);
          }
          return childArr;
        });
    }
  }
}
