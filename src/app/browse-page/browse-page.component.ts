import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute, Params, UrlSegment } from '@angular/router';
import { Subscription }   from 'rxjs/Subscription';
import { Locker } from 'angular2-locker';

import { TitleService } from '../shared/title.service';
import { AssetService } from '../shared/assets.service';
import { AuthService } from '../shared/auth.service';
import { AssetFiltersService } from '../asset-filters/asset-filters.service';

import { AppConfig } from '../app.service';

@Component({
  selector: 'ang-browse-page',
  styleUrls: [ './browse-page.component.scss' ],
  templateUrl: './browse-page.component.pug'
})

export class BrowsePage implements OnInit, OnDestroy {

  private _storage: Locker
  private subscriptions: Subscription[] = []
  private institution: any = {}

  colMenuArray = []

  private userPCallowed: string
  private userTypeId: any
  private selectedColMenuId: string = '1'

  private browseOpts: any = {}

  private user: any = {}

  // TypeScript public modifiers
  constructor(
      locker: Locker,
      private _auth: AuthService,
      private _assets: AssetService,
      private _app: AppConfig,
      private route: ActivatedRoute,
      private router: Router,
      private _title: TitleService,
      private _filters: AssetFiltersService
  ) {
      this._storage = locker.useDriver(Locker.DRIVERS.LOCAL);
      this.institution = this._storage.get('institution');
      this.browseOpts = this._app.config.browseOptions;
  }

  ngOnInit() {
    // Subscribe to User object updates
    this.subscriptions.push(
        this._auth.currentUser.subscribe(
            (userObj) => { this.user = userObj },
            (err) => { console.error(err) }
        )
    );

    // Set page title
    this._title.setSubtitle('Browse')

    // Clear previously applied filters on search
    this._filters.clearApplied()

    this.subscriptions.push(
      this.route.firstChild.url
      .subscribe((url: UrlSegment[]) => {
        this.selectedColMenuId = url[0].path;
      })
    );

    if ( this.browseOpts.artstorCol && !this._auth.isPublicOnly()){
        this.colMenuArray.push( { label: 'Artstor Digital Library', id: '1', link: 'library' } );
    }

    // Subscribe to Institution object updates and change MenuArray on the run
    this.subscriptions.push(
        this._auth.getInstitution().subscribe(
            (institutionObj) => {
                this.institution = institutionObj;
                this.userTypeId = this._auth.getUser().typeId;
                if ( (this.userTypeId == 1 || this.userTypeId == 2 || this.userTypeId == 3) && this.browseOpts.instCol && !this._auth.isPublicOnly() ){
                    let instName = this.institution && this.institution.shortName ? this.institution.shortName : 'Institutional';
                    let obj = {
                        label : instName + ' Collections',
                        id: '2',
                        link: 'institution'
                    }
                    // Replace the item of the array instead of push
                    this.colMenuArray.splice(1, 1 , obj);
                }
            },
            (err) => {
                console.error('Nav failed to load Institution information', err)
            }
        )
    );

    if ( this.browseOpts.openCol ){
        this.colMenuArray.push( { label: 'Public Collections', id: '3', link: 'commons' } );
    }

    if (this.browseOpts.myCol && !this._auth.isPublicOnly()){
        let obj = {
            label : 'My Collections',
            id: '4',
            link: 'mycollections'
        }
        this.colMenuArray.splice(2, 0 , obj);
    }

    if ( this.browseOpts.igs && !this._auth.isPublicOnly() ){
        this.colMenuArray.push( { label: 'Groups', id: '5', link: 'groups' } );
    }

  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }

    /**
     * Changes menu between ADL, University Collections, Open Collections, etc...
     * @param id Id of desired menu from colMenuArray enum
     */
    private selectColMenu( id: string ){
        this.selectedColMenuId = id;
    }

}
