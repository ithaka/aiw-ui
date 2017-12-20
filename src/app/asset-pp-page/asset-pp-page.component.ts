import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, ActivatedRoute, UrlSegment } from '@angular/router';
import { Subscription }   from 'rxjs/Subscription';

// Internal Dependencies
import { AssetService } from './../shared';
import { AnalyticsService } from '../analytics.service';

@Component({
  selector: 'ang-asset-pp-page',
  styleUrls: [ './asset-pp-page.component.scss' ],
  templateUrl: './asset-pp-page.component.pug'
})

export class AssetPPPage implements OnInit, OnDestroy {

  private header = new HttpHeaders().set('Content-Type', 'application/json'); // ... Set content type to JSON
  private options = { headers: this.header, withCredentials: true }; // Create a request option

  private assetId: string;
  private asset: any = {};
  private metaArray: Array<any> = [];

  private subscriptions: Subscription[] = [];


  constructor(
    private _assets: AssetService,
    private _router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
    private _analytics: AnalyticsService
  ) {}

  ngOnInit() {

    // Subscribe to ID in params
    this.subscriptions.push(
      this.route.params.subscribe((routeParams) => {
        this.assetId = routeParams["assetId"];
        this.loadAsset();
      })
    );

    // this._analytics.setPageValues('groupprint', this.assetId);
  } // OnInit

  // Load Image Group Assets
  loadAsset(): void{
    let self = this;
    this._assets.getMetadata( this.assetId )
    .subscribe((res) => {
        let assetData = res && res.metadata && res.metadata[0] ? res.metadata[0]['metadata_json'] : []
        for(let data of assetData){
          let fieldExists = false;
          
          for(let metaData of self.metaArray){
            if(metaData['fieldName'] === data.fieldName){
              metaData['fieldValue'].push(data.fieldValue);
              fieldExists = true;
              break;
            }
          }

          if(!fieldExists){
            let fieldObj = {
              'fieldName': data.fieldName,
              'fieldValue': []
            }
            fieldObj['fieldValue'].push(data.fieldValue);
            self.metaArray.push(fieldObj);
          }

        }
        
        self.asset = res.metadata[0];
    },(err) => {
        console.error('Unable to load asset metadata.');
    });
  }

  ngOnDestroy() {
  }
}
