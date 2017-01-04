import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { Subscription }   from 'rxjs/Subscription';
import * as OpenSeadragon from 'openseadragon';

import { Asset } from '../asset';
import { AssetService } from '../../shared/assets.service'

declare var ActiveXObject: (type: string) => void;

@Component({
    selector: 'ang-asset-viewer',
    templateUrl: 'asset-viewer.component.html',
    styleUrls: [ './asset-viewer.component.scss' ]
})
export class AssetViewerComponent implements OnInit, OnDestroy {

    @Input() asset: Asset;
    @Input() index: number;
    @Output() fullscreenChange =  new EventEmitter();
    
    private isFullscreen: boolean = false;
    private isOpenSeaDragonAsset: boolean = true;
    private mediaLoadingFailed: boolean = false;
    private removableAsset: boolean = false;
    private subscriptions: Subscription[] = [];
    private fallbackFailed: boolean = false;
    private tileSource: string;

    constructor(private _assets: AssetService) { }

    ngOnInit() {
        // this._assets.getFileProperties(this.asset.id)
        //     .then(data => {
        //         console.log( data.match('table') );
        //     })
        //     .catch(error => {
        //         console.error(error);
        //     });

        /**
         * Get tilesource/url for use with OpenSeaDragon IIIF Viewer
         */
        this.subscriptions.push(
            this._assets.getImageSource(this.asset.id)
                .subscribe(data => {
                    if (data) {
                        let imgPath = '/' + data['imageUrl'].substring(0, data['imageUrl'].lastIndexOf('.fpx') + 4);
                        this.tileSource = 'https://tsprod.artstor.org/rosa-iiif-endpoint-1.0-SNAPSHOT/fpx' + encodeURIComponent( imgPath ) + '/info.json';
                        this.loadOpenSea();
                    }
                })
        );

        // Events for fullscreen/Presentation mode
        document.addEventListener('fullscreenchange', () =>{
            this.changeHandler();
        }, false);

        document.addEventListener('mozfullscreenchange', () =>{
            this.changeHandler();
        }, false);

        document.addEventListener('webkitfullscreenchange', () => {
            this.changeHandler();
        }, false);
    }

    ngOnDestroy() {
        this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
    }



    //   this.findAssetField = findAssetField;
    //   this.OSDFileTypes = ["img","image","file","pdf","ppt","doc"];
    //   this.KalturaFileTypes = ["video", "audio", "vid", "aud"];
      
    //   var assetLoaded = false;
    //   var tilesource = [];

    //   $timeout( function() {
    //     this.$watch(this.asset, function() {
    //       if (this.asset && this.asset['Meta-Id'] && !assetLoaded) {
    //         assetLoaded = true;
    //         $http.get('http://catalog.sharedshelf.artstor.org/iiifmap/ss/' + this.asset['Meta-Id'])
    //           .success(function(res) {
    //             tileSource = res.info_url;
    //             if (this.KalturaFileTypes.indexOf(findAssetField.filetype(this.asset)) > 0) {
    //               this.loadKaltura();  
    //             } else {
    //               this.loadOpenSea(this.asset['Meta-Id']);
    //             }
    //         })
    //         .error(function(res) {
    //           // No IIIF URLs
    //           $log.warn("No IIIF tiles to load");
    //           this.mediaLoadingFailed = true;
    //         });  
    //       }
    //     });
    //   });

    //   function setColumnHeight() {
    //     // Column height adjustment
    //     if(!this.isFullscreen && this.asset && this.asset['Meta-Id'] && document.getElementById('wrap-' + this.asset['Meta-Id'] + '-' + this.index) ){
    //       document.getElementById('wrap-' + this.asset['Meta-Id'] + '-' + this.index).style.height = ( window.innerHeight - 162) + 'px';
    //       document.getElementById('columnTwoContent').style.minHeight = ( window.innerHeight - 50) + 'px';
    //     }
    //   }
    
