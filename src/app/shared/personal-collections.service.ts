import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs/Rx';

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

  // public deletePersonalAsset() {

  // }
  


  public metadataIds: { label: string, id: string }[] = [
    {label: "creator", id: "fd_68602_s",  },
    {label: "title", id: "fd_68607_s" },
    {label: "work_type", id: "fd_68609_s" },
    {label: "date", id: "fd_68612_s" },
    {label: "location", id: "fd_68616_s" },
    {label: "material", id: "fd_68619_s" },
    {label: "description", id: "fd_68627_s" },
    {label: "subject", id: "fd_68632_s" }
  ]

  /**
   * Prepares and returns the asset details object from the form
   * @param form The value of the submitted form
   * @param ssid The SSID of the asset to be updated
   * @returns AssetDetailsRequestObject which can be POSTed to the API endpoint
   */
  public prepareAssetDetailsObject(form: AssetDetailsFormValue, ssid: string): AssetDetailsRequestObject {
    let assetDetails: AssetDetailsRequestObject = {
      ssid: parseInt(ssid),
      metadata: []
    }

    for(let metaIdObj of this.metadataIds){
      if( form[metaIdObj.label] ) {
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
  public updatepcImageMetadata(assetDetails: AssetDetailsRequestObject): Observable<any> {
    return this._http.post(
        this.pcImgMetaUpdateURL,
        [ assetDetails ],
        this.options
    )
  }

}

export interface AssetDetailsFormValue {
  creator?: string,
  title: string,
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