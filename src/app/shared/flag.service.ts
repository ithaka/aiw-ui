import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable, BehaviorSubject } from 'rxjs'
import { map } from 'rxjs/operators'

// Project Dependencies
import { environment } from 'environments/environment';
import { Params } from '@angular/router';

@Injectable()
export class FlagService {
  /**
   * Flags should be added to the interface below
   */
  public flags: FeatureFlags = {}
  // Observable for receiving switch updates
  private flagSource: BehaviorSubject<FeatureFlags> = new BehaviorSubject({})
  public flagUpdates: Observable<FeatureFlags>

  constructor(
    private _http: HttpClient
  ) {
    this.flagUpdates = this.flagSource.asObservable()
  }

  public getFlagsFromService(): Observable<FeatureFlags> {
    const flagUrl: string = environment.API_URL + '/api/v1/flags/aiw-ui.json'

    return this._http.get<FlagServiceResponse>(
      // Cache busting param added to ensure fresh headers and flags
      flagUrl + '?no-cache=' + new Date().valueOf(),
      {
        observe: 'response'
      }
    ).pipe(
    map(res => {
      let flags = res.body
      let userCountryCode: string = res.headers.get('x-artstor-country-code').substr(0, 2)

      /**
       * EXAMPLE USE OF COUNTRY CODE ROLLOUT
       * // Boolean assignments
       * this.unaffiliated = flags.unaffiliatedAccess
       *
       * // If the user's country code is allowed, set unaffiliated flag to true
       * let userCountryCode: string = res.headers.get('x-artstor-country-code').substr(0, 2)
       * if (flags.unaffiliatedAccessRollout.indexOf(userCountryCode) > -1) {
       *  this.unaffiliated = true
       * }
       */
      this.flags.bannerShow = flags.bannerShow
      this.flags.bannerCopy = flags.bannerCopy

      // Push update to subscribers
      this.flagSource.next(this.flags)
      // Return 
      return this.flags
    }))
  }

  /**
   * Read flags from route params, and update subscribers
   * @param params Route params
   */
  public readFlags(params: Params) : any {
    if(params && params['featureFlag']){
      this.flags.flagsAppliedByRoute = true
      this.flags[params['featureFlag']] = true
    }
    // Emit switch update
    this.flagSource.next(this.flags)
    // Return switches for immediate use
    return this.flags
  }
}

/**
 * Feature Flag interface controls which flags are available to apply
 * - To Add/Clean out a flag, update the FeatureFlags interface first
 */
export interface FeatureFlags {
  flagsAppliedByRoute?: boolean,
  pcUpload?: boolean,
  unaffiliated?: boolean,
  bannerShow?: boolean,
  bannerCopy?: string,
  solrMetadata?: boolean,
  detailViews?: boolean,
  exportReframe?: boolean,
  relatedResFlag?: boolean
}

interface FlagServiceResponse {
  unaffiliatedAccess: boolean
  unaffiliatedAccessRollout: string[]
  bannerShow: boolean
  bannerCopy: string
}
