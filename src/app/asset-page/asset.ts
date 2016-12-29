export class Asset {
  id: string;
  title: string;
  imgURL: string;
  tileSource: any;

  /** Used for holding asset metadata array from the service response */
  metaDataArray: any = [];
  /** Used for holding asset file properties array from the service response */
  filePropertiesArray: any = [];

  constructor(asset_id: string) {
    this.id = asset_id;
  }

}