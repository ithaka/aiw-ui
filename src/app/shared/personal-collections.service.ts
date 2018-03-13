import { Injectable } from '@angular/core'
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http'
import { Observable } from 'rxjs/Rx'

import { AuthService } from '.'

@Injectable()
export class PersonalCollectionService {

  constructor(
    private _auth: AuthService,
    private _http: HttpClient
  ) { }

  public getPersonalCollection(collectionId: string): Observable<GetPersonalCollectionResponse> {
    let headers: HttpHeaders = new HttpHeaders()
      .set('Content-Type', 'application/json')

    return this._http.get<GetPersonalCollectionResponse>(
      [this._auth.getUrl(), 'v1', 'collection'].join('/'),
      { headers: headers, withCredentials: true }
    )
  }

  public deletePersonalAssets(SSIDs: string[]): Observable<DeletePersonalAssetResponse> {
    let headers: HttpHeaders = new HttpHeaders()
      .set('Content-Type', 'application/json')

    return this._http.delete<DeletePersonalAssetResponse>(
      [this._auth.getUrl(), 'v1', 'pcollection', 'image'].join('/') + "?ssids=" + SSIDs.join(","),
      {
        headers: headers,
        withCredentials: true
      }
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
  src?: string // we assign this on the front end
}