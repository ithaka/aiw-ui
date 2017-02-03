import { Injectable } from '@angular/core';
import { Locker } from 'angular2-locker';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import {
  CanActivate,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot
} from '@angular/router';
import { Observable, BehaviorSubject } from 'rxjs/Rx';
import { Angulartics2 } from 'angulartics2';

import { ToolboxService } from '.';

/**
 * Controls authorization through IP address and locally stored user object
 */

@Injectable()
export class AuthService implements CanActivate {
  private _storage: Locker;
  private baseUrl;
  private subdomain;
  private thumbUrl;
  private IIIFUrl;
  // Use header rewrite proxy for local development
  // - don't use proxy for now
  private proxyUrl = '';

  private institutionValue: string = '';
  private institutionSource: BehaviorSubject<string> = new BehaviorSubject(this.institutionValue);
  private currentInstitution: Observable<string> = this.institutionSource.asObservable();
  
  constructor(
    private _router:Router,
    locker:Locker,
    private http: Http,
    private angulartics: Angulartics2
  ) {
    this._storage = locker.useDriver(Locker.DRIVERS.LOCAL);
    this._router = _router;
    
    // Check domain
    // if ( document.location.hostname.indexOf('test.cirrostratus.org') > -1 ) {
    //   this.baseUrl = '//library-debian01.test.cirrostratus.org:8080/library/secure';
    // } else {
      this.subdomain = 'stagely';
      // this.baseUrl = 'http://192.168.97.66/library/secure';
      this.baseUrl =  '//stagely.artstor.org/library/secure'; //'//artstor-earth-library.apps.test.cirrostratus.org/secure';
      // this.baseUrl = this.proxyUrl + 'http://library.artstor.org/library/secure';
    // }
      this.thumbUrl = '//mdxstage.artstor.org';
      this.IIIFUrl = '//tsprod.artstor.org/rosa-iiif-endpoint-1.0-SNAPSHOT/fpx';

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

  public getInstitution(): Observable<string> {
    return this.currentInstitution;
  }

  public setInstitution(institution: string): void {
    this.institutionValue = institution;
    this.institutionSource.next(this.institutionValue);
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

  public getSubdomain(): string {
    return this.subdomain;
  }

  public getIIIFUrl(): string {
    return this.IIIFUrl;
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
    // This is a special case, and should always points to library.artstor or stage 
    return 'http://proxy.' + this.getSubdomain() + '.artstor.org/media';
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
    // If user object already exists, we're done here
    if (this.getUser()) { 
      return new Observable(observer => {
          observer.next(true);  
      });
    }

    // If user object doesn't exist, try to get one!
    return new Observable(observer => {
      this.http
      .get(this.getUrl() + '/userinfo', options)
      .map(
        (data)  => {
          try {
            let jsonData = data.json() || {};
            if (jsonData.status === true) {
              // User is authorized - if you want to check ipAuth then you can tell on the individual route by user.isLoggedIn = false
              let user = jsonData.user;
              this.saveUser(user);
              return true;
            } else {
              // store the route so that we know where to put them after login!
              this.store("stashedRoute", _tool.urlToString(route));
              return false;
            }
          } catch (err) {
            console.error(err);
            return false;
          }
        }
      )
      .subscribe(res => {
          // CanActivate is not handling the Observable value properly, 
          // ... so we do an extra redirect in here
          if (res === false) {
            this._router.navigate(['/login']);
          }
          observer.next(res); 
        }, err => {
          this._router.navigate(['/login']);
          observer.next(false);
      });
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