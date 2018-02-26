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
    

    let ssidStrings: string[] = []
    SSIDs.forEach((id, index) => {
      ssidStrings.push('ssids[' + index + ']=' + encodeURIComponent(id))
    })

    let queryString: string = ssidStrings.join('&')

    return this._http.delete<DeletePersonalAssetResponse>(
      [this._auth.getUrl(), 'v1', 'pcollection', 'image'].join('/') + "?" + queryString,
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