import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

@Injectable()
export class FlagService {
  /**
   * all public properties here are intended to be feature flags which are read/write accessible from any
   *  component or service which imports the FlagService
   */
  public pcUpload: boolean = false
  public unaffiliated: boolean = false
  public bannerShow: boolean = false
  public bannerCopy: string = ''
  public solrMetadata: boolean = false

  constructor(
    private _http: HttpClient
  ) {
  }

  public getFlagsFromService(): Observable<FlagServiceResponse> {
    const flagUrl: string = '//stage.artstor.org/api/v1/flags/aiw-ui.json'

    return this._http.get<FlagServiceResponse>(
      // Cache busting param added to ensure fresh headers and flags
      flagUrl + '?no-cache=' + new Date().valueOf(),
      {
        observe: 'response'
      }
    ).pipe(
    map((res) => {
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
      this.bannerShow = flags.bannerShow
      this.bannerCopy = flags.bannerCopy
      this.solrMetadata = flags.solrMetadata

      // Solr Metadata rollout
      if (flags.solrMetadataRollout.indexOf(userCountryCode) > -1) {
        this.solrMetadata = true
        document.cookie = 'featureflag=solrmetadata;'
      }

      return flags
    })) // TODO BRETT - Does pipe require calling subscribe() - this isn't a Subscription reponse so does return flags work within pipe
  }
}

interface FlagServiceResponse {
  unaffiliatedAccess: boolean
  unaffiliatedAccessRollout: string[]
  bannerShow: boolean
  bannerCopy: string
  solrMetadata: boolean
  solrMetadataRollout: string[]
}
