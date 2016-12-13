import { Injectable } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Router } from '@angular/router';
import 'rxjs/add/operator/toPromise';

import { AuthService } from './../shared/auth.service';

@Injectable()
export class ImageGroupService {
  private proxyUrl = 'http://rocky-cliffs-9470.herokuapp.com/api?url=';
  private baseUrl =  this.proxyUrl + 'http://library.artstor.org/library/secure';

  private header = new Headers({ 'Content-Type': 'application/json' }); // ... Set content type to JSON
  private options = new RequestOptions({ headers: this.header, withCredentials: true }); // Create a request option

  constructor(private _router: Router, private http: Http, private _auth: AuthService ){
  }

  /**
   * Get an image group from folder IDs
   * @param folderId A single folder id for which to get the image group description
   */
  getFromFolderId(folderId: string): Promise<any> {

    return this.http
      .get(this.baseUrl + "/folders/" + folderId + "/imagegroups?studWkFldrs=true", this.options)
      .toPromise()
      .then((data) => { return this._auth.extractData(data); });
  }


  /**
   * Get array of folder and image group information
   * @param catIds An array of category ids which contain image groups
   * @returns Array of JS Objects with image group and folder ids & info
   */
  getFromCatId(catId: string) {
    return this.http
      .get(this.baseUrl + "/categories/" + catId + "/subcategories", this.options)
      .toPromise()
      .then((data) => {
        console.log(data);
        return this._auth.extractData(data);
      });
  }
  // http://library.artstor.org/library/secure/categories/1034568975/thumbnails/1/72/0
}