import {
    Component,
    OnInit,
    OnDestroy,
    Input,
    Output,
    EventEmitter,
    AfterViewInit
} from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import * as OpenSeadragon from 'openseadragon';

import { Asset } from '../asset';
import { AssetService } from '../../shared/assets.service'

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
    @Output() fullscreenChange = new EventEmitter();
    @Output() nextPage = new EventEmitter();
    @Output() prevPage = new EventEmitter();

    private isLoading: boolean = true;
    private isFullscreen: boolean = false;
    private openSeaDragonReady: boolean = false;
    private isOpenSeaDragonAsset: boolean = false;
    private isKalturaAsset: boolean = false;
    private mediaLoadingFailed: boolean = false;
    private removableAsset: boolean = false;
    private subscriptions: Subscription[] = [];
    private fallbackFailed: boolean = false;
    private tileSource: string;
    private lastZoomValue: number;
    private showCaption: boolean = true;

    constructor(private _assets: AssetService) {}

    ngOnInit() {
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
        /**
         * Get tilesource/url for use with OpenSeaDragon IIIF Viewer
         */
        this.subscriptions.push(
            this._assets.getImageSource(this.asset.id)
            .subscribe(data => {
                if (data) {
                    let imgPath = '/' + data['imageUrl'].substring(0, data['imageUrl'].lastIndexOf('.fpx') + 4);
                    this.tileSource = 'https://tsprod.artstor.org/rosa-iiif-endpoint-1.0-SNAPSHOT/fpx' + encodeURIComponent(imgPath) + '/info.json';
                    this.loadOpenSea();
                }
            })
        );
    }

    /**
     * Loads the OpenSeaDragon on element at 'viewer-' + id
     * - Requires this.asset to have an id
     */
    private loadOpenSea(): void {
        this.isOpenSeaDragonAsset = true;
        // OpenSeaDragon Initializer
        let id = this.asset.id + '-' + this.index;

        var viewer = new OpenSeadragon({
            id: 'osd-' + id,
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
            this.setFullscreen(false);
        }
    }

    private togglePresentationMode(): void {
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
        //     // Verify asset can be removed
        //     if (this.removableAsset) {
        //       // Tell item.js to remove asset from array
        //       $rootScope.$broadcast('removeComparedAsset', assetId);
        //     }
    }

    /**
     * Setup the embedded Kaltura player
     */
    private loadKaltura(): void {
        let kalturaId: string;
        let targetId = 'video-' + this.asset.id + '-' + this.index;

        // We gotta always say it's type 24, the type id for Kaltura!
        this._assets.getFpxInfo(this.asset.id, 24)
            .then(data => {
                if (data['imageUrl']) {
                    kalturaId = data['imageUrl'].substr(data['imageUrl'].lastIndexOf(':') + 1, data['imageUrl'].length - 1);
                }

                if (kalturaId && kalturaId.length > 0) {
                    this.isKalturaAsset = true;
                    this.isOpenSeaDragonAsset = false;

                    kWidget.embed({
                        'targetId': targetId,
                        'wid': '_101',
                        'uiconf_id': '23448189',
                        'entry_id': kalturaId,
                        'flashvars': {
                            // We provide our own fullscreen interface
                            'fullScreenBtn.plugin': false
                        },
                        'readyCallback': function(playerId) {
                            var kdp: any = document.getElementById(playerId);
                            kdp.kBind('mediaError', function() {
                                console.error('Media error!');
                                this.mediaLoadingFailed = true;
                            });
                        }
                    });
                    let kPlayer = document.getElementById(targetId);
                    console.log(kPlayer);
                }


            })
            .catch(err => {
                console.log(err);
            });
    };

}