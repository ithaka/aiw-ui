import { Component, OnInit } from '@angular/core'
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { Router, ActivatedRoute, UrlSegment } from '@angular/router'
import { Subscription }   from 'rxjs'
import { map } from 'rxjs/operators'

// Internal Dependencies
import { AssetSearchService, MetadataService } from './../shared'

@Component({
  selector: 'ang-asset-pp-page',
  styleUrls: [ './asset-pp-page.component.scss' ],
  templateUrl: './asset-pp-page.component.pug'
})

export class AssetPPPage implements OnInit {
  public asset: any = {}
  public metaArray: Array<any> = []
  private header = new HttpHeaders().set('Content-Type', 'application/json') // ... Set content type to JSON
  private options = { headers: this.header, withCredentials: true } // Create a request option\
  private assetId: string
  private subscriptions: Subscription[] = []
  public isMultiView: boolean  = false // flag for print preview of multiview asset

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
        this.assetId = routeParams['assetId']
        this.loadAsset()
    })).subscribe()
    )
  }

  // Load Image Group Assets
  loadAsset(): void{
    let self = this
    this._metadata.getMetadata(this.assetId, undefined, false).pipe(
      map(res => {

        // Is this a multiview asset?
        if (res.metadata[0].image_compound_urls && res.metadata[0].image_compound_urls.length) {
          this.isMultiView = true
        }

        let assetData = res && res.metadata && res.metadata[0] ? res.metadata[0]['metadata_json'] : []
        for (let data of assetData){
          let fieldExists = false

          for (let metaData of self.metaArray){
            if (metaData['fieldName'] === data.fieldName){
              metaData['fieldValue'].push(data.fieldValue)
              fieldExists = true
              break
            }
          }

          if (!fieldExists){
            let fieldObj = {
              'fieldName': data.fieldName,
              'fieldValue': []
            }
            fieldObj['fieldValue'].push(data.fieldValue)
            self.metaArray.push(fieldObj)
          }

        }
        self.asset = res.metadata[0]
    }, (err) => {
        console.error('Unable to load asset metadata.')
    })).subscribe()
  }

}
