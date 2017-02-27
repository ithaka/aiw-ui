import { Injectable } from '@angular/core';
import { Location } from '@angular/common';
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
  private logUrl: string;
  // Use header rewrite proxy for local development
  // - don't use proxy for now
  private proxyUrl = '';

  private institutionObjValue: any = {};
  private institutionObjSource: BehaviorSubject<any> = new BehaviorSubject(this.institutionObjValue);
  private currentInstitutionObj: Observable<any> = this.institutionObjSource.asObservable();
  
  constructor(
    private _router:Router,
    locker:Locker,
    private http: Http,
    private location: Location,
    private angulartics: Angulartics2
  ) {
    this._storage = locker.useDriver(Locker.DRIVERS.LOCAL);
    this._router = _router;

    // these can be moved inside the if statement when we want to change services based on dev/prod
    this.subdomain = 'lively';
    this.baseUrl =  '//lively.artstor.org/library/secure'; 
    this.thumbUrl = '//mdxdv.artstor.org';
    this.IIIFUrl = '//tsprod.artstor.org/rosa-iiif-endpoint-1.0-SNAPSHOT/fpx';
    
    // Check domain
    if ( document.location.hostname.indexOf('prod.cirrostratus.org') > -1 || document.location.hostname.indexOf('lively.artstor.org') > -1 ) {
      // Prod/Lively endpoints
      this.logUrl = '//ang-ui-logger.apps.prod.cirrostratus.org/api/v1';
    } else {
      this.logUrl = '//ang-ui-logger.apps.test.cirrostratus.org/api/v1';
      // Dev/Stage endpoints
      // this.subdomain = 'stagely';
      // this.baseUrl =  '//stagely.artstor.org/library/secure'; 
      // this.thumbUrl = '//mdxstage.artstor.org';
      // this.IIIFUrl = '//tsprod.artstor.org/rosa-iiif-endpoint-1.0-SNAPSHOT/fpx';
    }
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

  public getInstitution(): Observable<any> {
    return this.currentInstitutionObj;
  }

  public setInstitution(institutionObj: any): void {
    this.institutionObjValue = institutionObj;
    this.institutionObjSource.next(this.institutionObjValue);
  }

  /**
   * Gets the roles and departments lists, which are used in the registration page
   * @returns Observable resolved with object containing: roleArray, deptArray
   */
  public getUserRoles(): Observable<any> {
    return this.http.get(this.baseUrl + "/user?_method=deptRoles")
      .map((res) => {
        return res.json() || {};
      });
  }

  public registerUser(registration: any): Observable<any> {
    let data = this.formEncode(registration);

    let header = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded' }); // form encode it
    let options = new RequestOptions({ headers: header, withCredentials: true }); // Create a request option
    return this.http.post(this.baseUrl + "/register", data , options)
      .map((data) => {
        return data.json() || {};
      });
  }

  public getRegisterError(registration: any): Observable<any> {
    return this.http.post(this.baseUrl + "/register", registration)
      .map((data) => {
        return data.json() || {};
      });
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
              this.store("stashedRoute", this.location.path(false));
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