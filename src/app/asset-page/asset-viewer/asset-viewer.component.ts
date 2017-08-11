import { identifierToken } from '@angular/compiler/src/identifiers';
import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Input,
    OnDestroy,
    OnInit,
    Output
} from '@angular/core';
import { Http } from '@angular/http';
import { Subscription } from 'rxjs/Subscription';
import * as OpenSeadragon from 'openseadragon';

import { Asset } from '../asset';
import { AssetService, AuthService } from '../../shared';

declare var ActiveXObject: (type: string) => void;
declare var kWidget: any;

@Component({
    selector: 'ang-asset-viewer',
    templateUrl: 'asset-viewer.component.html',
    styleUrls: ['./asset-viewer.component.scss']
})
export class AssetViewerComponent implements OnInit, OnDestroy, AfterViewInit {

    @Input() asset: Asset;
    @Input() index: number;
    @Input() assetCompareCount: number;
    @Input() assetGroupCount: number;
    @Input() assetNumber: number;
    @Input() assets:Asset[];
    @Input() prevAssetResults: any;
    @Input() isFullscreen: boolean;
    @Input() showCaption: boolean;
    @Input() quizMode: boolean;

    @Output() fullscreenChange = new EventEmitter();
    @Output() nextPage = new EventEmitter();
    @Output() prevPage = new EventEmitter();
    @Output() removeAsset = new EventEmitter();

    private isLoading: boolean = true;
    // private isFullscreen: boolean = false;
    private openSeaDragonReady: boolean = false;
    private isOpenSeaDragonAsset: boolean = false;
    private isKalturaAsset: boolean = false;
    private mediaLoadingFailed: boolean = false;
    private removableAsset: boolean = false;
    private subscriptions: Subscription[] = [];
    private fallbackFailed: boolean = false;
    private tileSource: string;
    private lastZoomValue: number;
    // private showCaption: boolean = true;

    private kalturaUrl: string;

    constructor(private _assets: AssetService, private _auth: AuthService, private http: Http) {
        
    }

    ngOnInit() {
        if (this.asset.isDataLoaded) {
            // Wait for the asset to have its metadata
            this.subscriptions.push(
                this.asset.isDataLoaded.subscribe(assetInfoLoaded => {
                    if (assetInfoLoaded === true && this.isLoading) {
                        this.loadViewer();
                    }
                }, error => {
                    console.log(error);
                })
            );
        } else {
            this.loadViewer()
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
        this.subscriptions.forEach((sub) => {
            sub.unsubscribe();
        });
    }

    ngAfterViewInit() {
      
    }

    private loadViewer(): void {
        // Object types that need loaders
        switch (this.asset.typeName()) {
            default:
                // Display thumbnail
                this.mediaLoadingFailed = true;
            case 'image':
                // Image, try IIF
                this.loadIIIF();
                break;
            case 'audio':
                // Kaltura media
                this.loadKaltura();
                break;
            case 'kaltura':
                // Kaltura media
                this.loadKaltura();
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
            this.mediaLoadingFailed = true
        }
    }

    /**
     * Loads the OpenSeaDragon on element at 'viewer-' + id
     * - Requires this.asset to have an id
     */
    private loadOpenSea(): void {
        this.isOpenSeaDragonAsset = true;
        // OpenSeaDragon Initializer
        let id = 'osd-' + this.asset.id + '-' + this.index;
        var viewer = new OpenSeadragon({
            id: id,
            // prefix for Icon Images
            prefixUrl: 'assets/img/osd/',
            tileSources: this.tileSource,
            gestureSettingsMouse: {
                scrollToZoom: true,
                pinchToZoom: true
            },
            controlsFadeLength: 500,
            //   debugMode: true,
            autoHideControls: false,
            zoomInButton: 'zoomIn-' + id,
            zoomOutButton: 'zoomOut-' + id,
            homeButton: 'zoomFit-' + id,
            sequenceMode: true,
            initialPage: 0,
            nextButton: 'nextButton'
        });

        // ---- Use handler in case other error crops up
        viewer.addOnceHandler('open-failed', () => {
            console.warn("Opening source failed");
            this.mediaLoadingFailed = true;
            viewer.destroy();
        });

        viewer.addHandler('zoom', (value) => {
            this.lastZoomValue = value.zoom;
        });

        viewer.addOnceHandler('tile-load-failed', () => {
            console.warn("Loading tiles failed");
            this.mediaLoadingFailed = true;
            viewer.destroy();
        });

        viewer.addOnceHandler('ready', () => {
            console.info("Tiles are ready");
            this.openSeaDragonReady = true;
        });

        if (viewer && viewer.ButtonGroup) {
            viewer.ButtonGroup.element.addClass('button-group');
        }
    }

    private requestFullScreen(el): void {
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

    removeComparedAsset(assetId): void {
        this.removeAsset.emit(this.index);
    }

    /**
     * Setup the embedded Kaltura player
     */
    private loadKaltura(): void {
        let targetId = 'kalturaIframe-' + this.index;

        // We gotta always say it's type 24, the type id for Kaltura!
        this._assets.getFpxInfo(this.asset.id, 24)
            .then(data => {
                console.log(data);
                this.kalturaUrl = data['imageUrl'];
                document.getElementById(targetId).setAttribute('src', this.kalturaUrl);

                this.isKalturaAsset = true;
                this.isOpenSeaDragonAsset = false;
            })
            .catch(err => {
                console.log(err);
            });
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
        //         this.isOpenSeaDragonAsset = false;

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
    private disableContextMenu(event): boolean{
        return false;
    }

}