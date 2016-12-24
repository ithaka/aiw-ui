import { Injectable } from '@angular/core';

import { AssetService } from './../shared/assets.service';
import { Tag } from './tag.class';

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
    console.log(switchObj);
    if (switchObj.type === "commons") {
      return this.getCollections();
    } else if (switchObj.type === "library" && switchObj.collectionId) {
      console.log("library it is!");
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
      if (label === "collection" || label === "category") {
        return this.getCategories(tag);
      }
    }
  }

  /**
   * Called by initTags
   * @returns a chainable promise, resolved with an array of tags
   */
  private getCollections(): Promise<Tag[]> {
    return this._assets.getCollections( 'ssc' )
      .then((data) => {
        if (data && data.Collections) {
          let tags: Tag[] = [];
          data.Collections.forEach((collection, index) => {
            tags.push(new Tag(collection.collectionid, collection.collectionname, true, null, { label: "collection", folder: true }));
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
      console.log(tag);
      collectionId = tag.tagId;
    }
    
    // logic determines which call to make, to categories or subcategories
    if (collectionId || tag.type.label === "collection") {
      return this._assets.category(collectionId)
        .then((data) => {
          for(let category of data.Categories) {
            let categoryTag = new Tag(category.widgetId, category.title, true, tag, { label: "category", folder: category.isFolder });
            childArr.push(categoryTag);
          }
          return childArr;
        });
    } else if (tag.type.label === "category") {
      return this._assets.subcategories(tag.tagId)
        .then((data) => {
          console.log(data);
          for(let category of data) {
            let categoryTag = new Tag(category.widgetId, category.title, true, tag, { label: "subcategory", folder: category.isFolder });
            childArr.push(categoryTag);
          }
          return childArr;
        });
    }
  }
}