import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { Subscription }   from 'rxjs/Subscription';
import * as OpenSeadragon from 'openseadragon';

import { Asset } from '../asset';
import { AssetService } from '../../shared/assets.service'

@Component({
    selector: 'ang-asset-viewer',
    templateUrl: 'asset-viewer.component.html',
    styleUrls: [ './asset-viewer.component.scss' ]
})
export class AssetViewerComponent implements OnInit, OnDestroy {

    @Input() asset: Asset;
    @Input() index: number;

    private subscriptions: Subscription[] = [];
    private isOpenSeaDragonAsset: boolean = true;
    private mediaLoadingFailed: boolean = false;
    private fallbackFailed: boolean = false;
    private tileSource: string; //: any[] = [];

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
            this._assets.getTileSource(this.asset.id)
                .subscribe(data => {
                    if (data) {
                        let imgPath = '/' + data['imageUrl'].substring(0, data['imageUrl'].lastIndexOf('.fpx') + 4);
                        this.tileSource = 'https://tsprod.artstor.org/rosa-iiif-endpoint-1.0-SNAPSHOT/fpx' + encodeURIComponent( imgPath ) + '/info.json';
                        this.loadOpenSea();
                    }
                })
        );
    }

    ngOnDestroy() {
        this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
    }



    //   $scope.findAssetField = findAssetField;
    //   $scope.OSDFileTypes = ["img","image","file","pdf","ppt","doc"];
    //   $scope.KalturaFileTypes = ["video", "audio", "vid", "aud"];
      
    //   var assetLoaded = false;
    //   var tilesource = [];

    //   $timeout( function() {
    //     $scope.$watch($scope.asset, function() {
    //       if ($scope.asset && $scope.asset['Meta-Id'] && !assetLoaded) {
    //         assetLoaded = true;
    //         $http.get('http://catalog.sharedshelf.artstor.org/iiifmap/ss/' + $scope.asset['Meta-Id'])
    //           .success(function(res) {
    //             tileSource = res.info_url;
    //             if ($scope.KalturaFileTypes.indexOf(findAssetField.filetype($scope.asset)) > 0) {
    //               $scope.loadKaltura();  
    //             } else {
    //               $scope.loadOpenSea($scope.asset['Meta-Id']);
    //             }
    //         })
    //         .error(function(res) {
    //           // No IIIF URLs
    //           $log.warn("No IIIF tiles to load");
    //           $scope.mediaLoadingFailed = true;
    //         });  
    //       }
    //     });
    //   });

    //   function setColumnHeight() {
    //     // Column height adjustment
    //     if(!$scope.fullscreen && $scope.asset && $scope.asset['Meta-Id'] && document.getElementById('wrap-' + $scope.asset['Meta-Id'] + '-' + $scope.index) ){
    //       document.getElementById('wrap-' + $scope.asset['Meta-Id'] + '-' + $scope.index).style.height = ( window.innerHeight - 162) + 'px';
    //       document.getElementById('columnTwoContent').style.minHeight = ( window.innerHeight - 50) + 'px';
    //     }
    //   }
      
    loadOpenSea = function() {
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
        //   zoomInButton: 'zoomIn-' + id,
        //   zoomOutButton: 'zoomOut-' + id,
        //   homeButton: 'zoomFit-' + id,
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

    //     if( $scope.index == 1) {
    //        hotkeys      
    //         .bindTo($scope)
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
        
    //     // Check if Tile Source is available
    //     // ---- The OpenSeaDragon handler is too slow for providing a fallback
    //     $http.get(tileSource)
    //       .success(function(response) {
    //         $log.info("Tile source is available for asset " + $scope.index);

    //         // This is a temporary lie, since the 'ready' handler fails to trigger
    //         $scope.openSeaDragonReady = true;
    //       })
    //       .error(function(data){
    //         $log.warn("Loading tiles failed");
    //         $scope.mediaLoadingFailed = true;
    //         viewer.destroy();
    //       });
          
    //     // ---- Use handler in case other error crops up
    //     viewer.addHandler('open-failed', function() {
    //       $log.warn("Opening source failed");
    //       $scope.mediaLoadingFailed = true;
    //       viewer.destroy();
    //     });
        
    //     viewer.addHandler('tile-load-failed', function() {
    //       $log.warn("Loading tiles failed");
    //       $scope.mediaLoadingFailed = true;
    //       viewer.destroy();
    //     });

    //     viewer.addHandler('ready', function() {
    //       $log.info("Tiles are ready");
    //       $scope.openSeaDragonReady = true;
    //     });

    //     $timeout(function() {
    //       if(viewer && viewer.ButtonGroup){
    //         viewer.ButtonGroup.element.addClass('button-group');
    //       }
    //       document.getElementById('viewer-' + id).appendChild( document.getElementById('imageButtons-' + id) );
    //       setColumnHeight();
    //     });
    //   };

    //   window.addEventListener('resize', setColumnHeight);

    //   function requestFullScreen(el) {
    //     // Supports most browsers and their versions.
    //     var requestMethod = el.requestFullScreen || el.webkitRequestFullScreen || el.mozRequestFullScreen || el.msRequestFullScreen;

    //     if (requestMethod) { // Native full screen.
    //       requestMethod.call(el);
    //     } else if (typeof window.ActiveXObject !== "undefined") { // Older IE.
    //       var wscript = new ActiveXObject("WScript.Shell");
    //       if (wscript !== null) {
    //           wscript.SendKeys("{F11}");
    //       }
    //     }
    //   }

    //   function exitFullScreen() {
    //     if (document.cancelFullScreen) {
    //       document.cancelFullScreen();
    //     } else if (document.mozCancelFullScreen) {
    //       document.mozCancelFullScreen();
    //     } else if (document.webkitCancelFullScreen) {
    //       document.webkitCancelFullScreen();
    //     }
    //   }


    //   $scope.fullscreen = false; //false;

    //   var changeHandler = function(){                      
    //     if (document.webkitIsFullScreen || document.mozFullScreen || document.fullscreen) {
    //       $scope.fullscreen = true;
    //     } else {
    //       $scope.fullscreen = false;
    //       $timeout(function() {
    //         // Fix for when setColumnHeight runs during fullscreen mode
    //         // 3s wait to ensure it runs after exiting fullscreen animation is complete
    //         setColumnHeight();
    //       }, 3000);
    //     }  
    //     // Angular isn't applying scope after the 'ESC' to exit key event
    //     $scope.$apply();     
    //   };

    //   document.addEventListener('fullscreenchange', function () {
    //         changeHandler();
    //     }, false);

    //     document.addEventListener('mozfullscreenchange', function () {
    //         changeHandler();
    //     }, false);

    //     document.addEventListener('webkitfullscreenchange', function () {
    //         changeHandler();
    //     }, false);

    //   $scope.togglePresentationMode = function(){

    //     var elem = document.body; // Make the body go full screen.

    //     if (!$scope.fullscreen) {
    //       ga('send', {
    //         hitType: 'event',
    //         eventCategory: 'Access',
    //         eventAction: 'Enter Full Screen Mode',
    //         eventLabel: $scope.assetId
    //       });
    //       requestFullScreen(elem);
    //       $scope.fullscreen = true;
    //     } else {
    //       exitFullScreen();
    //       $scope.fullscreen = false;
    //     }
    //   };

    //   if (document.getElementById('fallbackViewer')) {
    //     angular.element( document.getElementById('fallbackViewer') ).find('img')[0].onerror = function() {
    //       $scope.fallbackFailed = true;
    //     };
    //   }
      
    //   $scope.removeComparedAsset = function(assetId) {
    //     // Verify asset can be removed
    //     if ($scope.removableAsset) {
    //       // Tell item.js to remove asset from array
    //       $rootScope.$broadcast('removeComparedAsset', assetId);
    //     }
    //   };

    //   // WORKAROUND: Get IDs and build the Kaltura url
    //   var kalturaId = "";
    //   var spId = "";

    //   // For media player backups
    //   $scope.mediaUrl = $sce.trustAsResourceUrl( $scope.asset.File.url.replace('stor//','stor/') );
    //   $scope.mediaType = $scope.asset.File.format;
      
    //   $scope.loadKaltura = function() {
    //     $http.get($scope.asset.File.url.replace('stor//','stor/') + '_kplayer')
    //       .success(function(data) {
    //         var htmlPage = data;
    //         spId = htmlPage.slice(htmlPage.indexOf('/sp/') + 4 );
    //         spId = spId.slice(0,spId.indexOf('/'));
    //         htmlPage = htmlPage.slice(htmlPage.indexOf('thumbnail/entry_id/') + 19 );
    //         kalturaId = htmlPage.slice(0,htmlPage.indexOf('/'));
              
    //         kWidget.embed({
    //           'targetId': 'video-' + $scope.asset['Meta-Id'] + '-' + $scope.index,
    //           'wid': '_101',
    //           'uiconf_id' : '23448189',
    //           'entry_id' : kalturaId,
    //           'flashvars': {
    //             'fullScreenBtn.plugin': false
    //           },
    //           'readyCallback' : function(playerId) {
    //             var kdp = document.getElementById( playerId );
    //             kdp.kBind( 'mediaError', function(){
    //               if (findAssetField.filetype($scope.asset) === 'aud') {
    //                 document.getElementById(playerId).style.display = 'none';
    //                 document.getElementById(playerId.replace('video','audio')).style.display = 'block';
    //               } else {
    //                 $scope.mediaLoadingFailed = true;
    //                 $scope.$apply();
    //               }
    //             });
    //           }
    //         }); 
    //       })
    //       .error(function(data) {
    //         console.log('Failed to find Kaltura!');
    //         $scope.mediaLoadingFailed = true;
    //       });
    //   };
        
          
    //   $scope.isPDF = function() {
    //     if ($scope.asset && $scope.asset.File) {
    //       if ($scope.asset.File.type.indexOf('pdf') > -1) {
    //         return true;
    //       }
    //       if ($scope.asset.File.format.indexOf('pdf') > -1) {
    //         return true;
    //       }
    //     }
    //     return false;
    //   };
      
    //   $scope.isPPT = function() {
    //     if ($scope.asset && $scope.asset.File) {
    //       if ($scope.asset.File.type.indexOf('ppt') > -1) {
    //         return true;
    //       }
    //       if ($scope.asset.File.format.indexOf('ppt') > -1) {
    //         return true;
    //       }
    //     }
    //     return false;
    //   };


}