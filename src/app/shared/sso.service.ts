import { Injectable } from '@angular/core'
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { Observable } from 'rxjs/Observable'

const SSO_URL = '//firefly.jstor.org/sso/user'

@Injectable()
export class SSOService {

  constructor(
    private _http: HttpClient
  ) { }

  public getSSOCredentials(): Observable<GetSSOCredentialsResponse> {
    return this._http.get<GetSSOCredentialsResponse>(
      SSO_URL,
      { withCredentials: true }
    )
  }

  public postSSOCredentials(username: string, password: string): Observable<PostSSOCredentialsResponse> {
    let reqUrl: string = SSO_URL + "?username=" + encodeURIComponent(username) + "&password=" + encodeURIComponent(password)
    
    return this._http.post<PostSSOCredentialsResponse>(
      reqUrl,
      {},
      { withCredentials: true }
    )
  }
}

interface GetSSOCredentialsResponse {
  username: string
  password: string
}

interface PostSSOCredentialsResponse {

}