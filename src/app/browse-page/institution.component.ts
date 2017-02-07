import { Component, OnInit } from '@angular/core';

import { AssetService } from './../shared/assets.service';
import { TagsService } from './tags.service';
import { Tag } from './tag/tag.class';

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
    private _tags: TagsService
  ) { }

  ngOnInit() {
    this._tags.initTags({type: "institution"})
      .then((tags) => {
        console.log(tags);
        this.tags = tags;
        this.loading = false;
      })
      .catch((err) => {
        console.error(err);
        this.loading = false;
      });
  }
  
}