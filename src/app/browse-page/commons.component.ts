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
    this._assets.getCollections( this.selectedCollectionId )
      .then((data) => {
        console.log(data.Collections);
        // for (let [index, collection] of data.Collections) {
          // console.log("index:");
          // console.log(index);
          // console.log("collection:");
          // console.log(collection);
        //   this.tags.push(new Tag(index, collection.collectionname, false, "someParentId"));
        // }

        if (data && data.Collections) {
          data.Collections.forEach((collection, index) => {
            this.tags.push(new Tag(index, collection.collectionname, false, "someParentId"));
          });
        }

        // this.collections = data.Collections;
      })
      .catch((err) => {
        console.error(err);
      })
  }

  private loadCommons() {
    this._assets.getCollections("ssc")
      .then((data) => {
        this.collections = data.Collections;
        console.log(this.collections);
      })
      .catch((err) => {
        console.error(err);
      })
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