    /**
     * Loads the OpenSeaDragon on element at 'viewer-' + id
     * - Requires this.asset to have an id
     */
    loadOpenSea = function():void {
        this.isOpenSeaDragonAsset = true;
        // OpenSeaDragon Initializer
        let id = this.asset.id  + '-' + this.index;

        var viewer = new OpenSeadragon({
          id: 'viewer-' + id,
          // prefix for Icon Images
          prefixUrl: 'assets/img/osd/',
          tileSources: this.tileSource,
          gestureSettingsMouse : {
            scrollToZoom : true,
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
        
        viewer.addOnceHandler('tile-load-failed', () => {
          console.warn("Loading tiles failed");
          this.mediaLoadingFailed = true;
          viewer.destroy();
        });

        viewer.addOnceHandler('ready', () => {
          console.info("Tiles are ready");
          this.openSeaDragonReady = true;
        });

        if(viewer && viewer.ButtonGroup){
            viewer.ButtonGroup.element.addClass('button-group');
        }

        console.log(viewer);
    }

    //     if( this.index == 1) {
    //        hotkeys      
    //         .bindTo(this)
    //         .add({
    //           combo: ['+','='],
    //           description: 'Image viewer: Zoom In',
    //           callback: function() {
    //             viewer.viewport.zoomBy(1.2);
    //           }
    //         })
    //         .add({
    //           combo: ['-'],
    //           description: 'Image viewer: Zoom Out',
    //           callback: function() {
    //             viewer.viewport.zoomBy(0.8);
    //           }
    //         });
    //     }
        
    //   window.addEventListener('resize', setColumnHeight);

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
    //   if (document.getElementById('fallbackViewer')) {
    //     angular.element( document.getElementById('fallbackViewer') ).find('img')[0].onerror = function() {
    //       this.fallbackFailed = true;
    //     };
    //   }
      
    //   this.removeComparedAsset = function(assetId) {
    //     // Verify asset can be removed
    //     if (this.removableAsset) {
    //       // Tell item.js to remove asset from array
    //       $rootScope.$broadcast('removeComparedAsset', assetId);
    //     }
    //   };

    removeComparedAsset(assetId): void {

    }

    //   // WORKAROUND: Get IDs and build the Kaltura url
    //   var kalturaId = "";
    //   var spId = "";

    //   // For media player backups
    //   this.mediaUrl = $sce.trustAsResourceUrl( this.asset.File.url.replace('stor//','stor/') );
    //   this.mediaType = this.asset.File.format;
      
    //   this.loadKaltura = function() {
    //     $http.get(this.asset.File.url.replace('stor//','stor/') + '_kplayer')
    //       .success(function(data) {
    //         var htmlPage = data;
    //         spId = htmlPage.slice(htmlPage.indexOf('/sp/') + 4 );
    //         spId = spId.slice(0,spId.indexOf('/'));
    //         htmlPage = htmlPage.slice(htmlPage.indexOf('thumbnail/entry_id/') + 19 );
    //         kalturaId = htmlPage.slice(0,htmlPage.indexOf('/'));
              
    //         kWidget.embed({
    //           'targetId': 'video-' + this.asset['Meta-Id'] + '-' + this.index,
    //           'wid': '_101',
    //           'uiconf_id' : '23448189',
    //           'entry_id' : kalturaId,
    //           'flashvars': {
    //             'fullScreenBtn.plugin': false
    //           },
    //           'readyCallback' : function(playerId) {
    //             var kdp = document.getElementById( playerId );
    //             kdp.kBind( 'mediaError', function(){
    //               if (findAssetField.filetype(this.asset) === 'aud') {
    //                 document.getElementById(playerId).style.display = 'none';
    //                 document.getElementById(playerId.replace('video','audio')).style.display = 'block';
    //               } else {
    //                 this.mediaLoadingFailed = true;
    //                 this.$apply();
    //               }
    //             });
    //           }
    //         }); 
    //       })
    //       .error(function(data) {
    //         console.log('Failed to find Kaltura!');
    //         this.mediaLoadingFailed = true;
    //       });
    //   };
        
          
    //   this.isPDF = function() {
    //     if (this.asset && this.asset.File) {
    //       if (this.asset.File.type.indexOf('pdf') > -1) {
    //         return true;
    //       }
    //       if (this.asset.File.format.indexOf('pdf') > -1) {
    //         return true;
    //       }
    //     }
    //     return false;
    //   };
      
    //   this.isPPT = function() {
    //     if (this.asset && this.asset.File) {
    //       if (this.asset.File.type.indexOf('ppt') > -1) {
    //         return true;
    //       }
    //       if (this.asset.File.format.indexOf('ppt') > -1) {
    //         return true;
    //       }
    //     }
    //     return false;
    //   };


}