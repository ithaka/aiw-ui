import { Component, OnInit } from '@angular/core'
import { Router, ActivatedRoute, Params } from '@angular/router'
import { Subscription } from 'rxjs'
import { map } from 'rxjs/operators'
import { HttpClient, HttpHeaders } from '@angular/common/http'

import { LockerService } from 'app/_services'
import { TitleService, AssetSearchService, AuthService, AssetService, FlagService } from '../shared'

@Component({
  selector: 'ang-my-collections',
  templateUrl: 'my-collections.component.pug',
  styleUrls: ['./browse-page.component.scss', './tag/tag.component.scss']
})
export class MyCollectionsComponent implements OnInit {
  public unaffiliatedUser: boolean = false

  public isLoggedIn: boolean
  public showEditPCModal: boolean = false

  public pcollections: any = []

  public loading: boolean = false;
  private subscriptions: Subscription[] = [];

  constructor(
    private _auth: AuthService,
    private _flags: FlagService,
    private router: Router,
    private route: ActivatedRoute,
    private _search: AssetSearchService,
    private _assets: AssetService,
    private _title: TitleService,
    private _http: HttpClient,
    private _locker: LockerService
  ) {
    this.unaffiliatedUser = this._auth.isPublicOnly() ? true : false
  }

  ngOnInit() {

    // Set page title
    this._title.setSubtitle('Browse My Collections')

    // Subscribe to User object updates
    this.subscriptions.push(
      this._auth.currentUser.pipe(
        map(userObj => {
          this.isLoggedIn = userObj.isLoggedIn
        },
          (err) => { console.error(err) }
        )).subscribe()
    )

    // // If user is logged-in get data for user's Private Collections
    if (this.isLoggedIn) {
      this.getUserPCol('private')
    }
  } // OnInit

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }

  /**
   * Load Private Collections
   * Used for loading user's Private Collections
   */
  getUserPCol(type: string) {
    this.loading = true
    let options = { withCredentials: true }
    let localPCollections = this._locker.get('pcollections')
    let tempMyCol: any = {}

    if (localPCollections) {
      this.pcollections = localPCollections
    }
    else {
      this._http.get(this._auth.getHostname() + '/api/v1/collections?type=' + type, options).pipe(
        map(res => {
          this.pcollections = res
          this._locker.set('pcollections', this.pcollections)
        })).subscribe()
    }

    tempMyCol = this.pcollections.filter((col) => { return col.collectionid === '37436' })[0] // My PC object
    tempMyCol.collectionname = 'My Personal Collection' // Change name from 'Global'
    this.pcollections = this.pcollections.filter((col) => { return col.collectionid !== '37436' }) // filter out initial My PC object
    this.pcollections.unshift(tempMyCol) // prepend My PC object back to pcollections
  }

}
