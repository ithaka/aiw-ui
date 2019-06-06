import { Component, OnInit } from '@angular/core'

// Project Dependencies
import { AssetService, TitleService } from '_services'
import { TagsService } from './tags.service'
import { Tag } from './tag/tag.class'

@Component({
  selector: 'ang-browse-commons',
  providers: [],
  templateUrl: 'commons.component.pug',
  styleUrls: [ './browse-page.component.scss' ]
})
export class BrowseCommonsComponent implements OnInit {
  public tags: Tag[] = [];
  public loading: boolean = true;

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
