import { Router } from '@angular/router';
import { Observable, Subject } from 'rxjs/Rx';

import { AssetService, AuthService } from './../shared';

export class Asset {
  private _assets: AssetService;
  private _auth: AuthService;
  private router: Router;

  id: string;
  /** typeId determines what media type the asset is */
  typeId: number;
  title: string;
  imgURL: string;
  downloadLink: string;
  tileSource: any;

  private metadataLoaded = false;
  private imageSourceLoaded = false;
  private dataLoadedSource = new Subject<boolean>();
  public isDataLoaded = this.dataLoadedSource.asObservable();
  
  /** Used for holding asset metadata array from the service response */
  metaDataArray: any = [];
  /** Used for holding asset file properties array from the service response */
  filePropertiesArray: any = [];

  private objectTypeNames: any = {
      1: 'specimen',
      2: 'visual',
      3: 'use',
      6: 'publication',
      7: 'synonyms',
      8: 'people',
      9: 'repository', 
      10: 'image',
      11: 'qtvr',
      12: 'audio',
      13: '3d',
      21: 'powerpoint',
      22: 'document',
      23: 'excel',
      24: 'kaltura'
  };

  constructor(asset_id: string, router ?: Router, _assets ?: AssetService, _auth ?: AuthService) {
    this.id = asset_id;
    this.router = router;
    this._assets = _assets;
    this._auth = _auth;
    this.loadAssetMetaData();
    this.getDownloadLink();
  }

  /**
   * Get name for Object Type
   */
  public typeName(): string {
      return this.objectTypeNames[this.typeId];
  }

  /** Get asset metadata via service call */
  private loadAssetMetaData(): void {

      this._assets.getById( this.id )
          .then((res) => {
              if(res.objectId){
                  this.metaDataArray = res.metaData;
                  this.filePropertiesArray = res.fileProperties;
                  this.title = res.title;
                  this.imgURL = res.imageUrl;

                  document.title = this.title;

                  this.metadataLoaded = true;
                  this.dataLoadedSource.next(this.metadataLoaded && this.imageSourceLoaded);
              }
          })
          .catch(function(err) {
              console.error('Unable to load category results.');
          });
    
    // This call returns an html table as a string! Fun.
    //   this._assets.getFileProperties(this.id)
    //     .then((res) => {
    //         console.log(res);

    //     })
    //     .catch(error => {
    //         console.error('Unable to load asset file properties');
    //     })
  }

  /** Assigns the asset's downloadLink parameter */
  private getDownloadLink(): void {
      this._assets.getImageSource( this.id )
        .subscribe((data) => {
            if (!data) {
                throw new Error("No data returned from image source call!");
            }
            this.typeId = data.objectTypeId;
            
            /** This determines how to build the downloadLink, which is different for different typeIds */
            if (this.typeId === 20 || this.typeId === 21 || this.typeId === 22 || this.typeId === 23) { //all of the typeIds for documents
                this.downloadLink = [this._auth.getMediaUrl(), this.id, this.typeId].join("/");
            } else if (data.imageServer && data.imageUrl) { //this is a general fallback, but should work specifically for images and video thumbnails
                let url = data.imageServer + data.imageUrl + "?cell=1024,1024&rgnn=0,0,1,1&cvt=JPEG";
                this.downloadLink = this._auth.getUrl() + "/download?imgid=" + this.id + "&url=" + encodeURIComponent(url);
            }

            this.imageSourceLoaded = true;
            this.dataLoadedSource.next(this.metadataLoaded && this.imageSourceLoaded);
        }, (error) => {
            console.error(error);
        });
  }
  
  

}