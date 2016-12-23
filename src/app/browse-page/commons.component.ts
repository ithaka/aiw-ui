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



  ngOnInit() {
    this._assets.getCollections( 'ssc' )
      .then((data) => {

        if (data && data.Collections) {
          console.log(data);
          data.Collections.forEach((collection, index) => {
            // let isFolder = collection.isFolder;
            this.tags.push(new Tag(collection.collectionid, collection.collectionname, true, null, { label: "collection", folder: true }));
          });
        }

        // this.collections = data.Collections;
      })
      .catch((err) => {
        console.error(err);
      });
  }
}