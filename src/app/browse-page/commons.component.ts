import { Component, OnInit } from '@angular/core';

import { AssetService } from './../shared/assets.service';
import { Tag } from './tag.class';

@Component({
  selector: 'ang-browse-commons',
  templateUrl: 'commons.component.html',
  styleUrls: [ './browse-page.component.scss' ]
})
export class BrowseCommonsComponent implements OnInit {
  private collections: any[];
  private tags: Tag[] = [];
  private selectedCollectionId: string;
  private categories;

  constructor(private _assets: AssetService) { }


  /** Initializes array of Tags based on collections */
  ngOnInit() {
    this._assets.getCollections( 'ssc' )
      .then((data) => {

        if (data && data.Collections) {
          console.log(data);
          data.Collections.forEach((collection, index) => {
            // let isFolder = collection.isFolder;
            this.tags.push(new Tag(
                                    collection.collectionid,
                                    collection.collectionname,
                                    true,
                                    null, 
                                    { label: "collection", folder: true }, 
                                    this.toggleFolder,
                                    { _assets: this._assets }));
          });
        }

        // this.collections = data.Collections;
      })
      .catch((err) => {
        console.error(err);
      });
  }

    private toggleFolder(tag: Tag, helper: any): Promise<Tag[]> {
      console.log("passed funciton got called!");
      console.log(tag);

      console.log(this.toggleFolder);

    // has the tag been opened before?
    if (!tag.touched) {
      //the tag doesn't have any children, so we run a call to get any
      let childArr: Tag[] = [];
      console.log("we're about to search stuff!");
      
      // logic determines which call to make, to categories or subcategories
      if (tag.type.label === "collection") {
        return helper._assets.category(tag.tagId)
          .then((data) => {
            console.log(data);
            for(let category of data.Categories) {
              let categoryTag = new Tag(category.widgetId, category.title, true, tag, { label: "category", folder: category.isFolder }, this.toggleFolder, helper);
              console.log(categoryTag);
              childArr.push(categoryTag);
            }
            return childArr;
          });
          // .catch((err) => {
          //   console.error(err);
          // });
      } else if (tag.type.label === "category") {
        return helper._assets.subcategories(tag.tagId)
          .then((data) => {
            for(let category of data) {
              let categoryTag = new Tag(category.widgetId, category.title, true, tag, { label: "subcategory", folder: category.isFolder }, this.toggleFolder, helper);
              childArr.push(categoryTag);
            }
            return childArr;
          });
          // .catch((err) => {
          //   console.error(err);
          // });
      }

    } else {
      return;
    }
  }
}