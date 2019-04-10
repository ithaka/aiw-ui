import { Component, OnInit } from '@angular/core'
import { Router, ActivatedRoute, Params } from '@angular/router'
import { Subscription } from 'rxjs'
import { map } from 'rxjs/operators'
import { HttpClient } from '@angular/common/http'

// Project Dependencies
import { TitleService, AssetSearchService, AuthService, AssetService, FlagService } from '../shared'
import { ArtstorStorageService } from '../../../projects/artstor-storage/src/public_api';

@Component({
  selector: 'ang-my-collections',
  templateUrl: 'my-collections.component.pug',
  styleUrls: ['./browse-page.component.scss']
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
    private router: Router,
    private route: ActivatedRoute,
    private _search: AssetSearchService,
    private _assets: AssetService,
    private _title: TitleService,
    private _http: HttpClient,
    private _storage: ArtstorStorageService
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

    // If user is logged-in get data for user's Private Collections
    if (this.isLoggedIn) {
      this.getUserPCol('private')
    }
  } // OnInit

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }

  /**
   * getUserPCol - Load Private Collections
   * Used for loading user's Private Collections
   * @param type string 'private'
   * Note: /collections?type= accepts private, public, institution as well
   */
  getUserPCol(type: string): void {
    this.loading = true
    let options = { withCredentials: true }
    let localPCollections = this._storage.getLocal('pcollections')
    let tempMyCol: any = {}

    if (localPCollections) {
      this.pcollections = localPCollections
    }
    else {
      this._http.get(this._auth.getHostname() + '/api/v1/collections?type=' + type, options).pipe(
        map(res => {
          this.pcollections = res

          tempMyCol = this.pcollections.filter((col) => { return col.collectionid === '37436' })[0] // My PC object
          tempMyCol.collectionname = 'My Personal Collection' // Change name from 'Global'
          this.pcollections = this.pcollections.filter((col) => { return col.collectionid !== '37436' }) // filter out initial My PC object
          this.pcollections.unshift(tempMyCol) // prepend My PC object back to pcollections

          this._storage.setLocal('37436', this.pcollections[0])
          this._storage.setLocal('pcollections', this.pcollections)
        })).subscribe()
    }

    this.loading = false
  }

}
