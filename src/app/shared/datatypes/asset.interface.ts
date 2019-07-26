// Project Dependencies
import { AssetData, MetadataField, FileProperty, CollectionValue } from './asset.service'
import { ImageZoomParams } from './image-group.interface';

export class Asset {
    id: string
    groupId: string
    typeId: number // determines what media type the asset is
    typeName: string // the name correlating to the typeId
    title: string
    thumbnail_url: string
    thumbnail_size: number = 2
    kalturaUrl: string
    // Download attributes
    downloadMaxWidth: number = 0
    downloadMaxHeight: number = 0
    downloadLink: string
    downloadName: string
    // IIIF Attributes
    tileSource: any
    qualities: string[] // IIIF quality available: https://iiif.io/api/image/2.1/#quality
    formats: string[] = ['jpg'] // IIIF formats available: https://iiif.io/api/image/2.1/#format
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

    public zoom?: ImageZoomParams

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

    constructor(assetData: AssetData, IIIFUrl ?: string) {
        if (!assetData) {
            throw new Error('No data passed to construct asset')
        }
        this.initAssetProperties(assetData, IIIFUrl)
    }

    private formatMetadata(metadata: MetadataField[]): FormattedMetadata {
        let formattedData: FormattedMetadata = {}
        for (let data of metadata) {
            // this is stupid, but if there's a link then it needs to be assigned to the fieldValue
            if (data.link) {
                data.fieldValue = data.link
            }
            // Split by semicolons without removing semicolon
            let values = data.fieldValue.split(/;./g)
            // if the field exists, add to it (make sure the field value exists)
            if (formattedData[data.fieldName] && values[0]) {
                formattedData[data.fieldName].concat(values)
            } else if(values[0]) { // otherwise make a new field (make sure the field vaue exists)
                formattedData[data.fieldName] = values
            }
            console.log("this is the formatteddata:", formattedData)
        }
        return formattedData
    }

    private buildDownloadLink(data: AssetData, groupId?: string): string {
        let downloadLink: string
        switch (data.object_type_id) {
            case 20:
            case 21:
            case 22:
            case 23:
                // Non-image Download Link format: /media/ARTSTORID/TYPEID
                let queryParam = '?groupid=' + groupId
                downloadLink = [data.baseUrl, 'media', this.id, data.object_type_id].join("/")
                downloadLink = groupId ?  downloadLink + queryParam : downloadLink
                break
            default:
                // Determine allowable size
                let maxWidth
                let maxHeight
                let maxSize
                if (data.download_size && data.download_size.length > 0) {
                    let sizeValues = data.download_size.split(',')
                    maxWidth = parseInt(sizeValues[0]) 
                    maxHeight = parseInt(sizeValues[1])
                }
                // Check if valid sizes, otherwise use defaults (larger than 3000 may stall)
                if (maxWidth < 0 || maxWidth > 3000) maxWidth = 3000
                if (maxHeight < 0 || maxHeight > 3000) maxHeight = 3000
                // Set max values on Asset
                this.downloadMaxWidth = maxWidth
                this.downloadMaxHeight = maxHeight
                // Generate IIIF size string based on orientation
                if (data.width > data.height) {
                    // Landscape
                    maxSize = maxWidth + ','
                } else {
                    // Portrait
                    maxSize = ',' + maxHeight
                }
                if (Array.isArray(this.tileSource) && this.tileSource.length >= 1) {
                    // Handle Multi View downloads using IIIF
                    let url = this.tileSource[0].replace('info.json', '') + 'full/'+maxSize+'/0/' + this.iiifFilename()
                    // Ensure protocol is attached
                    if (url.indexOf('//') == 0) {
                        url = 'https:' + url
                    }
                    // Pass IIIF url to Download Service for processing metadata
                    // Include "iiif" param in this case
                    downloadLink = data.baseUrl + "/api/download?imgid=" + this.id + "&url=" + encodeURIComponent(url) + "&iiif=true"
                } else if (data.image_url) {
                    if(data.width >= maxWidth || data.height >= maxHeight) {
                        let url = this.tileSource.replace('.fcgi%3F', '.fcgi?').replace('info.json', '')
                        if (url.indexOf('//') == 0) {
                            url = 'https:' + url
                        }
                        // Build IIIF query
                        url += `full/${maxSize}/0/${this.iiifFilename()}`
                        downloadLink = data.baseUrl + "/api/download?imgid=" + this.id + "&url=" + encodeURIComponent( encodeURI(url) ) + "&iiif=true"
                    } else {
                        // Handle images and video thumbnails
                        let imageServer = 'http://imgserver.artstor.net/'
                        // Pass Image url to Download Service for processing metadata
                        let url = imageServer + data.image_url + "?cell=" + data.download_size + "&rgnn=0,0,1,1&cvt=JPEG"
                        downloadLink = data.baseUrl + "/api/download?imgid=" + this.id + "&url=" + encodeURIComponent(url)
                    }
                } else {
                    // nothing happens here because some assets are not allowed to be downloaded
                }
        }
        return downloadLink
    }

    /**
     * Get IIIF default filename
     * - Combines default "quality" with default "format"
     */
    public iiifFilename(): string {
        return this.qualities[0] + '.' + this.formats[0]
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
            20: 'pdf',
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
    private initAssetProperties(data: AssetData, IIIFUrl?: string): void {
        let storUrl: string = IIIFUrl ? IIIFUrl : 'https://stor.artstor.org'
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
                data.image_compound_urls[i] = storUrl + '/iiif' + path
            }
            this.tileSource = data.image_compound_urls

        }
        // Handle Downgraded from Multiview.
        else if(data.image_compound_urls && data.image_compound_urls.length === 0) {
          this.tileSource = this.thumbnail_url = storUrl + '/stor' + data.image_url
        }
        else {
            this.tileSource = data.tileSourceHostname + '/iiif/fpx' + imgPath + '/info.json'
        }
        // IIIF api dictates that the name indicates type/quality
        this.qualities = ['default']
        // Set download after tilesource determined
        this.downloadLink = this.buildDownloadLink(data, data.groupId)

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
