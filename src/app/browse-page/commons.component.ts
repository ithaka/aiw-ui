import { Component, OnInit } from '@angular/core';

import { AssetService } from './../shared/assets.service';
import { TagsService } from './tags.service';
import { Tag } from './tag/tag.class';
import { AnalyticsService } from '../analytics.service';

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
    private _tags: TagsService,
    private _analytics: AnalyticsService
  ) { }


  /** Initializes array of Tags based on collections */
  ngOnInit() {
    this._tags.initTags({type: "commons"})
      .then((tags) => {
        this.tags = tags;
      })
      .catch((err) => {
        console.error(err);
      });
  
    this._analytics.setPageValues('commons', '')
  } // OnInit
}