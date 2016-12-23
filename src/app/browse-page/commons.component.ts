import { Component, OnInit } from '@angular/core';

import { AssetService } from './../shared/assets.service';
import { Tag } from './tag';

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



  ngOnInit() {
    this._assets.getCollections( 'ssc' )
      .then((data) => {
        console.log(data.Collections);

        if (data && data.Collections) {
          data.Collections.forEach((collection, index) => {
            this.tags.push(new Tag(collection.collectionid, collection.collectionname, false, null, "collection"));
          });
        }

        // this.collections = data.Collections;
      })
      .catch((err) => {
        console.error(err);
      });
  }

  private loadCommons() {
    this._assets.getCollections("ssc")
      .then((data) => {
        this.collections = data.Collections;
        console.log(this.collections);
      })
      .catch((err) => {
        console.error(err);
      });
  }

  private toggleFolder(tag: Tag) {
    console.log(tag.tagId + " was clicked!");

    //if the tag has been expanded but has no children and gets clicked again, this still fires
    //  is there a way to prevent that?
    //  it should have children if it's been clicked
    if (!tag.getChildren()) {
      //the tag doesn't have any children, so we run a call to get any
      let childArr: Tag[] = [];
      
      // logic determines which call to make, to categories or subcategories
      if (tag.type === "collection") {
        this._assets.category(tag.tagId)
          .then((data) => {
            console.log(data);
            for(let category of data.Categories) {
              let categoryTag = new Tag(category.widgetId, category.title, false, tag.tagId, "category");
              childArr.push(categoryTag);
              this.tags.splice(this.tags.indexOf(tag) + 1, 0, categoryTag);
            }
            tag.setChildren(childArr);
          })
          .catch((err) => {
            console.error(err);
          });
      } else if (tag.type === "category") {
        this._assets.subcategories(tag.tagId)
          .then((data) => {
            console.log(data);
            for(let category of data) {
              console.log(category);
              let categoryTag = new Tag(category.widgetId, category.title, false, tag.tagId, "subcategory");
              childArr.push(categoryTag);
              this.tags.splice(this.tags.indexOf(tag) + 1, 0, categoryTag);
            }
            // tag.setChildren(childArr);
          })
          .catch((err) => {
            console.error(err);
          });
      }

    } else {
      //the tag has children, so we just set their displays differently
      for (let childTag of tag.getChildren()) {
        childTag.toggleDisplay();
      }
    }

  }
  
}