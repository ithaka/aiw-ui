import { Injectable, EventEmitter } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Router } from '@angular/router';
import 'rxjs/add/operator/toPromise';
import { Observable, BehaviorSubject } from 'rxjs/Rx';

import { AuthService, ImageGroupDescription } from './../shared';

/**
 * 
 * OLD SERVICE FOR GROUPS
 * 
 * THIS SERVICE IS DEPRECATED
 *  
 */

@Injectable()
export class ImageGroupService {
  private proxyUrl = '';
  private baseUrl: string;

  private header = new Headers({ 'Content-Type': 'application/json' }); // ... Set content type to JSON
  private options = new RequestOptions({ withCredentials: true }); // Create a request option

  private assetsValue: any[] = [];
  // BehaviorSubjects push last value on subscribe
  private assetsSource = new BehaviorSubject<any>(this.assetsValue);
  public assets = this.assetsSource.asObservable();
  
  public igDownloadTrigger: EventEmitter<any> = new EventEmitter();

  constructor(private _router: Router, private http: Http, private _auth: AuthService ){
    this.baseUrl = this._auth.getUrl();
  }
  
  /**
   * Get image group description from image group id
   * @param groupId Id of desired image group
   * @returns JS Object with parameters: count, igId, igName, igNotes and more if it is a folder
   */
  getGroupDescription(groupId: string): Observable<ImageGroupDescription> {
    let requestUrl = [this.baseUrl, "imagegroup", groupId].join("/") + "?_method=igdescription";

    return this.http
      .get(requestUrl, this.options)
        .map((data) => {
          if (!data) {
            throw new Error("No data in image group description response");
          }
          return data.json() || {};
        });
  }

  /**
   * Load image group assets
   * @param igId Image group id for which to retrieve assets
   * @param startIndex Starting index for the image group assets
   */
  loadIgAssets(igId: string, startIndex: number): void {
      let requestString: string = [this._auth.getUrl(), "imagegroup",igId, "thumbnails", startIndex, 72, 0].join("/");
      this.http
          .get(requestString, this.options)
          .toPromise()
          .then(
            (res) => {
                this.assetsSource.next(res.json());
          });
  }

  /** 
   * Returns the numbers for how many images a user can download 
   * @param igId The image group's id
   * @returns observable resolved with object containing: alreadyDwnldImgCnt, curAllowedDwnldCnt, igImgCount<number>, pptExportAllowed<boolean>, nonPrivateImgCnt
  */
  public getDownloadCount(igId: string): Observable<any> {
    let header = new Headers({ 'content-type': 'application/x-www-form-urlencoded' }); 
    let options = new RequestOptions({ headers: header, withCredentials: true});
    let data = this._auth.formEncode({
      _method: "isExportToPPTAllowed",
      igId: igId
    });

    return this.http.post(this._auth.getUrl() + "/downloadpptimages", data, options)
      .map((res) => { return res.json() || {} });
  }

  public triggerIgDownload(): void {
    this.igDownloadTrigger.emit();
  }

  public triggerIgExport(): void {
    console.log('triggerIgExport called!');
  }
}