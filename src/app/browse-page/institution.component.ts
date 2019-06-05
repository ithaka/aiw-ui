import { Component, OnInit } from '@angular/core';

// Project Dependencies
import { Tag } from './tag/tag.class';
import { AssetService, TitleService, AuthService } from 'app/_services';
import { TagsService } from './tags.service';

@Component({
  selector: 'ang-browse-institution',
  providers: [],
  templateUrl: 'institution.component.pug',
  styleUrls: [ './browse-page.component.scss' ]
})
export class BrowseInstitutionComponent implements OnInit {
public tags: Tag[] = [];
public loading: boolean = true;
public unaffiliatedUser: boolean = false

  constructor(
    private _assets: AssetService,
    private _tags: TagsService,
    private _title: TitleService,
    private _auth: AuthService,
  ) {
    this.unaffiliatedUser = this._auth.isPublicOnly() ? true : false
  }

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
  } // OnInit
}
