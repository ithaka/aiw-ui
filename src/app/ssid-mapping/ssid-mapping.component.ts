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
      // Subscribe User object updates
      this._auth.currentUser.subscribe(
        (userObj) => {
          if(userObj.isLoggedIn) {
            if(this.ssid) {
              this.loading = true
              this.searchSsid()
            }
          } else {
            this._auth.store('stashedRoute', this.location.path(false));
            this._router.navigate(['/login']);
          }
        },
        (err) => {
          console.error(err)
        }
      ),
      // Subscribe to ssid in params
      this.route.params.pipe(
        map(routeParams => {
        this.ssid = routeParams['ssid']
    })).subscribe()
    )
  }

  private searchSsid(): void {
    this._search.getAssetById(this.ssid, true).subscribe( (res) => {
      if(res.artstorid) {
        this.loading = false
        this._router.navigate(['/asset', res.artstorid])
      }
    },
    (error)=> {
      this.loading = false
      this.errorMsg = error
    })
  }

}
