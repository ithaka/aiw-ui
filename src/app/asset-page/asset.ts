import { BehaviorSubject, Observable } from 'rxjs/Rx';

import { AssetService, AuthService } from './../shared';

export class Asset {
  private _assets: AssetService;
  private _auth: AuthService;

  id: string;
  artstorid: string;
  /** typeId determines what media type the asset is */
  typeId: number;
  title: string;
  creator: string;
  date: string;
  imgURL: string;
  fileExt: string;
  downloadLink: string;
  downloadName: string
  tileSource: any;
  record: any;
  collectionName: string = ''
  // Not reliably available
  collectionId: number

  viewportDimensions: {
      contentSize?: any,
      zoom?: number,
      containerSize?: any,
      center?: any
  } = {}

  private metadataLoaded = false;
  private imageSourceLoaded = false;
  private dataLoadedSource = new BehaviorSubject<boolean>(false);
  public isDataLoaded = this.dataLoadedSource.asObservable();

  public disableDownload: boolean = false;

  /** Used for holding asset metadata array from the service response */
  metaDataArray: any = [];
  /** Used for holding asset file properties array from the service response */
  filePropertiesArray: any = [];
  /** Used for holding formatted asset metadata from the service response */
  formattedMetaArray: any = [];

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

  metadataFields = [
        "arttitle",
        "artclassification",
        "artcollectiontitle",
        "artcreator",
        "artculture",
        "artcurrentrepository",
        "artcurrentrepositoryidnumber",
        "artdate",
        "artidnumber",
        "artlocation",
        "artmaterial",
        "artmeasurements",
        "artrelation",
        "artrepository",
        "artsource",
        "artstyleperiod",
        "artsubject",
        "arttechnique",
        "artworktype"
    ];

