import { Component, OnInit } from '@angular/core'
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { Router, ActivatedRoute, UrlSegment } from '@angular/router'
import { Subscription }   from 'rxjs'
import { map } from 'rxjs/operators'

// Internal Dependencies
import { AssetSearchService, MetadataService, ThumbnailService } from '_services'

@Component({
  selector: 'ang-asset-pp-page',
  styleUrls: [ './asset-pp-page.component.scss' ],
  templateUrl: './asset-pp-page.component.pug'
})

export class AssetPPPage implements OnInit {
  public asset: any = {}
  public isMultiView: boolean = false // flag for print preview of multiview asset
  private header = new HttpHeaders().set('Content-Type', 'application/json') // ... Set content type to JSON
  private options = { headers: this.header, withCredentials: true } // Create a request option\
  private assetId: string
  private subscriptions: Subscription[] = []

  constructor(
    private _metadata: MetadataService,
    private _search: AssetSearchService,
    private _router: Router,
    private _thumbnail: ThumbnailService,
    private route: ActivatedRoute,
    private http: HttpClient,
  ) {}

  ngOnInit() {
    // Subscribe to ID in params
    this.subscriptions.push(
      this.route.params.pipe(
        map(routeParams => {
        this.assetId = routeParams['assetId']
        this.loadAsset()
    })).subscribe()
    )
  }

  setThumbnail(asset) {
    return this._thumbnail.makeThumbUrl(asset, 2)
  }

  // Load Image Group Assets
  loadAsset(): void{
    let self = this
    this._metadata.buildAsset(this.assetId, {}).pipe(
      map(asset => {
        // Is this a multiview asset?
        // We are tranforming image_compound_urls to tileSource in Asset constructor, check tileSource instead
        if (typeof(asset.tileSource) === 'object' && asset.tileSource.length) {
          this.isMultiView = true
        }

        self.asset = asset
    }, (err) => {
        console.error('Unable to load asset metadata.')
    })).subscribe()
  }

  /**
    * Clean up the field label for use as an ID (used in testing)
    */
   private cleanId(label: string): string {
    if (typeof (label) == 'string') {
        return label.toLowerCase().replace(/\s/g, '')
    } else {
        return ''
    }
  }

  /**
   * Some html tags are ruining things:
   * - <wbr> word break opportunities break our link detection
   */
  private cleanFieldValue(value: string): string {
      if (typeof (value) == 'string') {
          return value.replace(/\<wbr\>/g, '').replace(/\<wbr\/\>/g, '')
      } else {
          return ''
      }
  }

}
