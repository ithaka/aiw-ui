import { Router } from '@angular/router';

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

  /** Used for holding asset metadata array from the service response */
  metaDataArray: any = [];
  /** Used for holding asset file properties array from the service response */
  filePropertiesArray: any = [];

  constructor(asset_id: string, router ?: Router, _assets ?: AssetService, _auth ?: AuthService) {
    this.id = asset_id;
    this.router = router;
    this._assets = _assets;
    this._auth = _auth;
    this.loadAssetMetaData();
    this.getDownloadLink();
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
              }
          })
          .catch(function(err) {
              console.error('Unable to load category results.');
          });
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
            if (this.typeId === 10 && data.imageServer && data.imageUrl) {
                let url = data.imageServer + data.imageUrl + "?cell=1024,1024&rgnn=0,0,1,1&cvt=JPEG";
                this.downloadLink = this._auth.getUrl() + "/download?imgid=" + this.id + "&url=" + encodeURIComponent(url);
            } else if (this.typeId === 20 || this.typeId === 21 || this.typeId === 22 || this.typeId === 23) { //all of the typeIds for documents
                this.downloadLink = [this._auth.getMediaUrl(), this.id, this.typeId].join("/");
            }
        }, (error) => {
            console.error(error);
        });
  }

  

}