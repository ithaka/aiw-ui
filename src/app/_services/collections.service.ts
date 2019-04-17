import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'

// Project dependencies
import { AuthService } from '../shared';

@Injectable({
  providedIn: 'root'
})
export class CollectionsService {

  constructor(
    private http: HttpClient,
    private _auth:  AuthService
  ) {}

  /**
   * Get metadata about a Category
   * @param catId The Category ID
   */
  public getCategoryInfo(catId: string) {
    let options = { withCredentials: true };

    return this.http
      .get(this._auth.getUrl() + '/api/v1/categorydesc/' + catId, options)
      .toPromise()
  }
}
