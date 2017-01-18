import { Injectable } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Router } from '@angular/router';
import 'rxjs/add/operator/toPromise';
import { Observable } from 'rxjs/Observable';

import { AuthService } from './../shared/auth.service';

@Injectable()
export class ImageGroupService {
  private proxyUrl = '';
  // private baseUrl =  this.proxyUrl + 'http://library.artstor.org/library/secure';
  private baseUrl = 'http://stagely.artstor.org/library/secure';

  private header = new Headers({ 'Content-Type': 'application/json' }); // ... Set content type to JSON
  private options = new RequestOptions({ withCredentials: true }); // Create a request option

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
      .then((data) => { return this._auth.extractData(data); });
  }
  
  /**
   * Get image group description from image group id
   * @param groupId Id of desired image group
   * @returns JS Object with parameters: count, igId, igName, igNotes and more if it is a folder
   */
  getGroupDescription(groupId: string): Observable<string> {
    let requestUrl = [this.baseUrl, "imagegroup", groupId].join("/") + "?_method=igdescription";

    return this.http
      .get(requestUrl, this.options)
        .map((data) => {
          if (!data) {
            throw new Error("No data in image group description response");
          }
          return data.json().igNotes;
        });
  }

  /**
   * Get image group data from image group id
   * @param groupId Id of desired image group
   * @returns JS Object with parameters: count, igId, igName, igNotes and more if it is a folder
   */
  getGroupData(groupId: string): Observable<string> {
    let requestUrl = [this.baseUrl, "imagegroup", groupId].join("/") + "?_method=igdescription";

    return this.http
      .get(requestUrl, this.options)
        .map((data) => {
          if (!data) {
            throw new Error("No data in image group description response");
          }
          return data.json();
        });
  }

  /**
   * Load image group assets
   * @param igId Image group id for which to retrieve assets
   */
  loadIgAssets(igId: string): Observable<string> {
      let requestString: string = [this._auth.getUrl(), "imagegroup",igId, "thumbnails", 1, 24, 0].join("/");

      return this.http
          .get(requestString, this.options)
          .map((data) => {
            if (!data) {
              throw new Error("No data in image group description response");
            }
            return data.json();
          });
  }
}