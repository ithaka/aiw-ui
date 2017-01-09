import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Subscription }   from 'rxjs/Subscription';

import { Asset } from './asset';
import { AuthService, AssetService } from './../shared';

@Component({
    selector: 'ang-asset-page',
    templateUrl: 'asset-page.component.html',
    styleUrls: [ './asset-page.component.scss' ]
})
export class AssetPage implements OnInit, OnDestroy {

    private asset: Asset;
    private assetIndex: number = 0;
    private assetNumber: number = 0;
    private totalAssetCount: number = 1;
    private subscriptions: Subscription[] = [];
    private prevAssetResults: any = {};
    private loadArrayFirstAsset: Boolean = false;
    private loadArrayLastAsset: Boolean = false;

    /** controls whether or not to show the agreement modal before download */
    // private downloadAuth: boolean = false;
    /** controls whether or not the agreement modal is visible */
    private showAgreeModal: boolean = false;

    constructor(private _assets: AssetService, private _auth: AuthService, private route: ActivatedRoute, private _router: Router,) { }

    ngOnInit() {
        this.subscriptions.push(
            this.route.params.subscribe((routeParams) => {
                this.asset = new Asset(routeParams["assetId"], this._assets);
                if(this.prevAssetResults.thumbnails){
                    this.totalAssetCount = this.prevAssetResults.count ? this.prevAssetResults.count : this.prevAssetResults.thumbnails.length;
                    this.assetIndex = this.currentAssetIndex();
                    this.assetNumber = this._assets.lastSearchParams.currentPage ? this.assetIndex + 1 + ((this._assets.lastSearchParams.currentPage - 1) * this._assets.searchPageSize) : this.assetIndex + 1;
                }
            })
        );

        // sets up subscription to allResults, which is the service providing thumbnails
        this.subscriptions.push(
          this._assets.allResults.subscribe((allResults: any) => {
              if(allResults.thumbnails){
                  console.log(allResults);
                  this.prevAssetResults = allResults;
                  if(this.loadArrayFirstAsset){
                      this.loadArrayFirstAsset = false;
                      if((this.prevAssetResults.thumbnails) && (this.prevAssetResults.thumbnails.length > 0)){
                          this._router.navigate(['/asset', this.prevAssetResults.thumbnails[0].objectId]);
                      }
                  }
                  else if(this.loadArrayLastAsset){
                      this.loadArrayLastAsset = false;
                      if((this.prevAssetResults.thumbnails) && (this.prevAssetResults.thumbnails.length > 0)){
                          this._router.navigate(['/asset', this.prevAssetResults.thumbnails[this.prevAssetResults.thumbnails.length - 1].objectId]);
                      }
                  }
                  else{
                    this.totalAssetCount = this.prevAssetResults.count ? this.prevAssetResults.count : this.prevAssetResults.thumbnails.length;
                    this.assetIndex = this.currentAssetIndex();
                    this.assetNumber = this._assets.lastSearchParams.currentPage ? this.assetIndex + 1 + ((this._assets.lastSearchParams.currentPage - 1) * this._assets.searchPageSize) : this.assetIndex + 1;
                  }
              }
          })
        );
    }

    ngOnDestroy() {
        this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
    }

    private downloadAuth(): boolean {
        return this._auth.downloadAuthorized();
    }

    // Calculate the index of current asset from the previous assets result set
    private currentAssetIndex(): number{
        for(var i = 0; i < this.prevAssetResults.thumbnails.length; i++){
            if(this.prevAssetResults.thumbnails[i].objectId == this.asset.id){
                return i;
            }
        }
        return 1;
    }
    
    private showPrevAsset(): void{
        if(this.assetNumber > 1){
            if((this.assetIndex > 0)){
                this._router.navigate(['/asset', this.prevAssetResults.thumbnails[this.assetIndex - 1].objectId]);
            }
            else if(this.assetIndex == 0){
                this.loadArrayLastAsset = true;
                this._assets.loadPrevAssetPage();
            }
        }
    }

    private showNextAsset(): void{
        if(this.assetNumber < this.totalAssetCount){
            if((this.prevAssetResults.thumbnails) && (this.assetIndex < (this.prevAssetResults.thumbnails.length - 1))){
                this._router.navigate(['/asset', this.prevAssetResults.thumbnails[this.assetIndex + 1].objectId]);
            }
            else if((this.prevAssetResults.thumbnails) && (this.assetIndex == (this.prevAssetResults.thumbnails.length - 1))){
                this.loadArrayFirstAsset = true;
                this._assets.loadNextAssetPage();
            }
        }
    }
}