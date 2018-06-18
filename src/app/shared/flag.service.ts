import { Injectable, Injector } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { AuthService } from './auth.service'
import { Observable } from 'rxjs'

@Injectable()
export class FlagService {
  /**
   * all public properties here are intended to be feature flags which are read/write accessible from any
   *  component or service which imports the FlagService
   */
  public pcUpload: false
  public unaffiliated: false

  constructor(
    private _http: HttpClient,
    private _injector: Injector
  ) {
  }

  public getFlagsFromService(): Observable<FlagServiceResponse> {
    const flagUrl: string = [this._injector.get(AuthService).getUrl(), 'flags'].join('/')
    
    return this._http.get<FlagServiceResponse>(flagUrl)
  }
}

interface FlagServiceResponse {

}