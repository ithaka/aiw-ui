import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'

@Injectable()
export class FlagService {
  /**
   * all public properties here are intended to be feature flags which are read/write accessible from any
   *  component or service which imports the FlagService
   */
  public pcUpload: boolean = false
  public unaffiliated: boolean = false

  constructor(
    private _http: HttpClient
  ) {
  }

  public getFlagsFromService(): Observable<FlagServiceResponse> {
    const flagUrl: string = '//stage.artstor.org/api/v1/flags/aiw-ui.json'
    
    return this._http.get<FlagServiceResponse>(
      flagUrl,
      {
        observe: 'response'
      }
    )
    .map((res) => {
      let flags = res.body

      // boolean assignments
      this.unaffiliated = flags.unaffiliatedAccess

      // if the user's country code is allowed, set unaffiliated flag to true
      let userCountryCode: string = res.headers.get('x-artstor-country-code').substr(0, 2)
      if (flags.unaffiliatedAccessRollout.indexOf(userCountryCode) > -1) {
        this.unaffiliated = true
      }

      return flags
    })
  }
}

interface FlagServiceResponse {
  unaffiliatedAccess: boolean
  unaffiliatedAccessRollout: string[]
}