import { Component, OnInit, OnDestroy, ViewChild, HostListener, ElementRef } from '@angular/core'
import { ActivatedRoute, Params, Router } from '@angular/router'
import { DomSanitizer, SafeUrl, Meta } from '@angular/platform-browser'
import { Subscription } from 'rxjs'
import { map, take } from 'rxjs/operators'
import { Angulartics2 } from 'angulartics2'
import { ArtstorViewerComponent } from './artstor-viewer/artstor-viewer.component'
import { formGroupNameProvider } from '@angular/forms/src/directives/reactive_directives/form_group_name'
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms'

// Project Dependencies
import { Asset } from '../shared'
import {
    AuthService,
    AssetService,
    AssetSearchService,
    GroupService,
    CollectionTypeHandler,
    LogService,
    PersonalCollectionService,
    AssetDetailsFormValue,
    CollectionTypeInfo,
    FlagService,
    DomUtilityService,
} from './../shared'
import { TitleService } from '../shared/title.service'
import { ScriptService } from '../shared/script.service'
import { LocalPCService, LocalPCAsset } from '../_local-pc-asset.service'
import { APP_CONST } from '../app.constants'
import { AppConfig } from '../app.service'
import { ArtstorStorageService } from '../../../projects/artstor-storage/src/public_api';
import { MetadataService } from 'app/_services';
import { rights } from './rights.ts'

@Component({
    selector: 'ang-asset-page',
    templateUrl: 'asset-page.component.pug',
    styleUrls: ['./asset-page.component.scss']
})
export class AssetPage implements OnInit, OnDestroy {

    @ViewChild(ArtstorViewerComponent) public assetViewer

  @ViewChild("copyUrlInput", {read: ElementRef}) generatedImgURLElement: ElementRef



    public user: any
    public userSessionFresh: boolean = false
    public assetIds: string[] = []

    // Whether user accepted download terms
    public acceptedTerms: boolean = false

    /** controls whether or not the modals are visible */
    public showAgreeModal: boolean = false
    public showLoginModal: boolean = false
    public showAddModal: boolean = false
    public showCreateGroupModal: boolean = false
    public showAccessDeniedModal: boolean = false
    public showServerErrorModal: boolean = false
    public showGenerateCitation: boolean = false
    public downloadViewReady: boolean = false
    public showExitEdit: boolean = false
    public showDeletePCModal: boolean = false

    // Rights Statements values
    public rightsText: string = ''
    public rightsLink: string = ''
    public rightsImg: string = ''

    // Toast Variables
    public showToast: boolean = false
    public toastType: string = ''
    public toastHTML: string = ''

    // Variables related to how we call for metadata
    public assetIdProperty: string = 'artstorid'
    public fromOpenLibrary: boolean = false

    // Feature Flags
    public relatedResFlag: boolean = false
    public detailViewsFlag: boolean = false
    private encryptedAccess: boolean = false
    private document = document
    private URL = URL
    private navigator = navigator

    // Array to support multiple viewers on the page
    private assets: Asset[] = []
    private assetIndex: number = 0
    private assetGroupId: string
    private assetNumber: number = 1
    private totalAssetCount: number = 1
    private subscriptions: Subscription[] = []
    private prevAssetResults: any = { thumbnails: [] }
    private loadArrayFirstAsset: boolean = false
    private loadArrayLastAsset: boolean = false
    private isFullscreen: boolean = false
    private showAssetDrawer: boolean = false

    // MS IE/Edge for Download View
    private isMSAgent: boolean = false

    // Keep track of the restricted assets count from previous result set, to accurately navigate through available assets
    private restrictedAssetsCount: number = 0
    private showMetadataPending: boolean = false
    private showMetadataError: boolean = false

    private copyURLStatusMsg: string = ''
    private showCopyUrl: boolean = false
    private showEditDetails: boolean = false
    private generatedImgURL: string = ''
    private generatedBlobURL: SafeUrl | string = '' // A Blob File
    private downloadViewLink: string = '' // IIIF View Link
    private generatedFullURL: string = ''
    // Used for agree modal input, changes based on selection
    private downloadUrl: any
    private downloadName: string
    // Used for generated view blob url
    private blobURL: string = ''
    private prevRouteParams: any = []

    private quizMode: boolean = false;
    private quizShuffle: boolean = false;
    private showAssetCaption: boolean = true;

    /**
     *  Collection Variables
     *  - Specific to the first asset, this.assets[0]
    **/
    private collections: any[] = []
    private collectionName: string = ''
    /** Controls the display of the collection type icon */
    private collectionType: CollectionTypeInfo = { name: '', alt: '', badgeText: '', type: 0 }

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

    private relatedResultsQuery: string = ''
    private jstorResults: any[] = []
    private selectedJstorResult: any = {}

    private editDetailsForm: FormGroup
    private editDetailsFormSubmitted: boolean = false // Set to true once the edit details form is submitted
    private isProcessing: boolean = false // controls loading class on delete button
    private deleteLoading: boolean = false
    private downloadLoading: boolean = false

    private prevRouteTS: string = '' // Used to track the (Timestamp) key for previous route params in session storage

    private uiMessages: {
        deleteFailure?: boolean,
        saveFailure?: boolean
    } = {}

    // Flag for multiview items, true if the asset contains multiview items
    private multiviewItems: boolean = false

    // Flag for show/hide page tooltip
    private showPageToolTip: boolean = false

    constructor(
        public _appConfig: AppConfig,
        private _assets: AssetService,
        private _metadata: MetadataService,
        private _auth: AuthService,
        private _search: AssetSearchService,
        private _flags: FlagService,
        private _group: GroupService,
        private _pcservice: PersonalCollectionService,
        private _localPC: LocalPCService,
        private _log: LogService,
        private route: ActivatedRoute,
        private _router: Router,
        private angulartics: Angulartics2,
        private _title: TitleService,
        private scriptService: ScriptService,
        private _sanitizer: DomSanitizer,
        _fb: FormBuilder,
        private _storage: ArtstorStorageService,
        private _dom: DomUtilityService,
        private meta: Meta,
    ) {
        this.editDetailsForm = _fb.group({
            creator: [null],
            title: [null, Validators.required],
            work_type: [null],
            date: [null],
            location: [null],
            material: [null],
            description: [null],
            subject: [null]
        })

        // console.log("CONSTRUCT ASSET PAGE")
    }

