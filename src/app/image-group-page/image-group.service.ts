import { Injectable } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Router } from '@angular/router';
import 'rxjs/add/operator/toPromise';

import { AuthService } from './../shared/auth.service';

@Injectable()
export class ImageGroupService {
  private proxyUrl = 'http://rocky-cliffs-9470.herokuapp.com/api?url=';
  private baseUrl =  this.proxyUrl + 'http://library.artstor.org/library/secure';

  constructor(private _router: Router, private http: Http, private _auth: AuthService ){
  }

  /**
   * Get an image group from folder IDs
   * @param folderId A single folder id for which to get the image group description
   */
  getFromFolderId(folderId: string): Promise<any> {
    let header = new Headers({ 'Content-Type': 'application/json' }); // ... Set content type to JSON
    let options = new RequestOptions({ headers: header, withCredentials: true }); // Create a request option

    return this.http
      .get(this.baseUrl + "/folders/" + folderId + "/imagegroups?studWkFldrs=true", options)
      .toPromise()
      .then((data) => { return this._auth.extractData(data); });
  }


  // /**
  //  * Get an image group from a category id
  //  * @param catIds An array of category ids which contain image groups
  //  */
  // getFromCatId(catIds: string[]) {
  //   for (let id of catIds) {
  //   return this.http
  //     .get(this.baseUrl + "/categories/" + catIds + "")
  //     .toPromise()
  //     .then(
  //       (data) => { console.log(data); },
  //       (error) => { console.log(error); }
  //     )
  //   }
  // }
}