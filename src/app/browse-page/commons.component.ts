import { Component, OnInit } from '@angular/core';

import { AssetService } from './../shared/assets.service';
import { TagsService } from './tags.service';
import { Tag } from './tag/tag.class';
import { TitleService } from '../shared/title.service';

@Component({
  selector: 'ang-browse-commons',
  providers: [],
  templateUrl: 'commons.component.pug',
  styleUrls: [ './browse-page.component.scss' ]
})
export class BrowseCommonsComponent implements OnInit {
  private tags: Tag[] = [];
  private loading: boolean = true;

  constructor(
    private _assets: AssetService,
    private _tags: TagsService,
    private _title: TitleService
  ) { }


  /** Initializes array of Tags based on collections */
  ngOnInit() {
    // Set page title
    this._title.setSubtitle("Browse Open Collections")

    this._tags.initTags({type: "commons"})
      .then((tags) => {
        this.tags = tags;
        this.loading = false;
      })
      .catch((err) => {
        console.error(err);
        this.loading = false;
      });
  } // OnInit
}
