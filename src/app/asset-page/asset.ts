import { Observable, Subject } from 'rxjs/Rx';

import { AssetService, AuthService } from './../shared';

export class Asset {
  private _assets: AssetService;
  private _auth: AuthService;

  id: string;
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
  collectionName: string = ''

  private metadataLoaded = false;
  private imageSourceLoaded = false;
  private dataLoadedSource = new Subject<boolean>();
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

  constructor(asset_id: string, _assets ?: AssetService, _auth ?: AuthService) {
    this.id = asset_id;
    this._assets = _assets;
    this._auth = _auth;
    this.loadAssetMetaData();
    this.loadMediaMetaData();
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
                  this.formatMetadata();

                  this.filePropertiesArray = res.fileProperties;
                  this.title = res.title ? res.title : 'Untitled';
                  this.imgURL = res.imageUrl;
                  this.fileExt = res.imageUrl ? res.imageUrl.substr(res.imageUrl.lastIndexOf('.') + 1) : ''

                  this.downloadName = this.title.replace(/\./g,'-') + '.' + this.fileExt

                console.log(this.title, this.fileExt, this.downloadName)

                  this.setCreatorDate();
                  this.collectionName = this.getCollectionName()

                  this.metadataLoaded = true;
                  this.dataLoadedSource.next(this.metadataLoaded && this.imageSourceLoaded);
              }
          })
          .catch(function(err) {
              console.error('Unable to load asset metadata.');
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


  private formatMetadata(){
    let metaArray = [];
    for(let data of this.metaDataArray){
        let fieldExists = false;

        for(let metaData of metaArray){
            if(metaData['fieldName'] === data.fieldName){
                metaData['fieldValue'].push(data.fieldValue);
                fieldExists = true;
                break;
            }
        }

        if(!fieldExists){
            let fieldObj = {
                'fieldName': data.fieldName,
                'fieldValue': []
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

    if(data.downloadSize === '0,0'){
        this.disableDownload = true;
    }
    else{
        this.disableDownload = false;
    }
    
    this.typeId = data.objectTypeId;
    
    /** This determines how to build the downloadLink, which is different for different typeIds */
    if (this.typeId === 20 || this.typeId === 21 || this.typeId === 22 || this.typeId === 23) { //all of the typeIds for documents
        this.downloadLink = [this._auth.getMediaUrl(), this.id, this.typeId].join("/");
    } else if (data.imageServer && data.imageUrl) { //this is a general fallback, but should work specifically for images and video thumbnails
        let url = data.imageServer + data.imageUrl + "?cell=1024,1024&rgnn=0,0,1,1&cvt=JPEG";
        this.downloadLink = this._auth.getHostname() + "/api/download?imgid=" + this.id + "&url=" + encodeURIComponent(url);
    }

    // Save the Tile Source for IIIF
    let imgPath = '/' + data['imageUrl'].substring(0, data['imageUrl'].lastIndexOf('.fpx') + 4)
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
      this._assets.getImageSource( this.id )
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