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

  public deletePersonalAssets(ssIds: string[]): Observable<DeletePersonalAssetResponse> {
    let headers: HttpHeaders = new HttpHeaders()
      .set('Content-Type', 'application/json')

    let params: HttpParams = new HttpParams()
    params.append('ssids', ssIds.join(', '))

    return this._http.delete<DeletePersonalAssetResponse>(
      [this._auth.getUrl(), 'api', 'v1', 'pcollection', 'image'].join('/'),
      {
        params: params,
        headers: headers,
        withCredentials: true
      }
    )
  }
}

interface DeletePersonalAssetResponse {
  
}