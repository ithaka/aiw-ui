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

      this._assets.category(tag.tagId)
        .then((data) => {
          console.log(data);
          for(let category of data.Categories) {
            let categoryTag = new Tag(category.widgetId, category.title, false, tag.tagId, "category");
            childArr.push(categoryTag);
            // this.tags.push(categoryTag);
            this.tags.splice(this.tags.indexOf(tag) + 1, 0, categoryTag);
          }
          tag.setChildren(childArr);
        })
        .catch((err) => {
          console.error(err);
        });
    } else {
      //the tag has children, so we just set their displays differently
      console.log("it's got children!");
      for (let childTag of tag.getChildren()) {
        childTag.toggleDisplay();
      }
    }

  }

  // loadCategory(){
  //   this._assets.category( this.selectedCollectionId )
  //     .then((data) => {
  //         // this.currentBrowseRes = res;
  //         this.categories = data.Categories;
  //         console.log(this.categories);

  //         // should be abstracted to the _assets.category method b/c it is a data operation?
  //         for (let cat of this.categories) { // Add default depth of 0 to every top level node
  //             cat.depth = 0;
  //         }
  //     });
      // .catch(function(err) {
      //     console.log('Unable to load category results.');
      // });

  
}