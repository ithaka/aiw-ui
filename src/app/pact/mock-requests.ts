import { HttpClient } from '@angular/common/http'

const host = '//stage.artstor.org'
const options = { withCredentials: true }


export class MockRequests {
  constructor() {}

  private _http: HttpClient
  /**
   * Method From: assets.service
   * Endpoint: '/v1/categorydesc/'
   *
   * Get metadata about a Category
   * @param catId The Category ID
   *
   */
  public mockGetCategoryInfo(catId: string) {
    return this._http
      .get(host + '/v1/categorydesc/' + catId, options)
      .toPromise()
  }
}
