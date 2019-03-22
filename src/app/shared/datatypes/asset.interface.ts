// Project Dependencies
import { AssetData, MetadataField, FileProperty, CollectionValue } from './asset.service'

export class Asset {
    id: string
    groupId: string
    typeId: number // determines what media type the asset is
    typeName: string // the name correlating to the typeId
    title: string
    thumbnail_url: string
    thumbnail_size: number = 2
    kalturaUrl: string
    downloadLink: string
    downloadName: string
    tileSource: any
    collectionType: number
    contributinginstitutionid: number
    personalCollectionOwner: number
    // Not reliably available
    categoryId: string
    categoryName: string
    collections: CollectionValue[]
    collectionId: string
    collectionName: string
    SSID: string
    fileName: string
    updated_on: string
    publicDownload?: any
    image_compound_urls?: string[]

    viewportDimensions: {
        contentSize?: any,
        zoom?: number,
        containerSize?: any,
        center?: any
    } = {}

//   private dataLoadedSource = new BehaviorSubject<boolean>(false)
//   public isDataLoaded = this.dataLoadedSource.asObservable()

    public disableDownload: boolean = false

    /** Used for holding asset file properties array from the service response */
    filePropertiesArray: FileProperty[] = []
    /** Used for holding formatted asset metadata from the service response */
    formattedMetadata: FormattedMetadata = {}

    /** Used for holding media resolver info from the service response */
    viewerData?: {
        base_asset_url?: string,
        panorama_xml?: string
    }

    constructor(assetData: AssetData, testEnv ?: boolean) {
        if (!assetData) {
            throw new Error('No data passed to construct asset')
        }
        this.initAssetProperties(assetData, testEnv)
    }

    private formatMetadata(metadata: MetadataField[]): FormattedMetadata {
        let formattedData: FormattedMetadata = {}
        for (let data of metadata) {
            // this is stupid, but if there's a link then it needs to be assigned to the fieldValue
            if (data.link) {
                data.fieldValue = data.link
            }

            // if the field exists, add to it (make sure the field vaue exists)
            if (formattedData[data.fieldName] && data.fieldValue) {
                formattedData[data.fieldName].push(data.fieldValue)
            } else if(data.fieldValue) { // otherwise make a new field (make sure the field vaue exists)
                formattedData[data.fieldName] = [data.fieldValue]
            }
        }
        return formattedData
    }

    private buildDownloadLink(data: AssetData): string {
        let downloadLink: string
        switch (data.object_type_id) {
            case 20:
            case 21:
            case 22:
            case 23:
                // Non-image Download Link format: /media/ARTSTORID/TYPEID
                downloadLink = [data.baseUrl, 'media', this.id, data.object_type_id].join("/")
                break
            default:
                if (Array.isArray(this.tileSource) && this.tileSource.length >= 1) {
                    // Handle Multi View downloads using IIIF
                    let url = 'https:' + this.tileSource[0].replace('info.json', '') + 'full/full/0/default.jpg'
                    // Pass IIIF url to Download Service for processing metadata
                    // Include "iiif" param in this case
                    downloadLink = data.baseUrl + "/api/download?imgid=" + this.id + "&url=" + encodeURIComponent(url) + "&iiif=true"
                } else if (data.image_url) {
                    // Handle images and video thumbnails
                    let imageServer = 'http://imgserver.artstor.net/'
                    // Pass Image url to Download Service for processing metadata
                    let url = imageServer + data.image_url + "?cell=" + data.download_size + "&rgnn=0,0,1,1&cvt=JPEG"
                    downloadLink = data.baseUrl + "/api/download?imgid=" + this.id + "&url=" + encodeURIComponent(url)
                } else {
                    // nothing happens here because some assets are not allowed to be downloaded
                }
        }
        return downloadLink
    }

    /**
     * Sets the correct typeName based on a map
     * @param typeId the asset's object_type_id
     */
    private initTypeName(typeId: number): string {
        let objectTypeNames: { [key: number]: string } = {
            1: 'specimen',
            2: 'visual',
            3: 'use',
            6: 'publication',
            7: 'synonyms',
            8: 'people',
            9: 'repository',
            10: 'image',
            11: 'panorama',
            12: 'audio',
            13: '3d',
            21: 'powerpoint',
            22: 'document',
            23: 'excel',
            24: 'kaltura'
        }
        return objectTypeNames[typeId]
    }

    get creator(): string {
        return (this.formattedMetadata.Creator && this.formattedMetadata.Creator[0]) || ''
    }
    get date(): string {
        return (this.formattedMetadata.Date && this.formattedMetadata.Date[0]) || ''
    }
    get description(): string {
        return (this.formattedMetadata.Description && this.formattedMetadata.Description[0]) || ''
    }