  constructor(asset_id: string, _assets ?: AssetService, _auth ?: AuthService, assetObj ?: any) {
    this.id = this.artstorid = asset_id;
    this._assets = _assets;
    this._auth = _auth;
    this.loadAssetMetaData();
//   constructor(asset_id: string, _assets ?: AssetService, _auth ?: AuthService, assetObj ?: any) {
    // this.metaDataArray = JSON.parse(asset['metadata_json'].replace(/\t|\n|\s\s\s\s\s\s\s\s\s/g, ''));
    if (assetObj) {
        this.metadataLoaded = true
        this.title = assetObj.tombstone[0]
        // Unpack metadata_json from /resolve call
        if (assetObj.metadata && assetObj.metadata[0] && assetObj.metadata[0]['metadata_json']) {
            this.metaDataArray = JSON.parse(assetObj.metadata[0]['metadata_json'])
        } else {
            this.metaDataArray = [{
                    fieldName : 'Title',
                    fieldValue : assetObj.tombstone[0]
                },{
                    fieldName : 'Creator',
                    fieldValue : assetObj.tombstone[1]
                },
                {
                    fieldName : 'Date',
                    fieldValue : assetObj.tombstone[2]
                }
            ]
        }
        this.formatMetadata()
        this.collectionId = assetObj.collectionId
        this.imgURL = assetObj.largeImgUrl
        this.typeId = assetObj.objectTypeId
        this.metadataLoaded = true
        // Already has image source info attached
        setTimeout(() => {
            this.useImageSourceRes(assetObj)
        },500)

    } else {
        this.loadAssetMetaData();
        this.loadMediaMetaData();
    }
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
              let asset
              if (res['metadata']) {
                asset = res['metadata'][0]
              } else {
                asset = res
              }

              this.loadMediaMetaData();
              // currently having to remove whitespace characters, need to push this back to the API
              this.metaDataArray = JSON.parse(asset['metadata_json'].replace(/\t|\n/g, ''))
              this.formatMetadata();

              this.filePropertiesArray = asset.fileProperties || [];
              this.title = this.metaDataArray.find(elem => elem.fieldName.match(/^\s*Title/)).fieldValue || 'Untitled'

              this.imgURL = asset.image_url
              this.fileExt = asset.image_url ? asset.image_url.substr(asset.image_url.lastIndexOf('.') + 1) : ''

              this.downloadName = this.title.replace(/\./g,'-') + '.' + this.fileExt

              this.setCreatorDate();
              this.collectionName = this.getCollectionName()

              this.metadataLoaded = true;
              this.dataLoadedSource.next(this.metadataLoaded && this.imageSourceLoaded);

          },
          (err) => {
              console.error('Unable to load asset metadata.');
          });
  }


  private formatMetadata(){
    let metaArray = [];
    // loop through all of the metadata we get from the service
    for(let data of this.metaDataArray){
        let fieldExists = false;

        // if the fieldName matches, we store all the data under one object here
        for(let metaData of metaArray){
            if(metaData['fieldName'] === data.fieldName){
                metaData['fieldValue'].push(data.fieldValue);
                fieldExists = true;
                break;
            }
        }

        // if there was no match to the fieldName above, we create a field and begin collating metadata beneath it
        if(!fieldExists){
            let fieldObj = {
                'fieldName': data.fieldName,
                'fieldValue': []
            }

            // see Air-826 - sometimes the data has a link property, which can vary from fieldValue, but
            //  the institution actually wanted the fieldValue to be the same as the link... so that's what this does
            if (data.link) {
                data.fieldValue = data.link
            }

            fieldObj['fieldValue'].push(data.fieldValue);
            metaArray.push(fieldObj);
        }

    }

    this.formattedMetaArray = metaArray;
  }

  /**
   * Searches through the metaDataArray for the asset's collection name
   * @returns The name of the asset's collection or undefined
   */
  private getCollectionName(): string {
    let len = this.metaDataArray.length
    for (let i = 0; i < len; i++) {
        if (this.metaDataArray[i].fieldName == "Collection") {
            return this.metaDataArray[i].fieldValue
        }
    }
  }

  /** Set Creator and Date for the asset from the metadata Array; to be used for tombstone data on fullscreen mode */
  private setCreatorDate(): void {
      for(var i = 0; i < this.metaDataArray.length; i++){
          if(this.metaDataArray[i].fieldName == 'Creator'){
              this.creator = this.metaDataArray[i].fieldValue;
              document.querySelector('meta[name="DC.creator"]').setAttribute('content', this.creator);
          }
          else if(this.metaDataArray[i].fieldName == 'Date'){
              this.date = this.metaDataArray[i].fieldValue;
              document.querySelector('meta[name="DCTERMS.issued"]').setAttribute('content', this.date);
          }
          else if(this.metaDataArray[i].fieldName == 'Description'){
              document.querySelector('meta[name="DC.description"]').setAttribute('content', this.metaDataArray[i].fieldValue);
          }
      }
  }

  private useImageSourceRes(data: any): void {
    if (!data) {
        throw new Error("No data returned from image source call!");
    }

    if (data.metadata && data.metadata[0]) {
        data = data.metadata[0]
    }

    if(data.downloadSize === '0,0' || data.download_size === '0,0'){
        this.disableDownload = true;
    }
    else{
        this.disableDownload = false;
    }

    this.typeId = data.object_type_id || data.objectTypeId;

    let downloadSize = data.download_size || '1024,1024'
    let imageServer = data.imageServer || 'http://hubviewer.artstor.org/'

    /** This determines how to build the downloadLink, which is different for different typeIds */
    if (this.typeId === 20 || this.typeId === 21 || this.typeId === 22 || this.typeId === 23) { //all of the typeIds for documents
        this.downloadLink = [this._auth.getMediaUrl(), this.id, this.typeId].join("/");
    } else if (imageServer && data.image_url) { //this is a general fallback, but should work specifically for images and video thumbnails
        let url = imageServer + data.image_url + "?cell=" + downloadSize + "&rgnn=0,0,1,1&cvt=JPEG";
        this.downloadLink = this._auth.getHostname() + "/api/download?imgid=" + this.id + "&url=" + encodeURIComponent(url);
    }

    // Save the Tile Source for IIIF
    let imgPath

    if (data && data.metadata && data.metadata[0] && data.metadata[0]['image_url']) {
        imgPath = '/' + data.metadata[0]['image_url']
    } else {
        imgPath = '/' + data['image_url'].substring(0, data['image_url'].lastIndexOf('.fpx') + 4)
    }

    this.tileSource = this._auth.getIIIFUrl() + encodeURIComponent(imgPath) + '/info.json'

    this.imageSourceLoaded = true;
    this.dataLoadedSource.next(this.metadataLoaded && this.imageSourceLoaded);
  }

  /**
   * Pulls additional media metadata
   * - Constructs a download link
   * - Constructs the IIIF tile source URL
   * - Finds the asset Type id
  */
  private loadMediaMetaData(): void {
      this._assets.getImageSource( this.id, this.collectionId )
        .subscribe((data) => {
            this.useImageSourceRes(data)
        }, (error) => {
            // if it's an access denied error, throw that to the subscribers
            if (error.status === 403) {
                this.dataLoadedSource.error(error)
            } else {
                // Non-Artstor collection assets don't require a Region ID
                this._assets.getImageSource( this.id, 103 )
                    .subscribe((data) => {
                        this.useImageSourceRes(data)
                    }, (error) => {
                        console.error(error);
                    });
            }
        });
  }
}
