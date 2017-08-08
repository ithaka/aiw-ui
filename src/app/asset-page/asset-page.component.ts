import { Title } from '@angular/platform-browser';
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Subscription }   from 'rxjs/Subscription';
import { Locker } from 'angular2-locker';
import { Angulartics2 } from 'angulartics2/dist';

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
    private assetViewer: AssetViewerComponent

    private user: any
    private hasExternalAccess: boolean = false
    private hasPrivateGroups: boolean = false
    private document = document

    // Array to support multiple viewers on the page
    private assets: Asset[] = []
    private assetIndex: number = 1
    private assetNumber: number = 1
    private totalAssetCount: number = 1
    private subscriptions: Subscription[] = []
    private prevAssetResults: any = { thumbnails : [] }
    private loadArrayFirstAsset: boolean = false
    private loadArrayLastAsset: boolean = false
    private isFullscreen: boolean = false
    private showAssetDrawer: boolean = false

    /** controls whether or not the modals are visible */
    private showAgreeModal: boolean = false
    private showLoginModal: boolean = false
    private showAddModal: boolean = false
    private showCreateGroupModal: boolean = false
    private showAccessDeniedModal: boolean = false

    private copyURLStatusMsg: string = ''
    private showCopyUrl: boolean = false
    private generatedImgURL: string = ''
    private prevRouteParams: any = []
    private collectionName: string = ''

    private _storage
    

    constructor(
            private _assets: AssetService, 
            private _group: GroupService,
            private _auth: AuthService, 
            private route: ActivatedRoute, 
            private _router: Router, 
            private locker: Locker,
            private _analytics: AnalyticsService,
            private angulartics: Angulartics2,
            private _title: Title 
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
                let assetIdProperty = this._auth.featureFlags[routeParams['featureFlag']]? 'artstorid' : 'objectId'

                // Find feature flags
                if(routeParams && routeParams['featureFlag']){
                    this._auth.featureFlags[routeParams['featureFlag']] = true;
                }

                if (routeParams['encryptedId']) {
                    this.hasExternalAccess = true
                    this._assets.decryptToken(routeParams['encryptedId'])
                        .take(1)
                        .subscribe((data) => {
                            if (data.metadata) {
                                data.item.metadata = data.metadata
                            }
                            data.item.imageUrl = data.imageUrl
                            data.item.imageServer = data.imageServer
                            this.renderPrimaryAsset(new Asset(data.item[assetIdProperty], this._assets, this._auth, data.item))
                        }, (err) => {
                            console.error(err)
                            this._router.navigate(['/nocontent'])
                        })
                } else {
                    this.renderPrimaryAsset(new Asset(routeParams["assetId"], this._assets, this._auth))

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

        if(this.user && this.user.isLoggedIn){
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
     * Render Asset once its loaded
     */
    renderPrimaryAsset(asset: Asset) {
        this.assets[0] = asset
        asset.isDataLoaded.subscribe(
            (isLoaded) => {
                if (isLoaded) {
                    this._title.setTitle( asset.title );
                    document.querySelector('meta[name="DC.type"]').setAttribute('content', 'Artwork');
                    document.querySelector('meta[name="DC.title"]').setAttribute('content', asset.title);
                    document.querySelector('meta[name="asset.id"]').setAttribute('content', asset.id);
                }
            }, (err) => {
                if (err.status === 403) {
                    // here is where we make the "access denied" modal appear
                    if (!this.hasExternalAccess) {
                        this.showAccessDeniedModal = true
                    }   
                } else {
                    // don't have a clue why this would happen, so just log it
                    console.error(err)
                }
            }
        )
        this.angulartics.eventTrack.next({ action:"viewAsset", properties: { category: "asset", label: asset.id }});
        this.generateImgURL();
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
        if (this.assets[0]) {
            for(var i = 0; i < this.prevAssetResults.thumbnails.length; i++){
                if(this.prevAssetResults.thumbnails[i] && this.prevAssetResults.thumbnails[i].objectId == this.assets[0].id){
                    return i;
                }
            }
        }
        return 1;
    }

    private addAssetToIG(): void{
        if (this.user.isLoggedIn) {
            if(this.hasPrivateGroups){
                this.showAddModal = true;
            }
            else{
                this.showCreateGroupModal = true;
            }
        } else{
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
        if (typeof(label) == 'string') {
            return label.toLowerCase().replace(/\s/g,'')
        } else {
            return ''
        }
    }

    /**
     * Some html tags are ruining things:
     * - <wbr> word break opportunities break our link detection
     */
    private cleanFieldValue(value: string): string {
        if (typeof(value) == 'string') {
            return value.replace(/\<wbr\>/g, '').replace(/\<wbr\/\>/g, '')
        } else {
            return ''
        }
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
        let iOSuser: boolean = false;

        this._analytics.directCall('generate_img_link');

        this.showCopyUrl = true;
        input.focus()
        input.select()

        // Determine if on iOS (no copy functionality)
        if( /iPhone|iPad|iPod/i.test(navigator.userAgent) ) {
            iOSuser = true
        }
    
        setTimeout( () => { 
            input.select(); 
            if(document.queryCommandSupported('copy') && !iOSuser){
                document.execCommand('copy', false, null)
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

    private genFilename(title: string, fileExt: string) : string {
        // Returning a filename with a "." is read as having a file extension
        return (title && fileExt) ? title.replace(/\./g,'-') + '.' + fileExt : ''
    }
}