    /**
     * Sets up the Asset object with needed properties
     * - Behaves like a delayed constructor
     * - Reports status via 'this.dataLoadedSource' observable
     */
    private initAssetProperties(data: AssetData, testEnv?: boolean): void {
        let storUrl: string = testEnv ? '//stor.stage.artstor.org' : '//stor.artstor.org'
        // Set array of asset metadata fields to Asset, and format
        if (data.metadata_json) {
            this.formattedMetadata = this.formatMetadata(data.metadata_json)
        }
        this.id = data.object_id
        this.typeId = data.object_type_id
        this.title = data.title
        this.categoryId = data.category_id
        this.categoryName = data.category_name
        this.collections = data.collections
        this.collectionId = data.collection_id
        this.collectionName = data.collection_name
        this.filePropertiesArray = data.fileProperties
        this.collectionType = data.collection_type
        this.contributinginstitutionid = data.contributinginstitutionid
        this.personalCollectionOwner = data.personalCollectionOwner
        // we control the default size of the thumbnail url
        this.thumbnail_url = this.replaceThumbnailSize(data.thumbnail_url, this.thumbnail_size)
        this.typeId = data.object_type_id
        this.typeName = this.initTypeName(data.object_type_id)
        console.log("Download size: " + data.download_size)
        this.disableDownload =  data.download_size === '0,0'
        this.SSID = data.SSID
        // Set filename
        if (this.filePropertiesArray && this.filePropertiesArray[0]){
            let fileProperty = this.filePropertiesArray.find((obj) => {
                return !!obj && !!obj.fileName
            })
            this.fileName = fileProperty ? fileProperty.fileName : 'file'
        } else {
            this.fileName = 'file'
        }
        this.updated_on = data.updated_on
        // Set Download information
        let fileExt = this.fileName.substr(this.fileName.lastIndexOf('.'), this.fileName.length - 1)
        this.downloadName = this.title.replace(/\./g,'-') + '.' + fileExt
        data.viewer_data && (this.viewerData = data.viewer_data)

        // Save the Tile Source for IIIF
        //  sometimes it doesn't come back with .fpx, so we need to add it
        let imgPath
        if (data.image_url.lastIndexOf('.fpx') > -1) {
            imgPath = '/' + data.image_url.substring(0, data.image_url.lastIndexOf('.fpx') + 4)
        } else {
            imgPath = '/' + data.image_url
        }
        if (data.image_compound_urls && data.image_compound_urls[0]) {
            for (let i = 0; i < data.image_compound_urls.length; i++) {
                let path = data.image_compound_urls[i]
                // path = path.replace('/info.json','')
                // data.image_compound_urls[i] = '//tsstage.artstor.org/rosa-iiif-endpoint-1.0-SNAPSHOT/fpx' + encodeURIComponent(path) + '/info.json'
                data.image_compound_urls[i] = storUrl + '/fcgi-bin/iipsrv.fcgi?IIIF=' + path
            }
            this.tileSource = data.image_compound_urls

        }
        // Handle Downgraded from Multiview.
        else if(data.image_compound_urls && data.image_compound_urls.length === 0) {
          this.tileSource = this.thumbnail_url = storUrl + '/stor' + data.image_url
        }
        else {
            this.tileSource = data.tileSourceHostname + '/rosa-iiif-endpoint-1.0-SNAPSHOT/fpx' + encodeURIComponent(imgPath) + '/info.json'
        }
        // Set download after tilesource determined
        this.downloadLink = this.buildDownloadLink(data)

        // set up kaltura info if it exists
        if (data.fpxInfo) {
            this.kalturaUrl = data.fpxInfo.imageUrl.replace('http://', '//')
        }
    }

    /**
     * Sometimes the thumbnail url will not exist and we need to fall back to a different thumbnail size
     */
    public fallbackThumbnailUrl(): void {
        if (this.thumbnail_size > 0) {
            this.thumbnail_size --
            this.thumbnail_url = this.replaceThumbnailSize(this.thumbnail_url, this.thumbnail_size)
        }
    }

    private replaceThumbnailSize(url: string, size: number): string {
        return url.replace(/(size)[0-9]/g, 'size' + size)
    }
}

export interface FormattedMetadata {
    [fieldName: string]: string[]
}

// From asset.service

export interface MetadataResponse {
    metadata: AssetDataResponse[]
    success: boolean
    total: 1 // the total number of items returned
  }

  export interface AssetData {
    groupId?: string
    SSID?: string
    category_id: string
    category_name: string
    collections: CollectionValue[]
    collection_id: string
    collection_name: string
    collection_type: number
    contributinginstitutionid: number
    personalCollectionOwner: number
    download_size: string
    fileProperties: FileProperty[] // array of objects with a key/value pair
    height: number
    image_url: string
    image_compound_urls?: string[],
    metadata_json: MetadataField[]
    object_id?: string
    object_type_id?: number
    resolution_x: number
    resolution_y: number
    thumbnail_url: string
    tileSourceHostname: string
    title: string
    updated_on: string

    viewer_data?: {
        base_asset_url?: string,
        panorama_xml?: string
    }
    width: number
    baseUrl: string
    fpxInfo?: ImageFPXResponse
  }

  export interface AssetDataResponse {
    SSID?: string
    category_id: string
    category_name: string
    collection_id: string
    collection_name: string
    collection_type: number
    contributinginstitutionid: number
    personalCollectionOwner: number
    downloadSize?: string
    download_size?: string
    fileProperties: { [key: string]: string }[] // array of objects with a key/value pair
    height: number
    image_url: string
    metadata_json: MetadataField[]
    object_id: string
    object_type_id: number
    resolution_x: number
    resolution_y: number
    thumbnail_url: string
    title: string
    updated_on: string
    viewer_data: {
      base_asset_url?: string,
      panorama_xml?: string
    }
    width: number
  }

  export interface MetadataField {
    count: number // the number of fields with this name
    fieldName: string
    fieldValue: string
    index: number
    link?: string
  }

  export interface CollectionValue {
    type: string
    name: string
    id: string
  }

  export interface ImageFPXResponse {
    height: number
    id: {
      fileName: string
      resolution: number
    }
    imageId: string
    imageUrl: string
    resolutionX: number
    resolutionY: number
    width: number
  }

  export interface FileProperty { [key: string]: string }

/**
 * IIIF Zoom parameters as passed by Group service and URL params
 */
export interface ImageZoomParams {
    viewerX?: number
    viewerY?: number
    pointWidth?: number
    pointHeight?: number
    index?: number
}