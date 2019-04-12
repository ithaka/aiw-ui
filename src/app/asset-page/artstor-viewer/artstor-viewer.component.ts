import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewEncapsulation, Inject, PLATFORM_ID } from '@angular/core';
import { Subscription, Observable, of } from 'rxjs'
import { take, map, mergeMap } from 'rxjs/operators'
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { ActivatedRoute } from '@angular/router'
// import * as OpenSeadragon from 'openseadragon'

// Internal Dependencies
// import '/krpano.js'
import { Asset, AuthService, ImageZoomParams } from 'app/shared';
import { MetadataService } from 'app/_services'
import { isPlatformBrowser } from '@angular/common';

// Browser API delcarations
declare var ActiveXObject: any
declare var embedpano: any
declare var OpenSeadragon: any

export enum viewState {
  loading, // 0
  openSeaReady, // 1
  kalturaReady, // 2
  krpanoReady, // 3
  thumbnailFallback, // 4
  audioFallback //5
}

@Component({
  selector: 'artstor-viewer',
  templateUrl: './artstor-viewer.component.html',
  styleUrls: ['./artstor-viewer.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ArtstorViewerComponent implements OnInit, OnDestroy, AfterViewInit {

    // public testEnv: boolean = false
    // public encrypted: boolean = false

    // Optional Inputs
    @Input() groupId: string
    @Input() index: number
    @Input() assetGroupCount: number
    @Input() assetNumber: number
    @Input() assets: Asset[]
    @Input() prevAssetResults: any
    @Input() isFullscreen: boolean
    @Input() showCaption: boolean
    @Input() quizMode: boolean
    @Input() testEnv: boolean
    @Input() thumbnailMode: boolean
    @Input() encrypted: boolean
    @Input() zoom: ImageZoomParams
    private _assetCompareCount: number
    @Input() set assetCompareCount(count: number) {
        if (count > -1 && count !== this._assetCompareCount) {
            this._assetCompareCount = count
            if (this.isMultiView) {
                // Hide or re-show Reference strip when in compare mode and count crosses >3
                this.attemptShowReferenceStrip()
            }
        }
    }
    get assetCompareCount(): number {
        return this._assetCompareCount
    }

    // Required Input
    private _assetId: string = ''
    @Input() set assetId(value: string) {
        // this.testEnv = this.testEnv // keep test environment set here
        // this.encrypted = this.encrypted
        if (value && value != this._assetId) {
            this._assetId = value
            if(this.initialized) {
                this.loadAssetById(this.assetId, this.groupId)
            }
        }
    }
    get assetId(): string {
        // other logic
        return this._assetId
    }
    get asset(): Asset {
        if (this._asset) {
            return this._asset
        } else {
            // this super weird bad-feeling thing is because, for some reason, the template
            //  *ngIf="asset" always thought asset was undefined, and if we left it off we'd
            //  get errors saying "cannot read property 'id' of undefined"
            //  so this is a simple getter/setter combo which will initially provide an empty
            //  object, but an empty object should not be assignable here at any point in the future
            //  because this coercive casting is a bad pattern
            return <Asset>{}
        }
    }
    set asset(asset: Asset) {
        this._asset = asset
    }
    // Optional Inputs
    @Input() legacyFlag: boolean
    @Input() openLibraryFlag: boolean

    // Optional Outputs
    @Output() fullscreenChange = new EventEmitter()
    @Output() nextPage = new EventEmitter()
    @Output() prevPage = new EventEmitter()
    @Output() removeAsset = new EventEmitter()
    @Output() assetDrawer = new EventEmitter()
    @Output() multiViewHelp = new EventEmitter()
    // Emits fully formed asset object
    @Output() assetMetadata = new EventEmitter()

    @Output() multiViewPageViaArrow = new EventEmitter()
    @Output() multiViewPageViaThumbnail = new EventEmitter()

    // Flag to differentiate the page event between arrow pressed and thumbnail click
    private multiViewArrowPressed: boolean = false

    private initialized: boolean = false
    private _asset: Asset
    private assetSub: Subscription
    public state: viewState = viewState.loading
    private removableAsset: boolean = false
    private subscriptions: Subscription[] = []
    // private fallbackFailed: boolean = false
    private tileSource: string | string[]
    public lastZoomValue: number
    // private showCaption: boolean = true

    public kalturaUrl: string
    public osdViewer: any
    public osdViewerId: string
    public isMultiView: boolean
    private tilesLoaded: boolean = false
    public multiViewPage: number = 1
    public multiViewCount: number = 1

    constructor(
        private _http: HttpClient, // TODO: move _http into a service
        private _metadata: MetadataService,
        private _auth: AuthService,
        @Inject(PLATFORM_ID) private platformId: Object,
        private route: ActivatedRoute
    ) {
        if(!this.index) {
            this.index = 0
        }
    }

    ngOnInit() {
        this.subscriptions.push(
            this.route.params.subscribe((routeParams) => {
                if(this.tilesLoaded) {
                    setTimeout(() => {
                        this.refreshZoomedView()
                    }, 250)
                }
            })
        )
        if (!isPlatformBrowser(this.platformId)) {
            // If rendered server-side, load thumbnail
            this.thumbnailMode = true
            this.initialized = true
            this.loadAssetById(this.assetId, this.groupId)
        } else {
            // Load OpenSeadragon client -side
            import('openseadragon')
                .then((osd) => {
                    OpenSeadragon = osd
                    // Ensure component is initialized, and all inputs available, before first load of asset
                    this.initialized = true
                    this.loadAssetById(this.assetId, this.groupId)
                });
        }
        // Assets don't initialize with fullscreen variable
        // And assets beyond the first/primary only show in fullscreen
        if (this.index > 0) {
            this.isFullscreen = true;
        }

        // Events for fullscreen/Presentation mode
        document.addEventListener('fullscreenchange', () => {
            this.changeHandler();
        }, false);

        document.addEventListener('mozfullscreenchange', () => {
            this.changeHandler();
        }, false);

        document.addEventListener('webkitfullscreenchange', () => {
            this.changeHandler();
        }, false);
    }

    ngOnDestroy() {
        // Destroy previous viewers
        if (this.osdViewer) {
            this.osdViewer.destroy()
        }

        this.subscriptions.forEach((sub) => {
            sub.unsubscribe();
        });
    }

    ngAfterViewInit() {
    }

    private loadAssetById(assetId: string, groupId: string): void {
        // Destroy previous viewers
        if (this.osdViewer) {
            this.osdViewer.destroy()
        }
        // change id for new viewer
        this.osdViewerId = 'osd-' + assetId + '-' + this.index
        // Set viewer to "loading"
        this.state = viewState.loading

        this._metadata.buildAsset(assetId, {groupId, legacyFlag: this.legacyFlag, openlib: this.openLibraryFlag, encrypted: this.encrypted })
            .subscribe((asset) => {
                // Replace <br/> tags from title, creator & date values with a space
                asset.title = asset.title.replace(/<br\s*[\/]?>/gi, ' ')
                if(asset.formattedMetadata && asset.formattedMetadata['Creator'] && asset.formattedMetadata['Creator'][0]){
                    asset.formattedMetadata['Creator'][0] = asset.formattedMetadata['Creator'][0].replace(/<br\s*[\/]?>/gi, ' ')
                }
                if(asset.formattedMetadata && asset.formattedMetadata['Date'] && asset.formattedMetadata['Date'][0]){
                    asset.formattedMetadata['Date'][0] = asset.formattedMetadata['Date'][0].replace(/<br\s*[\/]?>/gi, ' ')
                }

                if(this.zoom && this.zoom.viewerX){
                    asset.zoom = this.zoom
                }

                this.asset = asset
                this.assetMetadata.emit(asset)
                this.loadViewer(asset)
            }, (err) => {
                this.assetMetadata.emit({ error: err })
            })
    }

    private loadViewer(asset: Asset): void {
        // Reset options
        this.isMultiView = false
        // Display thumbnail
        this.state = viewState.thumbnailFallback
        if (this.thumbnailMode) { return } // leave state on thumbnail if thumbnail mode is triggered

        // Object types that need loaders
        switch (asset.typeName) {
            case 'image':
                // Image, try IIF
                this.loadIIIF();
                break;
            case 'audio':
                // Kaltura media
                this.loadKaltura();
                // this.state = viewState.audioFallback
                break;
            case 'kaltura':
                // Kaltura media
                this.loadKaltura();
                break;
            case 'panorama':
                this.loadKrpanoViewer();
                break;
        }
    }


    /**
     * Gets information needed to load IIIF viewers, such as OpenSeaDragon
     */
    private loadIIIF(): void {
        if (this.asset.tileSource) {
            this.tileSource = this.asset.tileSource
            this.loadOpenSea()
        } else {
            this.state = viewState.thumbnailFallback
        }
    }

    /**
     * OpenSeaDragon: Show reference strip for multi-view
     */
    private attemptShowReferenceStrip() : void {
        if (!this.isMultiView || !this.osdViewer || !this.tilesLoaded) {
            // Only run if OSD has loaded AND is a Multi View asset
            return
        }
        // Handle hiding reference strip for >3 assets showing
        if (this.assetCompareCount > 3) {
            // Hide reference strip for >3
            this.osdViewer.viewport.setMargins({bottom:0})
            this.osdViewer.removeReferenceStrip()
        } else {
            // Show reference strip for <4
            this.osdViewer.viewport.setMargins({bottom:190})
            this.osdViewer.addReferenceStrip()
            this.osdViewer.nextButton.element.title = 'Next Item'
                this.osdViewer.previousButton.element.title = 'Previous Item'

                this.osdViewer.previousButton.addHandler('press', () => {
                    this.multiViewArrowPressed = true
                })
                this.osdViewer.nextButton.addHandler('press', () => {
                    this.multiViewArrowPressed = true
                })
        }
    }

    /**
     * Loads the OpenSeaDragon on element at 'viewer-' + id
     * - Requires this.asset to have an id
     */
    private loadOpenSea(): void {
        // Single view "multi views" are treated as single images
        this.isMultiView = Array.isArray(this.tileSource) && this.tileSource.length > 1
        this.multiViewPage = 1
        this.multiViewCount = this.tileSource.length
        // Set state to IIIF/OpenSeaDragon
        this.state = viewState.openSeaReady
        // OpenSeaDragon Initializer
        this.osdViewer = new OpenSeadragon({
            id: this.osdViewerId,
            // prefix for Icon Images (full url needed for SSR)
            prefixUrl: this._auth.getUrl() + '/assets/img/osd/',
            tileSources: this.tileSource,
            // Trigger conditionally if tilesource is an array of multiple sources
            sequenceMode: this.isMultiView,
            // OpenSeaDragon bug workaround: Reference strip will not load on init
            showReferenceStrip: false,
            referenceStripScroll: 'horizontal',
            /**
             * Workaround: Turn off "lazy loading" in reference strip
             * OpenSeaDragon uses panelWidth to calc which reference images to load:
             * https://github.com/openseadragon/openseadragon/blob/869a3f6a134cdd143347b215a5da7796f8a7356d/src/referencestrip.js#L410
             * This functionality is arguably broken, so by passing a small sizeRatio, OSD determines it should load ~100 thumbs at a time
             */
            referenceStripSizeRatio: 0.01,
            autoHideControls: false,
            gestureSettingsMouse: {
                scrollToZoom: true,
                pinchToZoom: true
            },
            controlsFadeLength: 500,
            zoomInButton: 'zoomIn-' + this.osdViewerId,
            zoomOutButton: 'zoomOut-' + this.osdViewerId,
            homeButton: 'zoomFit-' + this.osdViewerId,
            previousButton: 'previousButton-' + this.osdViewerId,
            nextButton: 'nextButton-' + this.osdViewerId,
            initialPage: 0,
            showNavigator: true,
            navigatorPosition: 'BOTTOM_LEFT',
            navigatorSizeRatio: 0.15,
            viewportMargins: {
                // Center the image when reference strip shows
                bottom: this.isMultiView ? 190 : 0
            },
            timeout: 60000,
            useCanvas: true,
            // defaultZoomLevel: 1.2, // We don't want the image to be covered on load
            // visibilityRatio: 0.2, // Determines percentage of background that has to be covered by the image while panning
            // debugMode: true,
            preserveImageSizeOnResize: this.zoom && this.zoom.viewerX ? true : false
        });

        // ---- Use handler in case other error crops up
        this.osdViewer.addOnceHandler('open-failed', (e: Event) => {
            console.error("OSD Opening source failed:",e)
            this.state = viewState.thumbnailFallback
            this.osdViewer.destroy();
        });

        this.osdViewer.addHandler('pan', (value: any) => {
            // Save viewport pan for downloading the view
            this.asset.viewportDimensions.center = value.center
        });

        this.osdViewer.addHandler('resize', (value: any) => {
            setTimeout( () => {
                this.refreshZoomedView()
            }, 250)
        });

        this.osdViewer.addHandler('page', (value: {page: number, eventSource: any, userData?: any}) => {
            let index = value.page
            // Set current view "page" number
            this.multiViewPage = index + 1

            if(this.multiViewArrowPressed){
                this.multiViewArrowPressed = false
                this.multiViewPageViaArrow.emit()
            } else {
                this.multiViewPageViaThumbnail.emit()
            }
        })

        this.osdViewer.addHandler('zoom', (value: any) => {
            this.lastZoomValue = value.zoom;

            // Save viewport values for downloading the view
            this.asset.viewportDimensions.containerSize = this.osdViewer.viewport.containerSize
            this.asset.viewportDimensions.contentSize = this.osdViewer.viewport._contentSize
            this.asset.viewportDimensions.zoom = value.zoom

        })

        this.osdViewer.addOnceHandler('tile-load-failed', (e: Event) => {
            console.warn("OSD Loading tiles failed:", e)
            this.state = viewState.thumbnailFallback
            this.osdViewer.destroy();
        })

        this.osdViewer.addOnceHandler('ready', () => {
            console.info("Tiles are ready");
            this.state = viewState.openSeaReady
        })

        this.osdViewer.addOnceHandler('tile-loaded', () => {
            console.info("Tiles are loaded")
            this.tilesLoaded = true
            this.state = viewState.openSeaReady
            // Load Reference Strip once viewer is ready
            if (this.isMultiView) {
                this.attemptShowReferenceStrip()
            }
            this.refreshZoomedView()
        })

        if (this.osdViewer && this.osdViewer.ButtonGroup) {
            this.osdViewer.ButtonGroup.element.addClass('button-group');
        }
        this.osdViewer.navigator.element.style.marginBottom = "50px";
    }

    private loadKrpanoViewer(): void{
        if( this.asset.viewerData && this.asset.viewerData.panorama_xml ){
            let headers = new HttpHeaders({ 'Content-Type': 'text/xml' }).set('Accept', 'text/xml');

            // Format pano_xml url incase it comes badly formatted from backend
            this.asset.viewerData.panorama_xml = this.asset.viewerData.panorama_xml.replace('stor//', 'stor/')
            // Ensure URL uses relative protocol
            this.asset.viewerData.panorama_xml = this.asset.viewerData.panorama_xml.replace('http://', '//')

            // Check if pano xml is available before loading pano
            this._http.get(this.asset.viewerData.panorama_xml, { headers: headers })
                .pipe(take(1))
                .subscribe(
                    data => {
                       this.embedKrpano()
                    },
                    error => {
                        // // We don't care about parsing, just network access
                        if (error && error.status == 200) {
                            this.embedKrpano()
                        } else {
                            console.warn("Pano XML was not accessible", error)
                            // Pano xml is not accessible, fallback to image
                            this.loadIIIF()
                        }
                    }
                )
        }
        else{ // If the media resolver info is not available then fallback to image viewer
            this.loadIIIF()
        }
    }

    private embedKrpano() : void {
         // Run if Pano xml is accessible
        this.state = viewState.krpanoReady
        embedpano({
            html5: "always",
            localfallback: "error",
            xml: this.asset.viewerData.panorama_xml,
            target: "pano-" + this.index,
            onready: (viewer) => {
                console.log("KR Pano has loaded", viewer)
                // See if there was an unreported error during final load
                setTimeout(() => {
                    let content = viewer.innerHTML ? viewer.innerHTML : ''
                    // Workaround for detecting load failure
                    if (content.search('FATAL ERROR') >= 0 && content.search('loading failed') >= 0) {
                        this.state = viewState.thumbnailFallback
                    }
                }, 1000)
            },
            onerror: (err) => {
                // This handler does not fire for "Fatal Error" when loading XML
                console.log(err)
                this.state = viewState.thumbnailFallback
            },
        })
    }

    private requestFullScreen(el: any): void {
        // Supports most browsers and their versions.
        var requestMethod = el.requestFullScreen || el.webkitRequestFullScreen || el.mozRequestFullScreen || el.msRequestFullScreen;

        if (requestMethod) { // Native full screen.
            requestMethod.call(el);
        } else if (window['ActiveXObject'] && typeof window['ActiveXObject'] !== "undefined") { // Older IE.
            var wscript = new ActiveXObject("WScript.Shell");
            if (wscript !== null) {
                wscript.SendKeys("{F11}");
            }
        }
    }

    private exitFullScreen(): void {
        // Being permissive to reference possible Document methods
        let document: any = window.document;
        if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }

    private changeHandler() {
        if (document['webkitIsFullScreen'] || document['mozFullScreen'] || document['fullscreen']) {
            this.setFullscreen(true);
        } else {
            this.assets.splice(1);
            for(let i = 0; i < this.prevAssetResults.thumbnails.length; i++){
                this.prevAssetResults.thumbnails[i].selected = false;
            }

            this.setFullscreen(false);
        }
    }

    public togglePresentationMode(): void {
        // Make the body go full screen.
        var elem = document.body;

        if (!this.isFullscreen) {
            this.requestFullScreen(elem);
            this.setFullscreen(true);
        } else {
            this.exitFullScreen();
            this.setFullscreen(false);
        }
    };

    /**
     * Setter for isFullscreen
     * - Ensures event is sent out to the Asset Page!
     */
    private setFullscreen(isFullscreen: boolean): void {
        this.isFullscreen = isFullscreen;
        this.fullscreenChange.emit(isFullscreen);
    }

    /**
     * Refresh zoomed view for saved details
     */
    private refreshZoomedView(): void{
        // For detailed views set the viewport bouds based on the zoom params passed
        if(this.zoom && this.zoom.viewerX){
            let bounds = this.osdViewer.viewport.imageToViewportRectangle(this.zoom.viewerX, this.zoom.viewerY, this.zoom.pointWidth, this.zoom.pointHeight)
            this.osdViewer.viewport.fitBounds(bounds, true)
        } else {
            this.osdViewer.viewport.fitVertically(true)
            
        }
    }
    /**
     * Setup the embedded Kaltura player
     */
    private loadKaltura(): void {
        console.log("Load Kaltura")
        let targetId = 'kalturaIframe-' + this.index;
        if (this.asset.kalturaUrl) {
            document.getElementById(targetId).setAttribute('src', this.asset.kalturaUrl);
            this.state = viewState.kalturaReady
        } else {
            this.state = viewState.thumbnailFallback
        }
    };

    // Keep: We will want to dynamically load the Kaltura player
    // private getAndLoadKalturaId(data): void {
        // let kalturaId: string;
        // let targetId = 'video-' + this.asset.id + '-' + this.index;

        //  if (data['imageUrl']) {
        //         kalturaId = data['imageUrl'].substr(data['imageUrl'].lastIndexOf(':') + 1, data['imageUrl'].length - 1);
        //     }

        //     if (kalturaId && kalturaId.length > 0) {
        //         this.isKalturaAsset = true;
                // this.isOpenSeaDragonAsset = false;

        //         kWidget.embed({
        //             'targetId': targetId,
        //             'wid': '_101',
        //             'uiconf_id': '23448189',
        //             'entry_id': kalturaId,
        //             'flashvars': {
        //                 // We provide our own fullscreen interface
        //                 'fullScreenBtn.plugin': false
        //             },
        //             'readyCallback': function(playerId) {
        //                 var kdp: any = document.getElementById(playerId);
        //                 kdp.kBind('mediaError', function() {
        //                     console.error('Media error!');
        //                     this.mediaLoadingFailed = true;
        //                 });
        //             }
        //         });
        //         let kPlayer = document.getElementById(targetId);
        //     }
    // };

    /**
     * disableContextMenu
     * - Disable browser context menu / right click on the image viewer
     */
    public disableContextMenu(event: Event): boolean{
        return false;
    }

    /**
     * Is Multi View help output defined
     */
    public hasMultiViewHelp(): boolean {
        return this.multiViewHelp.observers.length > 0
    }

}
