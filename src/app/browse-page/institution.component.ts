import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription }   from 'rxjs';
import { map } from 'rxjs/operators';

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
export class BrowseInstitutionComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = []
  public tags: Tag[] = [];
  public loading: boolean = true;
  public unaffiliatedUser: boolean = false
  public browseLabel: string = ''


  constructor(
    private _assets: AssetService,
    private _tags: TagsService,
    private _title: TitleService,
    private _auth: AuthService,
  ) {
    this.unaffiliatedUser = this._auth.isPublicOnly() ? true : false
  }

  ngOnInit() {
    this.subscriptions.push(
      this._auth.getInstitution().pipe(
        map(institutionObj => {
          let instName = institutionObj && institutionObj.shortName ? institutionObj.shortName : 'Institutional';
          this.browseLabel = instName + ' Collections';
        },
        (err) => {
          console.error('Failed to load Institution information', err)
        }
      )).subscribe()
    );
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

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }
}
