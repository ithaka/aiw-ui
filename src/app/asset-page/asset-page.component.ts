import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Subscription }   from 'rxjs/Subscription';
import { Locker } from 'angular2-locker';

// Project Dependencies
import { Asset } from './asset';
import { AuthService, AssetService, GroupService } from './../shared';
import { AssetViewerComponent } from './asset-viewer/asset-viewer.component';
import { AnalyticsService } from '../analytics.service';

@Component({
    selector: 'ang-asset-page',
    templateUrl: 'asset-page.component.html',
    styleUrls: [ './asset-page.component.scss' ]
})
export class AssetPage implements OnInit, OnDestroy {

    @ViewChild(AssetViewerComponent)
    private assetViewer: AssetViewerComponent;

    private user: any;

    private hasPrivateGroups: boolean = false;

    // Array to support multiple viewers on the page
    private assets: Asset[] = [];
    private assetIndex: number = 1;
    private assetNumber: number = 1;
    private totalAssetCount: number = 1;
    private subscriptions: Subscription[] = [];
    private prevAssetResults: any = { thumbnails : [] };
    private loadArrayFirstAsset: boolean = false;
    private loadArrayLastAsset: boolean = false;
    private isFullscreen: boolean = false;
    private showAssetDrawer: boolean = false;

    /** controls whether or not the modals are visible */
    private showAgreeModal: boolean = false;
    private showLoginModal: boolean = false;
    private showAddModal: boolean = false;
    private showCreateGroupModal: boolean = false;

    private copyURLStatusMsg: string = '';
    private showCopyUrl: boolean = false;
    private generatedImgURL: string = '';
    private prevRouteParams: any = [];

    private _storage;
    

    constructor(
            private _assets: AssetService, 
            private _group: GroupService,
            private _auth: AuthService, 
            private route: ActivatedRoute, 
            private _router: Router, 
            private locker: Locker,
            private _analytics: AnalyticsService
        ) { 
            this._storage = locker.useDriver(Locker.DRIVERS.LOCAL);
    }

