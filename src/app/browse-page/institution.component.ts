import { Component, OnInit } from '@angular/core';

import { AssetService } from './../shared/assets.service';
import { AnalyticsService } from '../analytics.service';
import { TagsService } from './tags.service';
import { Tag } from './tag/tag.class';
import { TitleService } from '../shared/title.service';

@Component({
  selector: 'ang-browse-institution',
  providers: [],
  templateUrl: 'institution.component.html',
  styleUrls: [ './browse-page.component.scss' ]
})
export class BrowseInstitutionComponent implements OnInit {
  private tags: Tag[] = [];
  private loading: boolean = true;

  constructor(
    private _assets: AssetService,
    private _tags: TagsService,
    private _analytics: AnalyticsService,
    private _title: TitleService
  ) { }

  ngOnInit() {
    // Set page title
    this._title.setSubtitle("Browse Institutional Collections")

    this._tags.initTags({type: "institution"})
      .then((tags) => {
        this.tags = tags;
        this.loading = false;
      })
      .catch((err) => {
        console.error(err);
        this.loading = false;
      });
    this._analytics.setPageValues('institutional', '')
  } // OnInit
  
}