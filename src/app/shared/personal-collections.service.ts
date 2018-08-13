import { Injectable } from '@angular/core'
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http'
import { Observable } from 'rxjs/Rx'

import { AuthService } from '.'

@Injectable()
export class PersonalCollectionService {

  private pcImgMetaUpdateURL: string = ''
  private options: {}

  constructor(
    private _auth: AuthService,
    private _http: HttpClient
  ) {
    this.pcImgMetaUpdateURL = this._auth.getHostname() + '/api/v1/pcollection/image/metadata'
    this.options = { withCredentials: true }
  }

  private metadataIds: { label: string, id: string }[] = [
    {label: 'creator', id: 'fd_68602_s'  },
    {label: 'title', id: 'fd_68607_s' },
    {label: 'work_type', id: 'fd_68609_s' },
    {label: 'date', id: 'fd_68612_s' },
    {label: 'location', id: 'fd_68616_s' },
    {label: 'material', id: 'fd_68619_s' },
    {label: 'description', id: 'fd_68627_s' },
    {label: 'subject', id: 'fd_68632_s' }
  ]

  /**
   * Prepares and returns the asset details object from the form
   * @param form The value of the submitted form
   * @param ssid The SSID of the asset to be updated
   * @returns AssetDetailsRequestObject which can be POSTed to the API endpoint
   */
  private prepareAssetDetailsObject(form: AssetDetailsFormValue, ssid: string): AssetDetailsRequestObject {
    let assetDetails: AssetDetailsRequestObject = {
      ssid: parseInt(ssid),
      metadata: []
    }

    for (let metaIdObj of this.metadataIds){
      if ( form[metaIdObj.label] ) {
        let fldObj: AssetDetailField = {
          field_id: metaIdObj.id,
          value: form[metaIdObj.label]
        }
        assetDetails.metadata.push(fldObj)
      }
    }

    return assetDetails
  }

  /**
   * Update personal collection image metadata
   */
  public updatepcImageMetadata(form: AssetDetailsFormValue, ssid: string): Observable<updatepcImageMetadataResponse> {
    let assetDetails = this.prepareAssetDetailsObject(form, ssid)
  // public updatepcImageMetadata(assetDetails: AssetDetailsRequestObject): Observable<any> {
    return this._http.post<updatepcImageMetadataResponse>(
        this.pcImgMetaUpdateURL,
        [ assetDetails ],
        this.options
    )
  }

  public getPersonalCollection(collectionId: string): Observable<GetPersonalCollectionResponse> {
    let headers: HttpHeaders = new HttpHeaders()
      .set('Content-Type', 'application/json')

    return this._http.get<GetPersonalCollectionResponse>(
      [this._auth.getUrl(), 'v1', 'collection'].join('/'),
      { headers: headers, withCredentials: true }
    )
  }

  public deletePersonalAssets(ssids: string[]): Observable<DeletePersonalAssetResponse> {
    let headers: HttpHeaders = new HttpHeaders()
      .set('Content-Type', 'application/json')

    return this._http.delete<DeletePersonalAssetResponse>(
      [this._auth.getUrl(), 'v1', 'pcollection', 'image'].join('/') + '?ssids=' + ssids.join(','),
      { headers: headers, withCredentials: true }
    )
  }
}

interface DeletePersonalAssetResponse {

}

interface GetPersonalCollectionResponse {

}

export interface PostPersonalCollectionResponse {
  // asset_group_id: [] // don't know
  created_by: number
  created_on: string
  deleted: boolean
  fd_68638_b: boolean
  filename: string
  image_restricted: boolean
  institution_id: string
  media_count: number
  // media_identifier: null // don't know again
  metadata: { width: number, height: number, imagetype: string, size: number }
  primary_image: boolean
  project_id: number
  // publishing_status:{} // not sure what this is
  representation_id: string
  sequence_number: number
  ssid: number
  updated_by: number
  updated_on: string
  visibility: number
}

export interface PersonalCollectionUploadAsset extends PostPersonalCollectionResponse {
  src?: string // we assign this on the front end
}

export interface AssetDetailsFormValue {
  creator?: string,
  title?: string,
  work_type?: string,
  date?: string,
  location?: string,
  material?: string,
  description?: string,
  subject?: string
}

export interface AssetDetailsRequestObject {
  ssid: number,
  metadata: Array <AssetDetailField>
}

export interface AssetDetailField {
  field_id: string,
  value: string
}

export interface updatepcImageMetadataResponse {
  success: boolean
  results: {
    ssid: string
    status: number
    success: boolean
  }[]
}
