import { Component, OnInit, OnDestroy } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
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

  private header = new Headers({ 'Content-Type': 'application/json' }); // ... Set content type to JSON
  private options = new RequestOptions({ headers: this.header, withCredentials: true }); // Create a request option

  private assetId: string;
  private asset: any = {};
  private metaArray: Array<any> = [];

  private subscriptions: Subscription[] = [];


  constructor(
    private _assets: AssetService,
    private _router: Router,
    private route: ActivatedRoute,
    private http: Http,
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
    this._assets.getById( this.assetId )
    .then((res) => {

        if(res.objectId){
          for(let data of res.metaData){
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

          self.asset = res;
        }
    })
    .catch(function(err) {
        console.error('Unable to load asset metadata.');
    });
  }

  ngOnDestroy() {
  }
}
