import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { map } from 'rxjs/operators'

// Project dependencies
// import { AuthService } from '../shared/auth.service'
import { CategoryName } from '../shared/datatypes'
import { environment } from 'environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CollectionService {

  constructor(
    private http: HttpClient
  ) {}

  /**
   * Get Collection
   */
  /**
  * Get metadata about a collection
  * @param colId The collection ID
  */
  public getCollectionInfo(colId: string) {
    let options = { withCredentials: true };

    return this.http
      .get(environment.API_URL + '/api/v1/collections/' + colId, options)
      .toPromise();
  }

  /**
   * Get description metadata about a Category
   * @param catId The Category ID
   */
  public getCategoryDescription(catId: string) {
    let options = { withCredentials: true };

    return this.http
      .get(environment.API_URL + '/api/v1/categorydesc/' + catId, options)
      .toPromise()
  }


  public getCategoryNames(): Promise<CategoryName[]> {
    let options = { withCredentials: true }

    return this.http
      .get(environment.API_URL + '/api/v1/collections/103/categorynames', options)
      .pipe(map(res => {
        if (res && res[0]) {
          return <CategoryName[]>res
        } else {
          return <CategoryName[]>[]
        }
      }))
      .toPromise()
  }

  /**
   * Wrapper function for HTTP call to get collections. Used by home component
   * @param type Can either be 'ssc' or 'institution'
   * @returns Chainable promise containing collection data
   */
  public getCollectionsList(type?: string) {
    let options = { withCredentials: true };
    // Returns all of the collections names
    return this.http
      .get(environment.API_URL + '/api/v1/collections/', options).pipe(
        map(res => {
          if (type) {
            let data = res

            if (type == 'institution') {
              data['Collections'] = data['Collections'].filter((collection) => {
                return collection.collectionType == 2 || collection.collectionType == 4
              })
            }
            if (type == 'ssc') {
              data['Collections'] = data['Collections'].filter((collection) => {
                return collection.collectionType == 5
              })
            }

            return data
          } else {
            return res
          }
        }
        ))
  }
}
