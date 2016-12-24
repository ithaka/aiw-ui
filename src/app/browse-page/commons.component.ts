import { Component, OnInit } from '@angular/core';

import { AssetService } from './../shared/assets.service';
import { TagsService } from './tags.service';
import { Tag } from './tag/tag.class';

@Component({
  selector: 'ang-browse-commons',
  providers: [],
  templateUrl: 'commons.component.html',
  styleUrls: [ './browse-page.component.scss' ]
})
export class BrowseCommonsComponent implements OnInit {
  private tags: Tag[] = [];

  constructor(
    private _assets: AssetService,
    private _tags: TagsService
  ) { }


  /** Initializes array of Tags based on collections */
  ngOnInit() {
    // console.log(this._tags);
    this._tags.initTags("commons")
      .then((tags) => {
        console.log(tags);
        this.tags = tags;
      })
      .catch((err) => {
        console.error(err);
      });
  }
}