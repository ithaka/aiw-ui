import { Injectable } from '@angular/core'
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { Observable } from 'rxjs/Observable'

@Injectable()
export class SSOService {

  constructor(
    private _http: HttpClient
  ) { }

  public getSSOCredentials(): Observable<GetSSOCredentialsResponse> {
    return this._http.get(
      '//firefly.jstor.org/sso/user',
      { withCredentials: true }
    )
  }
}

interface GetSSOCredentialsResponse {

}