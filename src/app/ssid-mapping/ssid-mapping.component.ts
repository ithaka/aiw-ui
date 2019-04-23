import { Component, OnInit } from '@angular/core'
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { Router, ActivatedRoute, UrlSegment } from '@angular/router'
import { Subscription }   from 'rxjs'
import { map } from 'rxjs/operators'

// Internal Dependencies
import { AssetSearchService } from './../shared'
import { MetadataService } from './../_services'

@Component({
  selector: 'ang-ssid-mapping',
  styleUrls: [ './ssid-mapping.component.scss' ],
  templateUrl: './ssid-mapping.component.pug'
})

export class SsidMapping implements OnInit {
  private ssId: string
  private subscriptions: Subscription[] = []
  public errorMsg: string = ''
  public loading: boolean = false

  constructor(
    private _metadata: MetadataService,
    private _search: AssetSearchService,
    private _router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
  ) {}

  ngOnInit() {
    // Subscribe to ID in params
    this.subscriptions.push(
      this.route.params.pipe(
        map(routeParams => {
        this.ssId = routeParams['ssId']
        if(this.ssId) {
          this.loading = true
          this.searchSsid()
        }
    })).subscribe()
    )
  }

  private searchSsid(): void {
    this._search.getAssetById(this.ssId, true).subscribe( (res) => {
      console.log(res, 'this is result')
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