    ngOnInit() {
        this.user = this._auth.getUser();

        // sets up subscription to allResults, which is the service providing thumbnails
        this.subscriptions.push(
            this._auth.currentUser.subscribe((user) => {
                // console.log("User subscription returned")
                this.user = user
                // userSessionFresh: Do not attempt to load asset until we know user object is fresh
                // if (!this.userSessionFresh && this._auth.userSessionFresh) {
                    this.userSessionFresh = true
                // }
            }),
            this._assets.allResults.subscribe((allResults) => {
                // console.log("allResults subscription returned")
                if (allResults.thumbnails) {
                    // Set asset id property to reference
                    this.assetIdProperty = (allResults.thumbnails[0] && allResults.thumbnails[0].objectId) ? 'objectId' : 'artstorid'

                    this.prevAssetResults.thumbnails = allResults.thumbnails
                    this.restrictedAssetsCount = allResults.restricted_thumbnails.length
                    if (this.loadArrayFirstAsset) {
                        this.loadArrayFirstAsset = false;
                        if ((this.prevAssetResults) && (this.prevAssetResults.thumbnails.length > 0)) {
                            /***
                             * If current asset is not present in prevAssetResults page,
                             * load next asset page and evaluate current asset index
                             */
                            this.assetIndex = this.currentAssetIndex();
                            this.assetNumber = this._assets.currentLoadedParams.page ? this.assetIndex + 1 + ((this._assets.currentLoadedParams.page - 1) * this._assets.currentLoadedParams.size) : this.assetIndex + 1;

                            let queryParams = {}
                            if (this.prevRouteTS) {
                                queryParams['prevRouteTS'] = this.prevRouteTS
                            }
                            if (this.assetGroupId) {
                                queryParams['groupId'] = this.assetGroupId
                            }
                            this._router.navigate(['/asset', this.prevAssetResults.thumbnails[0][this.assetIdProperty], queryParams]);
                        }
                    }
                    else if (this.loadArrayLastAsset) {
                        this.loadArrayLastAsset = false;
                        if ((this.prevAssetResults.thumbnails) && (this.prevAssetResults.thumbnails.length > 0)) {
                            /***
                             * If current asset is not present in prevAssetResults page,
                             * load previous asset page and evaluate current asset index
                             */
                            this.assetIndex = this.currentAssetIndex();
                            this.assetNumber = this._assets.currentLoadedParams.page ? this.assetIndex + 1 + ((this._assets.currentLoadedParams.page - 1) * this._assets.currentLoadedParams.size) : this.assetIndex + 1;

                            let queryParams = {}
                            if (this.prevRouteTS) {
                                queryParams['prevRouteTS'] = this.prevRouteTS
                            }
                            if (this.assetGroupId) {
                                queryParams['groupId'] = this.assetGroupId
                            }
                            this._router.navigate(['/asset', this.prevAssetResults.thumbnails[this.prevAssetResults.thumbnails.length - 1][this.assetIdProperty], queryParams]);
                        }
                    }
                    else {
                        // this.totalAssetCount = this.prevAssetResults.count ? this.prevAssetResults.count : this.prevAssetResults.thumbnails.length;
                        this.assetIndex = this.currentAssetIndex();
                        this.assetNumber = this._assets.currentLoadedParams.page ? this.assetIndex + 1 + ((this._assets.currentLoadedParams.page - 1) * this._assets.currentLoadedParams.size) : this.assetIndex + 1;
                    }
                }
            })
        );

        this.subscriptions.push(
            this.route.params.subscribe((routeParams) => {
                this.assetGroupId = routeParams['groupId']
                // Find feature flags
                if (routeParams && routeParams['featureFlag']) {
                    this._flags[routeParams['featureFlag']] = true
                    this.relatedResFlag = this._flags['related-res-hack'] ? true : false
                } else {
                    this.relatedResFlag = false
                }

                if (routeParams['encryptedId']) {
                    this.encryptedAccess = true
                    this.assetIds[0] = routeParams['encryptedId']
                } else if (routeParams['openLibId']) {
                    this.fromOpenLibrary = true
                    this.assetIds[0] = routeParams['openLibId']
                } else if ( routeParams['encryptedOpenLibId']) {
                    this.fromOpenLibrary = true
                    this.encryptedAccess = true
                    this.assetIds[0] = routeParams['encryptedOpenLibId']
                } else {
                    this.assetIds[0] = routeParams['assetId']

                    if (this.prevAssetResults.thumbnails.length > 0) {
                        let currentAssetIndex = this.currentAssetIndex();
                        if (currentAssetIndex === -1){
                            if ( this.assetIndex % 24 === 0 ) { // Browser back button pressed
                                this._assets.loadPrevAssetPage();
                            } else { // Browser next button pressed
                                this._assets.loadNextAssetPage();
                            }
                        } else {
                            this.assetIndex = currentAssetIndex;
                            this.assetNumber = this._assets.currentLoadedParams.page ? this.assetIndex + 1 + ((this._assets.currentLoadedParams.page - 1) * this._assets.currentLoadedParams.size) : this.assetIndex + 1;
                        }
                    }
                }

                // Set image share link
                this.generateImgURL(this.assetIds[0], this.encryptedAccess || this.fromOpenLibrary)

                // For "Back to Results" link and pagination, look for prevRouteTS to set prevRouteParams
                if (routeParams['prevRouteTS']) {
                    this.prevRouteTS = routeParams['prevRouteTS']
                    // For "Go Back to Results"
                    // Get map of previous search params
                    let prevRoutesMap = this._storage.getSession('prevRouteParams')
                    // Reference previous search params for the prevRouteTS
                    let prevRouteParams = prevRoutesMap ? prevRoutesMap[this.prevRouteTS] : {}

                    // Set previous route params if available, showing "Back to Results" link
                    if (prevRoutesMap && prevRouteParams && (prevRouteParams.length > 0)) {
                        this.prevRouteParams = prevRouteParams
                    }
                    // TotalAssets - for browsing between the assets
                    let totalAssets = this._storage.getSession('totalAssets');
                    if (totalAssets) {
                        this.totalAssetCount = parseInt(totalAssets);
                    }
                    else {
                        this.totalAssetCount = 1
                    }
                }
                // If I go to the asset by replacing the url without opening a new tab, do not show the "Go Back to Results" link and pagination link
                else {
                    this.prevRouteParams = []
                    this.totalAssetCount = 1
                    this.assetNumber = 1
                }
            })
        );

        // Get latest set of results with at least one asset
        this.prevAssetResults = this._assets.getRecentResults()

        // Subscribe to pagination values
        this.subscriptions.push(
            this._assets.pagination.subscribe((pagination) => {
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
                // Page size can't be altered in the asset drawer, endpoint response is limited to 5000
                let maxPageCount = Math.ceil(APP_CONST.MAX_RESULTS / this.pagination.size)
                if (this.pagination.totalPages > maxPageCount) {
                    this.pagination.totalPages = maxPageCount
                }
            })
        );

        this._assets.unAuthorizedAsset.subscribe((value) => {
            if (value) {
                this.showAccessDeniedModal = true
            }
        })

        // MS Browser Agent ?
        this.isMSAgent = this.navigator.msSaveOrOpenBlob !== undefined

      // Load Ethnio survey
      // if (this._appConfig.config.siteID !== 'SAHARA') {
      //   this.scriptService.loadScript('ethnio-survey')
      // }

    } // OnInit

