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
  public pcUpload: boolean = false
  public unaffiliated: boolean = false

  constructor(
    private _http: HttpClient,
    private _injector: Injector
  ) {
  }

  public getFlagsFromService(): Observable<FlagServiceResponse> {
    const flagUrl: string = [this._injector.get(AuthService).getUrl(), 'flags'].join('/')
    
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
      let userCountryCode: string = res.headers.get('x-artstor-country-code')
      flags.unaffiliatedAccessRollout.forEach((countryCode) => {
        if (flags.unaffiliatedAccessRollout.indexOf(userCountryCode) > -1) {
          this.unaffiliated = true
        }
      })

      return flags
    })
  }

  private setFlagsFromResponse(flags: FlagServiceResponse): void {
    // boolean assignments
    this.unaffiliated = flags.unaffiliatedAccess

    flags.unaffiliatedAccessRollout.forEach((countryCode) => {

    })
  }
}

interface FlagServiceResponse {
  unaffiliatedAccess: boolean
  unaffiliatedAccessRollout: string[]
}