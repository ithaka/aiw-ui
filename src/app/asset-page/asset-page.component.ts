import { Component, OnInit, OnDestroy, ViewChild, HostListener } from '@angular/core'
import { ActivatedRoute, Params, Router } from '@angular/router'
import { Subscription }   from 'rxjs/Subscription'
import { Locker } from 'angular2-locker'
import { Angulartics2 } from 'angulartics2'
import { ArtstorViewer } from 'artstor-viewer'

// Project Dependencies
import { Asset } from './asset'
import {
    AuthService,
    AssetService,
    AssetSearchService,
    GroupService,
    CollectionTypeHandler,
    LogService
} from './../shared'
import { AnalyticsService } from '../analytics.service'
import { TitleService } from '../shared/title.service'

@Component({
    selector: 'ang-asset-page',
    templateUrl: 'asset-page.component.pug',
    styleUrls: [ './asset-page.component.scss' ]
})
export class AssetPage implements OnInit, OnDestroy {

    @ViewChild(ArtstorViewer) assetViewer: any

    private user: any
    private hasExternalAccess: boolean = false
    private document = document

    // Array to support multiple viewers on the page
    private assets: Asset[] = []
    private assetIds: string[] = []
    private assetIndex: number = 0
    private assetGroupId: string
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
    private showGenerateCitation: boolean = false

    private copyURLStatusMsg: string = ''
    private showCopyUrl: boolean = false
    private generatedImgURL: string = ''
    private generatedViewURL: string = ''
    private generatedFullURL: string = ''
    // Used for agree modal input, changes based on selection
    private downloadUrl: string = ''
    private prevRouteParams: any = []
    private collectionName: string = ''

    private _storage

    private quizMode: boolean = false;
    private quizShuffle: boolean = false;
    private showAssetCaption: boolean = true;

    private assetIdProperty: string = 'artstorid'
    /** Controls the display of the collection type icon */
    private collectionType: {name: string, alt: string} = {name: '', alt: ''}

    private collectionTypeHandler: CollectionTypeHandler = new CollectionTypeHandler()
    
    // To keep a track of browse direction ('prev' / 'next') while browsing through assets, to load next asset if the current asset is un-authorized
    private browseAssetDirection: string = '' 

    private pagination: {
        totalPages: number,
        size: number,
        page: number
    } = {
      totalPages: 1,
      size: 24,
      page: 1
    };
    private originPage: number = 0;

