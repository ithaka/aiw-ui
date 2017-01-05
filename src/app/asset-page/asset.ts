import { Router } from '@angular/router';

import { AssetService, AuthService } from './../shared';

export class Asset {
  private _assets: AssetService;
  private _auth: AuthService;
  private router: Router;

  id: string;
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
            if (data && data.imageServer && data.imageUrl) {
                let url = data.imageServer + data.imageUrl + "?cell=1024,1024&rgnn=0,0,1,1&cvt=JPEG";
                this.downloadLink = this._auth.getUrl() + "/download?imgid=" + this.id + "&url=" + encodeURIComponent(url);
            }
        }, (error) => {
            console.error(error);
        });
  }

  

}