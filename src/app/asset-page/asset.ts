import { AssetService } from './../shared/assets.service';

export class Asset {
  private _assets: AssetService;

  id: string;
  title: string;
  imgURL: string;
  downloadLink: string;
  tileSource: any;

  /** Used for holding asset metadata array from the service response */
  metaDataArray: any = [];
  /** Used for holding asset file properties array from the service response */
  filePropertiesArray: any = [];

  constructor(asset_id: string, _assets: AssetService) {
    this.id = asset_id;
    this._assets = _assets;
    this.loadAssetMetaData();
    this.getDownloadLink();
  }

  /**
      Get asset metadata via service call
  */
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
              console.log('Unable to load category results.');
          });
  }

  private getDownloadLink(): void {
      this._assets.getImageSource( this.id )
        .subscribe((data) => {
            console.log(data);

            if (data && data.imageServer && data.imageUrl) {
                this.downloadLink = data.imageServer + data.imageUrl + "?cell=1024,1024&rgnn=0,0,1,1&cvt=JPEG";
                console.log(this.downloadLink);
            }
        }, (error) => {
            console.error(error);
        });
  }

  

}