    ngOnDestroy() {
        this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
    }


    handleLoadedMetadata(asset: Asset, assetIndex: number) {
        // console.log("Handle loaded metadata for " + asset['objectId'])
        // Reset modals if new data comes in
        this.showAccessDeniedModal = false
        this.showServerErrorModal = false

        if (asset && asset['error']) {
            let err = asset['error']
            if (err.status === 403 || err.message == 'Unable to load metadata!') {
                // here is where we make the "access denied" modal appear
                if (!this.encryptedAccess) {
                    this.showAccessDeniedModal = true
                } else {
                    console.error('Failed to load externally shared asset', err)
                    this.showServerErrorModal = true
                }
            } else if (err.status === 401) {
                // Should be handled by the 401 interceptor
            } else {
                // Something must have gone quite wrong, presumably a server error
                console.error(err)
                this.showServerErrorModal = true
            }
        } else {
            if(!this.assets) {
                this.assets = []
            }
            this.assets[assetIndex] = asset
            if (assetIndex == 0) {
                let tileSource: any = asset.tileSource
                this.multiviewItems =  Array.isArray(tileSource) ? true : false
                this._title.setTitle(asset.title)
                this.meta.updateTag({name: 'DC.type', content: 'Artwork'})
                this.meta.updateTag({name: 'DC.title', content: asset.title})
                // this.meta.updateTag({name: 'asset.id"', content: asset.id})
                let currentAssetId: string = this.assets[0].id || this.assets[0]['objectId'] // couldn't trust the 'this.assetIdProperty' variable
                // Search returns a 401 if /userinfo has not yet set cookies
                if (Object.keys(this._auth.getUser()).length !== 0) {
                    // pass collectiontypeIds from asset.collections to getCollectionType function as an array of number
                    let collectiontypeIds: number[] = []
                    asset.collections.forEach((collection) => {
                        collectiontypeIds.push(Number(collection.type))
                    })
                    this.collectionType = CollectionTypeHandler.getCollectionType(collectiontypeIds, asset.contributinginstitutionid)
                }

                // only log the event if the asset came from search, and therefore has an artstorid
                if (this.assets[0]['id']) {
                    // log the event connecting the search to the asset clicked
                    this._log.log({
                        eventType: 'artstor_item_view',
                        referring_requestid: this._search.latestSearchRequestId,
                        item_id: this.assets[0]['id']
                    })
                }

                // Split existing collection urls in the metadata so that urls can be linked separately
                if (this.assets[assetIndex].formattedMetadata['Collection'] && this.assets[assetIndex].formattedMetadata['Collection'].join().indexOf('<br/>') > -1) {
                    let collections = this.assets[0].formattedMetadata['Collection']
                    let splitValues = []
                    for (let i = 0; i < collections.length; i++){
                        splitValues = splitValues.concat( collections[i].split('<br/>') )
                    }
                    this.assets[0].formattedMetadata['Collection'] = splitValues
                }

                // Load related results from jstor
                if (this.relatedResFlag) {
                    this.getJstorRelatedResults(asset)
                }

                // Update OGP meta tags
                this.meta.updateTag({ property: 'og:title', content: asset.title }, 'property="og:title"')
                this.meta.updateTag({ property: 'og:description', content: asset.formattedMetadata['Description'] && asset.formattedMetadata['Description'][0] ? asset.formattedMetadata['Description'][0] : '' }, 'property="og:description"')
                this.meta.updateTag({ property: 'og:url', content: this._assets.getShareLink(asset.id) }, 'property="og:url"')
                this.meta.updateTag({ property: 'og:image', content: asset.thumbnail_url ? 'https:' + asset.thumbnail_url : '' }, 'property="og:image"')
            }
            // Assign collections array for this asset. Provided in metadata
            this.collections = asset.collections
            this.updateMetadataFromLocal(this._localPC.getAsset(parseInt(this.assets[0].SSID)))
        }
        // Set download link
        this.setDownloadFull()

        if (this.assets[0] && this.assets[0].formattedMetadata && this.assets[0].formattedMetadata.Rights) {
            // Loop over Rights fields and set rights statement values via isRightStatement
            for (let i = 0; i < this.assets[0].formattedMetadata.Rights.length; i++) {
                let rightsField = this.assets[0].formattedMetadata.Rights[i]
                this.isRightStatement(rightsField)
            }
        }
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
            // Reduce number of loaded assets to one
            this.assets = [this.assets[0]]
            this.assetIds = [this.assetIds[0]]
        } else if (Array.isArray(this.assets[0].tileSource)){ // Log GA event for opening a multi view item in Fullscreen
            this.angulartics.eventTrack.next({ action: 'multiViewItemFullscreen', properties: { category: this._auth.getGACategory(), label: this.assets[0].id } });
        }
        else {
            // Make sure we only send one ga event when going to fullscreen mode
            if (this.isFullscreen !== isFullscreen) {
                // Add Google Analytics tracking to "fullscreen" button
                this.angulartics.eventTrack.next({ action: 'Enter Fullscreen', properties: { label: this.assetIds[0] } })
            }
        }
        this.isFullscreen = isFullscreen

    }

    /**
     * Set full image download url
     */
    setDownloadFull(): void {
        let url = this.assets[0] ? this.assets[0].downloadLink : '';
        if (this.assetGroupId && url.indexOf("/media/") === -1 ) {
            // Group id needs to be passed to allow download for images accessed via groups
            // - Binder prefers lowercase service url params
            url = url + '&groupid=' + this.assetGroupId
        }
        this.generatedFullURL = url
    }

    /**
     * Function called if not yet agreed to download image
     * - sets url used by agree modal
     */
    setDownloadImage(): void {
        this.downloadUrl = this.generatedFullURL
        this.showAgreeModal = true
        this.downloadName = 'download'
    }

    /**
     * Function called if not yet agreed to download image view
     * - sets url used by agree modal
     */
    setDownloadView(): void {
        this.downloadUrl = this.isMSAgent ? this.downloadViewLink : this.generatedBlobURL
        this.showAgreeModal = true
        this.downloadName = 'download.jpg'
    }

    // Track download file
    trackDownloadImage(): void {
        this.angulartics.eventTrack.next({ action: 'downloadAsset', properties: { category: this._auth.getGACategory(), label: this.assets[0].id } });
    }

    // Track download view
    trackDownloadView(): void {
        this._log.log({
            eventType: 'artstor_image_download_view',
            item_id: this.assets[0].id
        })
        this.angulartics.eventTrack.next({ action: 'downloadView', properties: { category: this._auth.getGACategory(), label: this.assets[0].id } });
    }

    // Track metadata collection link click
    trackCollectionLink(collectionName: string): void {
      this.angulartics.eventTrack.next({ action: 'metadata_collection_link', properties: { category: this._auth.getGACategory(), label: collectionName } });
    }

    /**
     * Function called when keyboard key is pressed
     * allows user to go to previous/next asset in group or search
     */
    @HostListener('document:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        let key = event.keyCode;
        // Make sure not comparing images
        if (this.assets.length === 1) {
            // Left -> Previous
            if (key === 37 && this.assetNumber > 1) {
                this.showPrevAsset();
            }
            // Right -> Next
            else if (key === 39 && this.assetNumber < this.totalAssetCount) {
                this.showNextAsset();
            }
        }
    }

    /**
     * Get link to IAP Form
     * - Generate url with Query params for requesting IAP
     * @param asset Asset for which the user is requesting IAP
     * @returns string Request IAP form url with query params
     */
    getIapFormUrl(asset: Asset): string {
        let baseUrl = 'http://www.artstor.org/form/iap-request-form'
        let name = asset.title
        let collection = asset.formattedMetadata['Collection'] && asset.formattedMetadata['Collection'][0] ? asset.formattedMetadata['Collection'][0] : ''
        let id = asset.id
        let email = this.user.username
        let ssid = asset.SSID
        return baseUrl + '?name=' + name + '&collectionName=' + collection + '&id=' + id + '&email=' + email + '&ssid=' + ssid
    }

    /**
     * Get link to Error Form
     * - Generate url with Query params for reporting asset error
     * @param asset Asset for which the user is reporting an error
     * @returns string Error form url with query params
     */
    getErrorFormUrl(asset: Asset): string {
        let baseUrl = 'http://www.artstor.org/form/report-error'
        let collection = asset.formattedMetadata['Collection'] && asset.formattedMetadata['Collection'][0] ? asset.formattedMetadata['Collection'][0] : ''
        let id = asset.id
        let email = this.user.username
        let title = asset.title
        let creator = asset.creator
        let repo = (asset.formattedMetadata['Repository'] && asset.formattedMetadata['Repository'][0]) || ''
        let fileName = asset.fileName
        let ssid = asset.SSID
        return baseUrl + '?collectionName=' + collection + '&id=' + id + '&email=' + email + '&title=' + title + '&creator=' + creator + '&fileName=' + fileName + '&ssid=' + ssid + '&repository=' + repo
    }

    /**
     * Sets collection id for the Collection href
     * A collection may be private, institutional, or public.
     * If both institional(2) and public(5), we set the link to the public collection id.
     */
    setCollectionLink(asset: Asset): any[] {
        let link = []

        // 103 Collection Id routes to /category/<categoryId>, some of the collections have collectionId of NaN, check the id in the collections array instead
        if (String(asset.collectionId) === '103' || String(asset.collections[0].id) === '103') {
            return ['/category', String(asset.categoryId)]
        }
        else {
            for (let col of this.collections) {
                // Private/Personal Collection
                if (col.type === '6') {
                    return ['/pcollection', col.id]
                }
                // Public Collection
                else if (col.type === '5') {
                    asset.publicDownload = true
                    return ['/collection', col.id]
                }
                else {
                    link = ['/collection', col.id]
                }
            }
        }
        return link
    }

    /**
     * isRightStatement sets rightsLink and rightsImg values and
     * returns boolean if an asset has a rights statement
     * @param rights_text string
     */
    public isRightStatement(rights_text: string): boolean {

      // Handle extra spaces and differences in punctuation in Rights fields
      // by doing uppercase comparison of alphanumeric chars only
      let reg = /[^a-zA-Z0-9]/

      for (let i = 0; i < rights.length; i++) {
        if (rights[i].name.split(reg).join('').toUpperCase() === rights_text.split(reg).join('').toUpperCase()) {
          this.rightsText = rights_text
          this.rightsLink = rights[i].link
          this.rightsImg = rights[i].img
          return true
        }
      }
      return false
    }

    private handleSkipAsset(): void {
        if (this.browseAssetDirection === 'prev') {
            this.showPrevAsset()
        }
        else if (this.browseAssetDirection === 'next') {
            this.showNextAsset()
        }

        // Close the modal after handling skip asset
        this.showAccessDeniedModal = false
    }

    // Determines if the asset can be skipped to the prev / next asset in the array, if the current asset is unauthorized
    private isAssetSkipable(): boolean {
        let skipable: boolean = false
        if ((this.browseAssetDirection === 'prev') && (this.assetNumber > 1)) {
            skipable = true
        }
        else if ((this.browseAssetDirection === 'next') && (this.assetNumber < this.totalAssetCount)) {
            skipable = true
        }
        return skipable
    }

    /**
     * Find out if the user has accepted the agreement during this session
     * @returns boolean which is true if the user has accepted the agreement
     */
    private downloadAuth(): boolean {
        return this._auth.downloadAuthorized();
    }

    // Calculate the index of current asset from the previous assets result set
    private currentAssetIndex(): number {
        let assetIndex: number = 1
        let assetFound = false
        if (this.assetIds[0]) {
            for (let i = 0; i < this.prevAssetResults.thumbnails.length; i++) {
                // Select the thumbnail if its arstor_id is in assetIds
                if (this.assetIds.indexOf(this.prevAssetResults.thumbnails[i][this.assetIdProperty]) > -1) {
                    this.prevAssetResults.thumbnails[i].selected = true
                    assetIndex = i
                    assetFound = true
                }
                else {
                    this.prevAssetResults.thumbnails[i].selected = false
                }
            }
        }
        assetIndex = assetFound ? assetIndex : -1
        return assetIndex
    }

    private addAssetToIG(detailView?: boolean): void {

        if (this.user && this.user.isLoggedIn) {
            if(this.detailViewsFlag) {
                this.assets[0]['detailViewBounds'] = detailView ? this.assetViewer.osdViewer.viewport.getBounds(true) : {}
                this.showAddModal = true

            } else {
                // Check if the logged-in user has private image groups
                this._group.getAll('created').pipe(
                take(1),
                map(res => {
                    if (res.groups && (res.groups.length > 0)) {
                        this.showAddModal = true;
                    } else {
                        this.showCreateGroupModal = true;
                    }
                },
                (err) => { console.error(err); }
                )).subscribe()
            }
        } else {
          this.showLoginModal = true;
        }
    }

    /**
     * Browse to the previous asset in the results, if available
     */
    private showPrevAsset(): void {
        if (this.quizShuffle || (this.assetNumber > 1)) {
            // Update browse direction
            this.browseAssetDirection = 'prev'

            if (this.quizShuffle || (this.assetIndex > 0)) {
                let prevAssetIndex = this.quizShuffle ? Math.floor(Math.random() * this.prevAssetResults.thumbnails.length) + 0 : this.assetIndex - 1; // Assign random thumbnail index if quiz shuffle is true
                let queryParams = {}
                if (this.prevRouteTS) {
                    queryParams['prevRouteTS'] = this.prevRouteTS
                }
                if (this.assetGroupId) {
                    queryParams['groupId'] = this.assetGroupId
                }

                this._router.navigate(['/asset', this.prevAssetResults.thumbnails[prevAssetIndex][this.assetIdProperty], queryParams]);
            }
            else if (this.assetIndex == 0) {
                this.loadArrayLastAsset = true;
                this._assets.loadPrevAssetPage();
            }
        }
    }

    /**
     * Browse to the next asset in the results, if available
     */
    private showNextAsset(): void {
        if (this.quizShuffle || (this.assetNumber < this.totalAssetCount)) {
            // Update browse direction
            this.browseAssetDirection = 'next'

            if ((this.prevAssetResults.thumbnails) && ( this.quizShuffle || ( this.assetIndex < (this.prevAssetResults.thumbnails.length - 1)) )) {
                let nextAssetIndex = this.quizShuffle ? Math.floor(Math.random() * this.prevAssetResults.thumbnails.length) + 0 : this.assetIndex + 1; // Assign random thumbnail index if quiz shuffle is true
                let queryParams = {}
                if (this.prevRouteTS) {
                    queryParams['prevRouteTS'] = this.prevRouteTS
                }
                if (this.assetGroupId) {
                    queryParams['groupId'] = this.assetGroupId
                }

                this._router.navigate(['/asset', this.prevAssetResults.thumbnails[nextAssetIndex][this.assetIdProperty], queryParams]);
            }
            else if ((this.prevAssetResults.thumbnails) && (this.assetIndex == (this.prevAssetResults.thumbnails.length - 1))) {
                this.loadArrayFirstAsset = true;
                this._assets.loadNextAssetPage();
            }
        }
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

    private generateImgURL(assetId: string, external?: boolean): void {
        this.generatedImgURL = this._assets.getShareLink(assetId, external);
    }

    /**
     * Adds a link to the current asset page to the user's clipboard
     * @requires browser
     */
    private copyGeneratedImgURL(): void {

        let statusMsg = '';
        let input: any;
        if (this.generatedImgURLElement && this.generatedImgURLElement.nativeElement){
            input = this.generatedImgURLElement.nativeElement
          }

        let iOSuser: boolean = false;

        this.showCopyUrl = true;
        input.focus()
        input.select()

        // Determine if on iOS (no copy functionality)
        if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
            iOSuser = true
        }

        setTimeout(() => {
            input.select();
            if (document.queryCommandSupported('copy') && !iOSuser) {
                document.execCommand('copy', false, null)
                statusMsg = 'Image URL successfully copied to the clipboard!';
            }
            else {
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
        if (!asset.id || asset['artstorid']) {
            asset.id = asset['artstorid'] || asset['objectId']
        }
        // remove from assetIds
        let assetIdIndex = this.assetIds.indexOf(asset.id)
        if (assetIdIndex > -1) {
            this.assetIds.splice(assetIdIndex, 1)
            add = false
        }
        // remove from assets
        this.assets.forEach((viewAsset, i) => {
            if ([viewAsset.id, viewAsset['artstorid'], viewAsset['objectId']].indexOf(asset.id) > -1) {
                asset.selected = false;
                this.assets.splice(i, 1);
                add = false;
                // Set 'selected' to 'false' for the asset in asset drawer
                this.prevAssetResults.thumbnails.forEach((thumbnail, i) => {
                    if (asset.id == thumbnail.id) {
                        thumbnail.selected = false;
                    }
                });

                // Once the primary asset (assets[0]) is removed change the URL (navigate) to the new primary asset
                if (i === 0) {
                    this._router.navigate(['/asset', this.assetIds[0]]);
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

            // Add GA tracking to select image to compare action
            this.angulartics.eventTrack.next({ action: 'Compare image', properties: { label: this.assetIds.length } })
        }

        // log compared assets
        this._log.log({
            eventType: 'artstor_image_compare',
            item_id: asset.id,
            additional_fields: {
                compared_assets: this.assetIds,
                action: add ? 'add' : 'remove'
            }
        })
    }

    // Exit Presentation / Fullscreen mode and reset assets comparison array
    private exitPresentationMode(): void {

        for (let i = 0; i < this.prevAssetResults.thumbnails.length; i++) {
            this.prevAssetResults.thumbnails[i].selected = false;
        }

        this.quizMode = false;
        this.quizShuffle = false;
        this.showAssetCaption = true;

        this.assetViewer.togglePresentationMode();
        this.showAssetDrawer = false;
    }

    private backToResults(): void {
        if (this.prevRouteParams.length == 1) {
            this._router.navigate(['/' + this.prevRouteParams[0].path, this.prevRouteParams[0].parameters]);
            this.prevRouteParams = [];
        }
        else if (this.prevRouteParams.length == 2) {
            this._router.navigate(['/' + this.prevRouteParams[0].path, this.prevRouteParams[1].path, this.prevRouteParams[1].parameters]);
            this.prevRouteParams = [];
        }
        else if (this.prevRouteParams.length == 3) {
            this._router.navigate(['/' + this.prevRouteParams[0].path, this.prevRouteParams[1].path, this.prevRouteParams[2].path]);
            this.prevRouteParams = [];
        }

    }

    private genFilename(title: string, fileExt: string): string {
        // Returning a filename with a "." is read as having a file extension
        return (title && fileExt) ? title.replace(/\./g, '-') + '.' + fileExt : ''
    }

    private toggleQuizMode(): void {
        if (this.quizMode) { // Leave Quiz mode
            this.quizMode = false;
            this.showAssetCaption = true;
        }
        else { // Enter Quiz mode
            this._log.log({
                eventType: 'artstor_quiz_toggle'
            })
            this.quizMode = true;
            this.showAssetCaption = false;
            this.toggleAssetDrawer(false);

            this.assets.splice(1);
            this.assetIds.splice(1);
            for (let i = 0; i < this.prevAssetResults.thumbnails.length; i++) {
                this.prevAssetResults.thumbnails[i].selected = false;
            }
        }
    }

    private toggleQuizShuffle(): void {
        if (this.quizShuffle) {
            this.quizShuffle = false;
        }
        else {
            this.quizShuffle = true;
            this.showNextAsset();
        }
    }

    /**
     * runDownloadView handles the DownloadView results from AssetSearch.downloadViewBlob
     * @param dlink String from generateDownloadView
     */
    private runDownloadView(dlink: string): Subscription {
      // Download generated jpg as local blob file
      return this._search.downloadViewBlob(dlink).pipe(
        take(1),
        map(blob => {
          if (blob.size > 0) {
            this.blobURL = this.URL.createObjectURL(blob)
            this.generatedBlobURL = this._sanitizer.bypassSecurityTrustUrl(this.blobURL)
            this.downloadViewReady = true
            this.downloadLoading = false
          }},
          (err) => {
            this.downloadLoading = false
            this.downloadViewReady = false
            this.showServerErrorModal = true
          }
        )).subscribe()
    }

    /** Calls downloadViewBlob in AssetSearch service to retrieve blob file,
        and then sets generatedBlobUrl to this local reference. **/

    private genDownloadViewLink() {

        // Do nothing if this is not an image
        if (!this.assets[0].typeName || !this.assets[0].typeName.length) {
            return
        }

        let asset = this.assets[0]
        this.downloadLoading = true // sets to false on success of runDownloadView

        // Revoke the browser reference to a previous blob URL, needs 100ms pause
        if (this.blobURL.length) {
            setTimeout(() => {
              this.URL.revokeObjectURL(this.blobURL)
            }, 100);
        }

        if (asset.typeName === 'image' && asset.viewportDimensions.contentSize) {
            // Full source image size (max output possible)
            let fullWidth = Math.floor(asset.viewportDimensions.contentSize.x)
            let fullY = Math.floor(asset.viewportDimensions.contentSize.y)
            // Zoom is a factor of the image's full width
            let zoom = Math.floor(asset.viewportDimensions.zoom)
            // Viewport dimensions (size of cropped image)
            let viewX = Math.floor(asset.viewportDimensions.containerSize.x)
            let viewY = Math.floor(asset.viewportDimensions.containerSize.y)
            // Dimensions of the source size of the cropped image
            let zoomX = Math.floor(fullWidth / zoom)
            let zoomY = Math.floor(zoomX * (viewY / viewX))
            // Make sure zoom area is not larger than source, or else error
            if (zoomX > fullWidth) {
                zoomX = fullWidth
            }
            if (zoomY > fullY) {
                zoomY = fullY
            }
            // Positioning of the viewport's crop
            let xOffset = Math.floor((asset.viewportDimensions.center.x * fullWidth) - (zoomX / 2))
            let yOffset = Math.floor((asset.viewportDimensions.center.y * fullWidth) - (zoomY / 2))

            // Generate the view url from tilemap service
            this.downloadViewLink = asset.tileSource.replace('info.json', '') + xOffset + ',' + yOffset + ',' + zoomX + ',' + zoomY + '/' + viewX + ',' + viewY + '/0/native.jpg'

            // Disable download view link button until file is ready
            this.downloadViewReady = false

            // Call runDownloadView after 1 sec, downloads local view image blob file to browser
            setTimeout(() => {
              this.runDownloadView(this.downloadViewLink)
            }, 1000);
        }
        else {
            this.downloadLoading = false
        }
    }

    /**
     * Load next set of thumbnails for compare mode
     * @param newPage number of desired page
     */
    private goToPage(newPage: number) {
        // The requested page should be within the limits (i.e 1 to totalPages)
        if ((newPage >= 1)) {
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
        if (Array.isArray(show && this.assets[0].tileSource)){ // Log GA event for comparing a multi view item in Fullscreen mode
            this.angulartics.eventTrack.next({ action: 'multiViewItemCompare', properties: { category: this._auth.getGACategory(), label: this.assets[0].id } });
        }
    }

    /**
     * Controls display indicating asset deletion, makes http call to delete asset and navigates back to My Collection page
     */
    private deleteAsset(): void {
        this.uiMessages = {}

        this.deleteLoading = true
        this._pcservice.deletePersonalAssets([this.assets[0].SSID]).pipe(
          take(1),
          map(res => {
              this.deleteLoading = false
              this._router.navigate(['/pcollection', '37436'], { queryParams: { deleteSuccess: this.assets[0].title } })
          }, (err) => {
              this.deleteLoading = false
              this.uiMessages.deleteFailure = true
          }
        )).subscribe()
    }

    /**
     * Used to get related results from jstor index based on asset title/subject/work_type
     * @param asset Asset to be used for constructing jstor search query
     */
    private getJstorRelatedResults(asset: Asset): void {
        let term = ''
        if (asset.formattedMetadata && asset.formattedMetadata['Title']) {
            term += asset.formattedMetadata['Title'][0]
        }

        if (asset.formattedMetadata && asset.formattedMetadata['Subject']) {
            term += ' AND ' + asset.formattedMetadata['Subject']
        } else if (asset.formattedMetadata && asset.formattedMetadata['Work Type']) {
            term += ' AND ' + asset.formattedMetadata['Work Type']
        }

        this.relatedResultsQuery = term

        this._search.searchJstor(term)
            .subscribe(
                res => {
                    if (res.results) {
                        let resultArray = res.results
                        resultArray = resultArray.length > 4 ? resultArray.slice(0, 4) : resultArray
                        for (let resultObj of resultArray) {
                            let label = ''
                            if (resultObj.title && resultObj.title[0]) {
                                label = resultObj.title[0]
                            }
                            if (resultObj.citation_line) {
                                label += label ? ', ' : ''
                                label += resultObj.citation_line
                            }
                            resultObj.label = label
                        }
                        this.jstorResults = resultArray
                    }
                }
            )
    }

    /**
     * Sets data in the selectedJstorResult Object from the hovered-on jstor result
     * @param resultObject Hovered-on jstor result object
     */
    private setToolTipData(resultObject: any): void {
        let toolTipData: any = {}
        toolTipData.title = resultObject.title && resultObject.title[0] ? resultObject.title[0] : ''
        toolTipData.authors = resultObject.author
        toolTipData.publishers = resultObject.publisher
        toolTipData.doi = resultObject.doi

        this.selectedJstorResult = toolTipData
    }

    /**
     * Called on edit (Asset) details form submission
     */
    private editDetailsFormSubmit(formValue: AssetDetailsFormValue): void {
        this.uiMessages = {}
        this.editDetailsFormSubmitted = true
        if (!this.editDetailsForm.valid) {
            return
        }
        this.isProcessing = true

        // update asset metadata
        this._pcservice.updatepcImageMetadata(formValue, this.assets[0]['SSID'])
            .subscribe(
                data => {
                    if (data.success) {
                        this.isProcessing = false

                        this._localPC.setAsset({
                            ssid: parseInt(this.assets[0].SSID),
                            asset_metadata: formValue
                        })

                        this.closeEditDetails(1)

                        // Reload asset metadata
                        this._router.navigate(['/asset', ''])
                        setTimeout(() => {
                            // Pass the prevRouteTS param to make sure we load prevRouteParams
                            this._router.navigate([ '/asset', this.assets[0].id, this.prevRouteTS ? { prevRouteTS: this.prevRouteTS } : {} ])
                        }, 250)
                    }
                },
                error => {
                    console.error(error)
                    this.isProcessing = false
                    // Show user error message
                    this.uiMessages.saveFailure = true
                }
            );
    }

    /**
     * Preloads the edit details form with the asset mmetadata values and show the form
     */
    private loadEditDetailsForm(): void {
        this.uiMessages = {}
        // see if we have a local copy of the data
        let localData: LocalPCAsset = this._localPC.getAsset(parseInt(this.assets[0].SSID))
        // if we have a copy of the metadata locally, use that
        if (localData) {
            for (let key in localData.asset_metadata) {
                this.editDetailsForm.controls[key].setValue(localData.asset_metadata[key])
            }
            this.showEditDetails = true
            return // cancel out of the rest of the function
        }

        // preload form values
        let metaData = this.assets[0].formattedMetadata
        for (let label in metaData) {
            let value = metaData[label][0]
            switch (label) {
                case 'Creator': {
                    this.editDetailsForm.controls['creator'].setValue(value)
                    break
                }
                case 'Title': {
                    this.editDetailsForm.controls['title'].setValue(value)
                    break
                }
                case 'Work Type': {
                    this.editDetailsForm.controls['work_type'].setValue(value)
                    break
                }
                case 'Date': {
                    this.editDetailsForm.controls['date'].setValue(value)
                    break
                }
                case 'Location': {
                    this.editDetailsForm.controls['location'].setValue(value)
                    break
                }
                case 'Material': {
                    this.editDetailsForm.controls['material'].setValue(value)
                    break
                }
                case 'Description': {
                    this.editDetailsForm.controls['description'].setValue(value)
                    break
                }
                case 'Subject': {
                    this.editDetailsForm.controls['subject'].setValue(value)
                    break
                }
                default: {
                    break
                }
            }
        }

        // Show edit details form
        this.showEditDetails = true
    }

    private updateMetadataFromLocal(localData: LocalPCAsset): void {
        if (!localData) { return } // if we don't have metadata for that asset, we won't run any of the update code
        // Track whether or not server has propagated changes yet
        this.showMetadataPending = false
        for (let key in localData.asset_metadata) {
            let metadataLabel: string = this.mapLocalFieldToLabel(key)
            let fieldValue: string = localData.asset_metadata[key]
            // all objects in formattedMetadata are arrays, but these should all be length 0
            if (fieldValue) {
                if (this.assets[0].formattedMetadata[metadataLabel] && this.assets[0].formattedMetadata[metadataLabel].indexOf(fieldValue) > -1) {
                    // No change
                } else {
                   this.assets[0].formattedMetadata[metadataLabel] = [fieldValue]
                   this.showMetadataPending = true
                }
            }
        }
    }

    /**
     * Maps field name from LocalPCAsset object to the label from formattedMetadata on the asset
     * @param field the field from the LocalPCAsset object for which you want ot set the metadata label value
     */
    private mapLocalFieldToLabel(field: string): string {
        let fieldLabelMap = {
            'creator': 'Creator',
            'title': 'Title',
            'work_type': 'Work Type',
            'date': 'Date',
            'location': 'Location',
            'material': 'Material',
            'description': 'Description',
            'subject': 'Subject'
        }
        return fieldLabelMap[field]
    }

    private closeEditDetails(confirmed: number): void {
        this.uiMessages = {}
        // Hide and reset the edit details form
        if (confirmed === 1) {
            this.showEditDetails = false
            this.editDetailsForm.reset()
        } else {
            // Do nothing
        }
        this.showExitEdit = false
    }

    private closeDeletePC(confirmed: number): void {
        if (confirmed === 1) {
            // Confirmed
            this.deleteAsset()
        } else if (confirmed === 0) {
            // Canceled
            this.showDeletePCModal = false
        }
    }

    /**
     * Add Captain's log event: Print image
     * @param asset to get the asset id and institution id to be logged
     */
    private logPrint(asset: Asset): void {
        this._log.log({
            eventType: 'artstor_print_image',
            item_id: asset.id,
            additional_fields: {
                institutionID: asset.contributinginstitutionid
            }
        })
    }

    private multiViewPageViaArrow(): void{
        if (this.isFullscreen){
            this.angulartics.eventTrack.next({ action: 'multiViewFullscreenPageViaArrow', properties: { category: this._auth.getGACategory(), label: this.assets[0].id } })
        } else{
            this.angulartics.eventTrack.next({ action: 'multiViewPageViaArrow', properties: { category: this._auth.getGACategory(), label: this.assets[0].id } })
        }
    }

    private multiViewPageViaThumbnail(): void{
        if (this.isFullscreen){
            this.angulartics.eventTrack.next({ action: 'multiViewFullscreenPageViaThumbnail', properties: { category: this._auth.getGACategory(), label: this.assets[0].id } })
        } else {
            this.angulartics.eventTrack.next({ action: 'multiViewPageViaThumbnail', properties: { category: this._auth.getGACategory(), label: this.assets[0].id } })
        }
    }

    private closeDropdowns(): void{
        let dropdownElements: Array<HTMLElement> = Array.from( document.querySelectorAll('.btn-row .dropdown') )
        for (let dropdownElement of dropdownElements){
            dropdownElement.classList.remove('show')
            dropdownElement.children[0].setAttribute('aria-expanded', 'false')
            dropdownElement.children[1].classList.remove('show')
        }
    }

    // Adding keyboard arrow keys navigation between download button options
    downloadOptsArrowDown(element: any): void{
        let focusChildIndex = element.id === 'downloadAssetDropdown' && element.getAttribute('aria-expanded') ? 0 : 1
        let focusElement = <HTMLElement>(document.querySelectorAll('.dropdown-menu a')[focusChildIndex])
        focusElement.focus()
    }

    downloadOptsArrowUp(element: any): void{
        let focusElementSelector = element.id === 'downloadViewLink' ? '#downloadAssetLink' : '#downloadAssetDropdown'
        let focusElement = <HTMLElement>(document.querySelector(focusElementSelector))
        focusElement.focus()
    }

    public handleToast(event: any): void{
        this.toastType = event.type
        this.toastHTML = event.stringHTML
        this.showToast = true
    }

    public closeToast(): void{
        setTimeout(()=>{ this.showToast = false }, 1000)
    }

}
