import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpHeaders, HttpClient } from '@angular/common/http';

import { AuthService, Asset } from 'app/shared';
import { map, mergeMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class MetadataService {

  constructor(
      private _auth: AuthService,
      private _http: HttpClient
  ) { }


    public buildAsset(assetId: string, { groupId = '', legacyFlag = false, openlib = false, encrypted = false }={}): Observable<Asset> {
        let metadataObservable
        if (encrypted) {
            metadataObservable = this.getEncryptedMetadata(assetId, legacyFlag, openlib)
        } else {
            metadataObservable = this.getMetadata(assetId, { groupId, legacyFlag, openlib })
        }
        return metadataObservable.pipe(mergeMap((assetData: AssetData) => {

            // do we need to make an imageFpx call to get kaltura data??
            switch (assetData.object_type_id) {
            case 12:
            case 24:
                return this.getFpxInfo(assetData.object_id)
                .pipe(map((res) => {
                    assetData.fpxInfo = res
                    return assetData
                }))
                .catch((err) => {
                  console.error("Imagefpx call failed for asset that was otherwise accessible", err)
                  return of(assetData)
                })
            default:
                return of(assetData)
            }
        }),map((assetData: AssetData) => {
            return new Asset(assetData, (this._auth.getEnv() == 'test'))
        }))
    }

    /**
     * Gets the metadata for an asset and cleans it into an object with which an Asset can be constructed
     * @param assetId The id of the asset for which to obtain the metadata
     * @param groupId The group from which the asset was accessed, if it exists (helps with authorization)
     */
    private getMetadata(assetId: string, { groupId, legacyFlag, openlib }): Observable<AssetData> {
        let url = this._auth.getUrl() + '/v1/metadata?object_ids=' + assetId + '&legacy=' + legacyFlag
        if (groupId){
            // Groups service modifies certain access rights for shared assets
            url = this._auth.getUrl() + '/v1/group/'+ groupId +'/metadata?object_ids=' + encodeURIComponent(assetId) + '&legacy=' + legacyFlag
        }
        if (openlib) {
            // Open Library IDs need to be mapped to Artstor IDs, so we need to flag for the metadata service
            url += '&openlib=' + openlib
        }
        let headers: HttpHeaders = new HttpHeaders().set('Content-Type', 'application/json')
        return this._http
            .get<MetadataResponse>( url, { headers: headers, withCredentials: true })
            .pipe(map((res) => {
                if (!res.metadata[0]) {
                    throw new Error('Unable to load metadata!')
                }
                let data: AssetDataResponse = res.metadata[0]
                let assetData: AssetData = this.mapMetadata(data)
                if (groupId) {
                    assetData.groupId = groupId
                }
                return assetData
        }))
    }

    /**
     * Call to API which returns an asset, given an encrypted_id
     * @param token The encrypted token that you want to know the asset id for
     */
    public getEncryptedMetadata(secretId: string, legacyFlag?: boolean, openlib?: boolean): Observable<any> {
    let headers: HttpHeaders = new HttpHeaders({ fromKress: 'true'})
    let referrer: string = document.referrer
    let url: string = this._auth.getUrl() + "/v2/items/resolve?encrypted_id=" + encodeURIComponent(secretId) + "&ref=" + encodeURIComponent(referrer) + '&legacy=' + legacyFlag

    if (openlib) {
        // Open Library IDs need to be mapped to Artstor IDs, so we need to flag for the items service
        url += '&openlib=' + openlib
    }

    return this._http
        .get<MetadataResponse>(url, { headers: headers })
        .pipe(map((res) => {
            if (!res.metadata[0]) {
            throw new Error('Unable to load metadata via encrypted id!')
            }
            let data: AssetDataResponse = res.metadata[0]
            let assetData: AssetData = this.mapMetadata(data)
            return assetData
        }))
    }

     /**
       * Convenience Mapper
       * although this seems repetitive/wordy, it gives us insulation from server name changes because we
       * have a single place to update the naming of any property, resolve types and make changes to data shape
       * defaults which should otherwise be default values returned by the service can also be assigned here
       */
      private mapMetadata(data: any) : AssetData {
        return {
            object_id: data.object_id,
            SSID: data.SSID,
            category_id: data.category_id,
            category_name: data.category_name,
            collections: data.collections,
            collection_id: data.collection_id,
            collection_name: data.collection_name,
            collection_type: data.collection_type,
            contributinginstitutionid: data.contributinginstitutionid,
            personalCollectionOwner: data.personalCollectionOwner,
            download_size: data.downloadSize || data.download_size || '1024,1024',
            fileProperties: data.fileProperties || [],
            height: data.height,
            image_url: data.image_url,
            image_compound_urls: data.image_compound_urls,
            metadata_json: data.metadata_json,
            object_type_id: data.object_type_id,
            resolution_x: data.resolution_x,
            resolution_y: data.resolution_y,
            thumbnail_url: this.buildThumbnailUrl(data),
            tileSourceHostname: (this._auth.getEnv() == 'test') ? '//tsstage.artstor.org' : '//tsprod.artstor.org',
            title: data.title && data.title !== "" ? data.title : 'Untitled',
            updated_on: data.updated_on,
            viewer_data: data.viewer_data,
            width: data.width,
            baseUrl: this._auth.getHostname()
            }
      }

      /**
       * Takes 
       */
      private buildThumbnailUrl(asset: AssetData) {
        let isMultiView: boolean = !!(asset.image_compound_urls && asset.image_compound_urls.length)
        let downgradedMultiView = asset.image_compound_urls && !asset.image_compound_urls.length

        if (downgradedMultiView) {
          return asset.image_url
        }
        else {
          return this._auth.getThumbHostname(isMultiView) + asset.thumbnail_url
        }
      }

      /**
       * Gets the relevant Kaltura info for an asset - should only be used when necessary
       * @param assetId The artstor id for the relevant asset
       * @param objectTypeId The number corresponding to the asset's type - a map to English names can be found in the Asset class
       */
      private getFpxInfo(assetId: string): Observable<ImageFPXResponse> {
        let requestUrl = this._auth.getUrl() + '/imagefpx/' + assetId + '/24'

        let headers: HttpHeaders = new HttpHeaders().set('Content-Type', 'application/json')
        return this._http
            .get<ImageFPXResponse>(requestUrl, { headers: headers, withCredentials: true })
            .pipe(map((res) => {
                // replace imageUrl with stage url if we are in rest mode
                if (this._auth.getEnv() == 'test') {
                    res.imageUrl = res.imageUrl.replace('kts.artstor','kts.stage.artstor')
                }
                return res
            }))
      }
}



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
    object_id: string
    object_type_id: number
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
    image_compound_urls: string[]
    metadata_json: MetadataField[]
    collections: any[]
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
