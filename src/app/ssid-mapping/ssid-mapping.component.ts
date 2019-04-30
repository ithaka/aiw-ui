import { Component, OnInit } from '@angular/core'
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { Router, ActivatedRoute, UrlSegment } from '@angular/router'
import { Location } from '@angular/common';
import { Subscription }   from 'rxjs'
import { map, take } from 'rxjs/operators'

// Internal Dependencies
import { AssetSearchService, AuthService } from './../shared'
import { MetadataService } from './../_services'

@Component({
  selector: 'ang-ssid-mapping',
  styleUrls: [ './ssid-mapping.component.scss' ],
  templateUrl: './ssid-mapping.component.pug'
})

export class SsidMapping implements OnInit {
  private ssid: string
  private user: any
  private subscriptions: Subscription[] = []
  public errorMsg: string = ''
  public loading: boolean = false

  constructor(
    private _metadata: MetadataService,
    private _search: AssetSearchService,
    private _router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
    private _auth: AuthService,
    private location: Location
  ) {}

  ngOnInit() {
    this.subscriptions.push(
      // Subscribe to ssid in params
      this.route.params.pipe(
        map(routeParams => {
        this.ssid = routeParams['ssid']
      })).subscribe(),
      // Subscribe User object updates
      this._auth.currentUser.subscribe(
        (userObj) => {
          this.user = userObj
          if(this._auth.userSessionFresh) {
            if(this.ssid) {
              this.loading = true
              this.searchSsid()
            } else {
              this._router.navigate(['/not-found']);
            }
          } else {
            this.loading = true
          }
        },
        (err) => {
          console.error(err)
        }
      )
    )
  }

  private searchSsid(): void {
    this._search.getAssetById(this.ssid, true).subscribe( (res) => {
      if(res.artstorid) {
        this.loading = false
        this._router.navigate(['/asset', res.artstorid])
      } else if (!this.user.isLoggedIn) {
        // If user is not logged in, they may not have access
        this._auth.store('stashedRoute', this.location.path(false));
        this._router.navigate(['/login']);
      } else {
        // If user is logged in, and asset not found, assume there was an error/bad id
        this.loading = false
        this.errorMsg = 'Unable to match SSID'
      }
    },
    (error)=> {
      this.loading = false
      this.errorMsg = error
    })
  }

}