    constructor(
        private _assets: AssetService,
        private _search: AssetSearchService,
        private _group: GroupService,
        private _auth: AuthService,
        private _log: LogService,
        private route: ActivatedRoute,
        private _router: Router,
        private locker: Locker,
        private _analytics: AnalyticsService,
        private angulartics: Angulartics2,
        private _title: TitleService
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
                // this.assets = []
                let assetIdProperty = this._auth.featureFlags[routeParams['featureFlag']]? 'artstorid' : 'objectId'
                this.assetGroupId = routeParams['groupId']
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
                            // this.renderPrimaryAsset(new Asset(data.item[assetIdProperty], this._assets, this._auth, data.item, this.assetGroupId))
                            this.assetIds[0] = data.item[assetIdProperty]
                        }, (err) => {
                            console.error(err)
                            if (err.status == 403) {
                                // User does not have access
                                this.showAccessDeniedModal = true
                            } else {
                                // Asset does not exist
                                this._router.navigate(['/nocontent'])
                            }
                        })
                } else {
                    // this.renderPrimaryAsset(new Asset(routeParams["assetId"], this._assets, this._auth, null, this.assetGroupId))
                    this.assetIds[0] = routeParams["assetId"]

                    if(this.prevAssetResults.thumbnails.length > 0){
                        // this.totalAssetCount = this.prevAssetResults.count ? this.prevAssetResults.count : this.prevAssetResults.thumbnails.length;
                        this.assetIndex = this.currentAssetIndex();
                        this.assetNumber = this._assets.currentLoadedParams.page ? this.assetIndex + 1 + ((this._assets.currentLoadedParams.page - 1) * this._assets.currentLoadedParams.size) : this.assetIndex + 1;
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
                  // Set asset id property to reference
                this.assetIdProperty = (allResults.thumbnails[0] && allResults.thumbnails[0].objectId) ? 'objectId' : 'artstorid'

                  this.prevAssetResults.thumbnails = allResults.thumbnails;
                  if(this.loadArrayFirstAsset){
                      this.loadArrayFirstAsset = false;
                      if((this.prevAssetResults) && (this.prevAssetResults.thumbnails.length > 0)){
                          this._router.navigate(['/asset', this.prevAssetResults.thumbnails[0][this.assetIdProperty]]);
                      }
                  }
                  else if(this.loadArrayLastAsset){
                      this.loadArrayLastAsset = false;
                      if((this.prevAssetResults.thumbnails) && (this.prevAssetResults.thumbnails.length > 0)){
                          this._router.navigate(['/asset', this.prevAssetResults.thumbnails[this.prevAssetResults.thumbnails.length - 1][this.assetIdProperty]]);
                      }
                  }
                  else{
                    // this.totalAssetCount = this.prevAssetResults.count ? this.prevAssetResults.count : this.prevAssetResults.thumbnails.length;
                    this.assetIndex = this.currentAssetIndex();
                    this.assetNumber = this._assets.currentLoadedParams.page ? this.assetIndex + 1 + ((this._assets.currentLoadedParams.page - 1) * this._assets.currentLoadedParams.size) : this.assetIndex + 1;
                  }
              }
          })
        );

        // Subscribe to pagination values
        this.subscriptions.push(
          this._assets.pagination.subscribe((pagination: any) => {
            this.pagination.page = parseInt(pagination.page);
            this.pagination.size = parseInt(pagination.size);
            if (this.originPage < 1) {
              this.originPage = this.pagination.page;
            }

            if (this.totalAssetCount) {
              this.pagination.totalPages = Math.floor((this.totalAssetCount + this.pagination.size - 1) / this.pagination.size);
            } else {
              this.pagination.totalPages = parseInt(pagination.totalPages);
            }
            // Page size can't be altered in the asset drawer, and we don't want to exceed 1500 assets
            if (this.pagination.totalPages > 63) {
                this.pagination.totalPages = 63
            }
          })
        );

        this._assets.unAuthorizedAsset.subscribe( (value) => {
            if(value){
                this.showAccessDeniedModal = true
            }
        })

        this._analytics.setPageValues('asset', this.assets[0] && this.assets[0].id)
    } // OnInit

    ngOnDestroy() {
        this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
    }

    private handleSkipAsset(): void{
        if( this.browseAssetDirection === 'prev' ) {
            this.showPrevAsset()
        }
        else if ( this.browseAssetDirection === 'next' ){
            this.showNextAsset()
        }

        // Close the modal after handling skip asset
        this.showAccessDeniedModal = false
    }

    // Determines if the asset can be skipped to the prev / next asset in the array, if the current asset is unauthorized
    private isAssetSkipable(): boolean{
        let skipable: boolean = false
        if( (this.browseAssetDirection === 'prev') && (this.assetNumber > 1) ){
            skipable = true
        }
        else if( (this.browseAssetDirection === 'next') && (this.assetNumber < this.totalAssetCount) ){
            skipable = true
        }
        return skipable
    }


    handleLoadedMetadata(asset: Asset, assetIndex: number) {
        if (asset && asset['error']) {
            let err = asset['error']
            if (err.status === 403) {
                // here is where we make the "access denied" modal appear
                if (!this.hasExternalAccess) {
                    this.showAccessDeniedModal = true
                }
            } else {
                // don't have a clue why this would happen, so just log it
                console.error(err)
                // WORKAROUND: We are getting 500s for denied access to institional assets
                if (!this.hasExternalAccess && err.message == "Unable to load metadata!") {
                    this.showAccessDeniedModal = true
                }
            }
        } else {
            this.assets[assetIndex] = asset
            if (assetIndex == 0) {
                this._title.setTitle( asset.title );
                document.querySelector('meta[name="DC.type"]').setAttribute('content', 'Artwork');
                document.querySelector('meta[name="DC.title"]').setAttribute('content', asset.title);
                document.querySelector('meta[name="asset.id"]').setAttribute('content', asset.id);
                let currentAssetId: string = this.assets[0].id || this.assets[0]['objectId'] // couldn't trust the 'this.assetIdProperty' variable
                this.setCollectionType(currentAssetId)
                this.generateImgURL();
            }
        }
        // Set download link
        this.setDownloadFull()
    }

    /**
     * Maintains the isFullscreen variable, as set by child AssetViewers
     */
    updateFullscreenVar(isFullscreen: boolean): void {
        if (!isFullscreen) {
            this.showAssetDrawer = false
            if (this.originPage > 0 && this.pagination.page !== this.originPage) {
              this.pagination.page = this.originPage
              this._assets.loadAssetPage(this.pagination.page)
            }
            this.assets.splice(1)
            this.assetIds.splice(1)
        }
        this.isFullscreen = isFullscreen
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
        let assetIndex: number = 1
        if (this.assetIds[0]) {
            for(var i = 0; i < this.prevAssetResults.thumbnails.length; i++){
                // Select the thumbnail if its arstor_id is in assetIds
                if( this.assetIds.indexOf( this.prevAssetResults.thumbnails[i][this.assetIdProperty] ) > -1 ){
                    this.prevAssetResults.thumbnails[i].selected = true
                    assetIndex = i
                }
                else{
                    this.prevAssetResults.thumbnails[i].selected = false
                }
            }
        }
        return assetIndex
    }

    private addAssetToIG(): void{

        if(this.user && this.user.isLoggedIn){
            // Check if the logged-in user has private image groups
            this._group.getAll('private')
                        .take(1)
                        .subscribe((res) => {
                            if (res.groups && (res.groups.length > 0)) {
                                this.showAddModal = true;
                            } else{
                                this.showCreateGroupModal = true;
                            }
                        }, (err) => { console.error(err); });
        } else{
            this.showLoginModal = true;
        }
    }

    private showPrevAsset(): void{
        if(this.assetNumber > 1){
            // Update browse direction
            this.browseAssetDirection = 'prev'

            if((this.assetIndex > 0)){
                let prevAssetIndex = this.quizShuffle ? Math.floor(Math.random() * this.prevAssetResults.thumbnails.length) + 0 : this.assetIndex - 1; // Assign random thumbnail index if quiz shuffle is true
                let queryParams = {}
                if (this.assetGroupId) {
                    queryParams["groupId"] = this.assetGroupId
                }
                this._router.navigate(['/asset', this.prevAssetResults.thumbnails[prevAssetIndex][this.assetIdProperty], queryParams]);
            }
            else if(this.assetIndex == 0){
                this.loadArrayLastAsset = true;
                this._assets.loadPrevAssetPage();
            }
        }
    }

    private showNextAsset(): void{
        if(this.assetNumber < this.totalAssetCount){
            // Update browse direction
            this.browseAssetDirection = 'next'

            if((this.prevAssetResults.thumbnails) && (this.assetIndex < (this.prevAssetResults.thumbnails.length - 1))){
                let nextAssetIndex = this.quizShuffle ? Math.floor(Math.random() * this.prevAssetResults.thumbnails.length) + 0 : this.assetIndex + 1; // Assign random thumbnail index if quiz shuffle is true
                let queryParams = {}
                if (this.assetGroupId) {
                    queryParams["groupId"] = this.assetGroupId
                }
                this._router.navigate(['/asset', this.prevAssetResults.thumbnails[nextAssetIndex][this.assetIdProperty], queryParams]);
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
        // ADD or REMOVE to assets and assetIds arrays
        let add = true;
        // Groups/items services use "objectid"
        // Solr search uses "artstorid" — but also has an "id" we should ignore!
        if (!asset.id || asset["artstorid"]) {
            asset.id = asset["artstorid"] || asset["objectId"]
        }
        // remove from assetIds
        let assetIdIndex = this.assetIds.indexOf(asset.id)
        if(assetIdIndex > -1) {
            this.assetIds.splice(assetIdIndex, 1)
            add = false
        }
        // remove from assets
        this.assets.forEach( (viewAsset, i) => {
            if ( [viewAsset.id, viewAsset["artstorid"], viewAsset["objectId"]].indexOf(asset.id) > -1) {
                asset.selected = false;
                this.assets.splice(i, 1);
                add = false;
                // Set 'selected' to 'false' for the asset in asset drawer
                this.prevAssetResults.thumbnails.forEach( (thumbnail, i) => {
                    if (asset.id == thumbnail.id) {
                        thumbnail.selected = false;
                    }
                });
                
                //Once the primary asset (assets[0]) is removed change the URL (navigate) to the new primary asset
                if (i === 0){
                    this._router.navigate( ['/asset',  this.assetIds[0]] );
                }

            }
        })
        if (this.assets.length >= 10) {
            add = false;
            // TO-DO: Show Error message
        }
        if (add == true) {
            asset.selected = true;
            this.assetIds.push(asset[this.assetIdProperty]);
        }

        // log compared assets
        this._log.log({
            eventType: "artstor_image_compare",
            item_id: asset.id,
            additional_fields: {
                compared_assets: this.assetIds,
                action: add ? 'add' : 'remove'
            }
        })
    }

    // Exit Presentation / Fullscreen mode and reset assets comparison array
    private exitPresentationMode(): void{
        
        for(let i = 0; i < this.prevAssetResults.thumbnails.length; i++){
            this.prevAssetResults.thumbnails[i].selected = false;
        }

        this.quizMode = false;
        this.quizShuffle = false;
        this.showAssetCaption = true;

        this.assetViewer.togglePresentationMode();
        this.showAssetDrawer = false;
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

    private toggleQuizMode(): void{
        if(this.quizMode){ // Leave Quiz mode
            this.quizMode = false;
            this.showAssetCaption = true;
        }
        else{ // Enter Quiz mode
            this._log.log({
                eventType: "artstor_quiz_toggle"
            })
            this.quizMode = true;
            this.showAssetCaption = false;
            this.toggleAssetDrawer(false);

            this.assets.splice(1);
            this.assetIds.splice(1);
            for(let i = 0; i < this.prevAssetResults.thumbnails.length; i++){
                this.prevAssetResults.thumbnails[i].selected = false;
            }
        }
    }

    private toggleQuizShuffle(): void{
        if(this.quizShuffle){
            this.quizShuffle = false;
        }
        else{
            this.quizShuffle = true;
            this.showNextAsset();
        }
    }

    private genDownloadViewLink() : void {

        if(this.assets[0].typeName === 'image' && this.assets[0].viewportDimensions.contentSize){
            // Full source image size (max output possible)
            let fullWidth = this.assets[0].viewportDimensions.contentSize.x
            let fullY = this.assets[0].viewportDimensions.contentSize.y
            // Zoom is a factor of the image's full width
            let zoom = this.assets[0].viewportDimensions.zoom;
            // Viewport dimensions (size of cropped image)
            let viewX = this.assets[0].viewportDimensions.containerSize.x
            let viewY = this.assets[0].viewportDimensions.containerSize.y
            // Dimensions of the source size of the cropped image
            let zoomX = Math.floor(fullWidth/zoom)
            let zoomY = Math.floor( zoomX * (viewY/viewX))
            // Make sure zoom area is not larger than source, or else error
            if (zoomX > fullWidth) {
                zoomX = fullWidth;
            }
            if (zoomY > fullY) {
                zoomY = fullY;
            }
            // Positioning of the viewport's crop
            let xOffset = Math.floor((this.assets[0].viewportDimensions.center.x * fullWidth) - (zoomX/2));
            let yOffset = Math.floor((this.assets[0].viewportDimensions.center.y * fullWidth) - (zoomY/2));

            this.generatedViewURL = this.assets[0].tileSource.replace('info.json','') + xOffset +','+yOffset+','+zoomX+','+zoomY+'/'+viewX+','+viewY+'/0/native.jpg'
        }
    }

    /**
     * Load next set of thumbnails for compare mode
     * @param newPage number of desired page
     */
    private goToPage(newPage: number) {
      // The requested page should be within the limits (i.e 1 to totalPages)
      if( (newPage >= 1) ){
        this._assets.paginated = true;
        this.pagination.page = newPage;
        this._assets.loadAssetPage(this.pagination.page);
      }
    }

    /** this.showAssetDrawer = !this.showAssetDrawer;
    /**
     * Provides "setter" for toggling asset drawer visual
     * @param show true if you want to show the asset drawer
     */
    private toggleAssetDrawer(show: boolean) {
        this.showAssetDrawer = show
    }

    /**
     * Set full image download url
     */
    setDownloadFull() : void {
        let url = this.assets[0] ? this.assets[0].downloadLink : "";
        if (this.assetGroupId) {
            // Group id needs to be passed to allow download for images accessed via groups
            // - Binder prefers lowercase service url params
            url = url + "&groupid=" + this.assetGroupId
        }
        this.generatedFullURL = url
    }

    /**
     * Function called if not yet agreed to download image
     * - sets url used by agree modal
     */
    setDownloadImage() : void {
        this.downloadUrl = this.generatedFullURL;
        this.showAgreeModal = true;
    }

    /**
     * Function called if not yet agreed to download image view
     * - sets url used by agree modal
     */
    setDownloadView() : void {
        this.downloadUrl = this.generatedViewURL;
        this.showAgreeModal = true;
    }

    trackDownloadImage() : void {
        // Track download
        this._analytics.directCall('download_image');
        this.angulartics.eventTrack.next({ action:"downloadAsset", properties: { category: "asset", label: this.assets[0].id }});
    }

    trackDownloadView() : void {
        // Track download view
        this._log.log({
            eventType: "artstor_image_download_view",
            item_id: this.assets[0].id
        })
        this._analytics.directCall('download_view');
        this.angulartics.eventTrack.next({ action:"downloadView", properties: { category: "asset", label: this.assets[0].id }});
    }

    /**
     * Function called when keyboard key is pressed
     * allows user to go to previous/next asset in group or search
     */
    @HostListener('document:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
      let key = event.keyCode;
      // Make sure not comparing images
      if(this.assets.length === 1) {
        // Left -> Previous
        if(key === 37 && this.assetNumber > 1) {
          this.showPrevAsset();
        }
        // Right -> Next
        else if(key === 39 && this.assetNumber < this.totalAssetCount) {
          this.showNextAsset();
        }
      }
    }

    /**
     * Used to set the collection type, which controls display of the collection type icon
     *  Eventually we should get the entire asset like this, instead of through the metadata call
     * @param assetId the asset's id assigned by artstor
     */
    private setCollectionType(assetId: string): void {
        this._search.getAssetById(assetId)
            .take(1)
            .subscribe((asset) => {
                let contributinginstitutionid: number = asset.contributinginstitutionid 
                this.collectionType = this.collectionTypeHandler.getCollectionType(asset.collectiontypes, contributinginstitutionid)
            }, (err) => {
                console.error(err)
            })
    }
}
