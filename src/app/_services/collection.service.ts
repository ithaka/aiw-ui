import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'

// Project dependencies
import { AuthService } from '../shared'
import { CategoryName } from '../shared/datatypes'

@Injectable({
  providedIn: 'root'
})
export class CollectionService {

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


  public getCategoryNames(): Promise<CategoryName[]> {
    let options = { withCredentials: true }

    return this.http
      .get(this._auth.getHostname() + '/api/v1/collections/103/categorynames', options)
      .toPromise()
      .then(res => {
        if (res && res[0]) {
          return <CategoryName[]>res
        } else {
          return <CategoryName[]>[]
        }
      })
  }
}
