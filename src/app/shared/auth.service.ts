import { Injectable } from '@angular/core';
import { Locker } from 'angular2-locker';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import {
  CanActivate,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot
} from '@angular/router';
import { Observable } from 'rxjs/Observable';

import { ToolboxService } from '.';

/**
 * Controls authorization through IP address and locally stored user object
 */

@Injectable()
export class AuthService implements CanActivate {
  private _storage: Locker;
  private baseUrl;
  private thumbUrl;
  // Use header rewrite proxy for local development
  // - don't use proxy for now
  private proxyUrl = ''; 
  
  constructor(private _router:Router, locker:Locker, private http: Http) {
    this._storage = locker.useDriver(Locker.DRIVERS.LOCAL);
    this._router = _router;
    
    // Check domain
    // if ( document.location.hostname.indexOf('test.cirrostratus.org') > -1 ) {
    //   this.baseUrl = '//library-debian01.test.cirrostratus.org:8080/library/secure';
    // } else {
      // this.baseUrl = 'http://192.168.97.66/library/secure';
      this.baseUrl = 'http://stagely.artstor.org/library/secure';
      // this.baseUrl = this.proxyUrl + 'http://library.artstor.org/library/secure';
    // }
      this.thumbUrl = '//mdxstage.artstor.org';

    // maintain thumb servers
    // mdxdv.artstor.org
  }


  /**
   * Encodes javascript object into a URI component
   * @param obj The object to be encoded
   */
  public formEncode(obj: Object): string {
      var encodedString = '';
      for (var key in obj) {
          if (encodedString.length !== 0) {
              encodedString += '&';
          }
          encodedString += key + '=' + encodeURIComponent(obj[key]);
      }
      return encodedString.replace(/%20/g, '+');
  }

  /**
   * Takes a response object and turn the data into a json object
   */
  public extractData(res: Response): any {
      let body = res.json();
      return body || { };
  }

  public getProxyUrl(): string {
    return this.proxyUrl;
  }
  
  public getUrl(): string {
    return this.baseUrl;
  }

  /**
   * Our thumbnails come 
   */
  public getThumbUrl(): string {
    return this.thumbUrl;
  }

  // public getPublicUrl(): string {
  //   return this.proxyUrl + 'http://library.artstor.org/library';
  // }

  /** Returns url used for downloading some media, such as documents */
  public getMediaUrl(): string {
    return 'http://proxy.stagely.artstor.org/media';
  }

  /**
   * Saves user to local storage
   * @param user The user should be an object to store in sessionstorage
   */
  public saveUser(user: any) {
    //should have session timeout, username, baseProfileId, typeId
    this._storage.set('user', user);
  }

  /**
   * Gets user object from local storage
   */
  public getUser() : any {
      return this._storage.get('user');
  }

  /** Stores an object in local storage for you - your welcome */
  public store(key: string, value: any): void {
      if (key != "user" && key != "token") {
          this._storage.set(key, value);
      }
  }

  /** Gets an object from local storage */
  public getFromStorage(key: string): any {
      return this._storage.get(key);
  }

  /** Deletes things (not user or token) from local storage */
  public deleteFromStorage(key: string): void {
      if (key != "user" && key != "token") {
          this._storage.remove(key);
      }
  }

  /** Clears all variables held in local storage */
  public clearStorage(): void {
    this._storage.clear();
  }

  /**
   * Required by implementing CanActivate, and is called on routes which are protected by canActivate: [AuthService]
   */
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {

    let _tool = new ToolboxService();
    let options = new RequestOptions({ withCredentials: true });
    return this.http
      .get(this.getUrl() + '/userinfo', options)
      .map(
        (data)  => {
          if (this.getUser()) { return true; } // should be moved out of observable when I know how...

          try {
            let jsonData = data.json();
            if (jsonData.status === true) {
              // User is authorized
              this.saveUser(jsonData.user);
              return true;
            } else {
              this.store("stashedRoute", _tool.urlToString(route));
              return false;
            }
          } catch (err) {
            console.error(err);
            return false;
          }
        },
        (error) => {
          return false;
        });
  }

  /** Getter for downloadAuthorized parameter of local storage */
  public downloadAuthorized(): boolean {
    return this._storage.get('downloadAuthorized');
  }

  /** Setter for downloadAuthorized parameter of local storage */
  public authorizeDownload(): void {
    this._storage.set('downloadAuthorized', true);
  }
}