    ngOnInit() {
        this.user = this._auth.getUser();

        // For "Go Back to Results"
        let prevRouteParams = this._storage.get('prevRouteParams');
        if(prevRouteParams && (prevRouteParams.length > 0)){
            this.prevRouteParams = prevRouteParams;
        }
        this._storage.remove('prevRouteParams');

        // TotalAssets - for browsing between the assets
        let totalAssets = this._storage.get('totalAssets');
        if(totalAssets){
            this.totalAssetCount = totalAssets;
        }
        else{
            this.totalAssetCount = 1;
        }
        this._storage.remove('totalAssets');

        this.subscriptions.push(
            this.route.params.subscribe((routeParams) => {
                this.assets = []

                if (routeParams['encryptedId']) {
                    this._assets.decryptToken(routeParams['encryptedId'])
                        .take(1)
                        .subscribe((asset) => {
                            this.assets[0] = new Asset(asset.objectId, this._assets, this._auth)
                            this.generateImgURL()
                        }, (err) => {
                            console.error(err)
                            this._router.navigate(['/nocontent'])
                        })
                } else {
                    this.assets[0] = new Asset(routeParams["assetId"], this._assets, this._auth);
                    this.generateImgURL();

                    if(this.prevAssetResults.thumbnails.length > 0){
                        // this.totalAssetCount = this.prevAssetResults.count ? this.prevAssetResults.count : this.prevAssetResults.thumbnails.length;
                        this.assetIndex = this.currentAssetIndex();
                        this.assetNumber = this._assets.currentLoadedParams.currentPage ? this.assetIndex + 1 + ((this._assets.currentLoadedParams.currentPage - 1) * this._assets.currentLoadedParams.pageSize) : this.assetIndex + 1;
                    }
                }

            })
        );

        // Get latest set of results with at least one asset
        // this.prevAssetResults = this._assets.getRecentResults();


        // sets up subscription to allResults, which is the service providing thumbnails
        this.subscriptions.push(
          this._assets.allResults.subscribe((allResults: any) => {
              if(allResults.thumbnails){
                  this.prevAssetResults.thumbnails = allResults.thumbnails;
                  if(this.loadArrayFirstAsset){
                      this.loadArrayFirstAsset = false;
                      if((this.prevAssetResults) && (this.prevAssetResults.thumbnails.length > 0)){
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
                    // this.totalAssetCount = this.prevAssetResults.count ? this.prevAssetResults.count : this.prevAssetResults.thumbnails.length;
                    this.assetIndex = this.currentAssetIndex();
                    this.assetNumber = this._assets.currentLoadedParams.currentPage ? this.assetIndex + 1 + ((this._assets.currentLoadedParams.currentPage - 1) * this._assets.currentLoadedParams.pageSize) : this.assetIndex + 1;
                  }
              }
          })
        );

        if(this.user.isLoggedIn){
            // Check if the logged-in user has private image groups
            this._group.getAll('private')
                        .take(1)
                        .subscribe((res) => { if (res.groups && (res.groups.length > 0)) { this.hasPrivateGroups = true; } }, (err) => { console.error(err); });
        }

        this._analytics.setPageValues('asset', this.assets[0] && this.assets[0].id)
    } // OnInit

    ngOnDestroy() {
        this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
    }

    /**
     * Maintains the isFullscreen variable, as set by child AssetViewers
     */
    updateFullscreenVar(isFullscreen: boolean): void {
        this.isFullscreen = isFullscreen;
    }

    /**
     * Find out if the user has accepted the agreement during this session
     * @returns boolean which is true if the user has accepted the agreement
     */
    private downloadAuth(): boolean {
        return this._auth.downloadAuthorized();
    }

    // Calculate the index of current asset from the previous assets result set
    private currentAssetIndex(): number{
        for(var i = 0; i < this.prevAssetResults.thumbnails.length; i++){
            if(this.prevAssetResults.thumbnails[i].objectId == this.assets[0].id){
                return i;
            }
        }
        return 1;
    }

    private addAssetToIG(): void{
        if(this.user.isLoggedIn){
            if(this.hasPrivateGroups){
                this.showAddModal = true;
            }
            else{
                this.showCreateGroupModal = true;
            }
        }
        else{
            this.showLoginModal = true;
        }
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

     /** 
     * Clean up the field label for use as an ID (used in testing)
     */
    private cleanId(label: string): string {
        return label.toLowerCase().replace(/\s/g,'');
    }

    private generateImgURL(): void{
        this.generatedImgURL = this._assets.getShareLink(this.assets[0].id);
    }

    /**
     * Adds a link to the current asset page to the user's clipboard
     */
    private copyGeneratedImgURL(): void {
        let statusMsg = '';
        let input : any = document.getElementById('generatedImgURL');

        this._analytics.directCall('generate_img_link');

        this.showCopyUrl = true;
        input.focus()
        input.select()

        setTimeout( () => { 
            input.select(); 
            if(document.queryCommandSupported('copy')){
                document.execCommand('copy')
                statusMsg = 'Image URL successfully copied to the clipboard!';
            }
            else{
                statusMsg = 'Select the above link, and copy to share!';
            }
            this.copyURLStatusMsg = statusMsg;
        }, 50);
    }

     // Add or remove assets from Assets array for comparison in full screen
    private toggleAsset(asset: any): void {
        let add = true;
        this.assets.forEach( (viewAsset, i) => {
            if (asset.id == viewAsset.id) {
                asset.selected = false;
                this.assets.splice(i, 1);
                add = false;

                // Set 'selected' to 'false' for the asset in asset drawer
                this.prevAssetResults.thumbnails.forEach( (thumbnail, i) => {
                    if (asset.id == thumbnail.objectId) {
                        thumbnail.selected = false;
                    }
                });
                
            }
        })
        if (this.assets.length >= 10) {
            add = false;
            // TO-DO: Show Error message
        }
        if (add == true) {
            asset.selected = true;
            this.assets.push( new Asset(asset.objectId, this._assets, this._auth) );
        }
    }

    // Exit Presentation / Fullscreen mode and reset assets comparison array
    private exitPresentationMode(): void{
        this.assets.splice(1);
        for(let i = 0; i < this.prevAssetResults.thumbnails.length; i++){
            this.prevAssetResults.thumbnails[i].selected = false;
        }
        this.assetViewer.togglePresentationMode();
    }

    private backToResults(): void{
        if(this.prevRouteParams.length == 1){
            this._router.navigate(['/' + this.prevRouteParams[0].path, this.prevRouteParams[0].parameters]);
            this.prevRouteParams = [];
        }
        else if(this.prevRouteParams.length == 2){
            this._router.navigate(['/' + this.prevRouteParams[0].path, this.prevRouteParams[1].path, this.prevRouteParams[1].parameters]);
            this.prevRouteParams = [];
        }
        else if(this.prevRouteParams.length == 3){
            this._router.navigate(['/' + this.prevRouteParams[0].path, this.prevRouteParams[1].path, this.prevRouteParams[2].path]);
            this.prevRouteParams = [];
        }

    }
}