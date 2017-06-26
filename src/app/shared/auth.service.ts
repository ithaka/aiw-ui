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
import { Observable, BehaviorSubject, Subject } from 'rxjs/Rx';
import { Angulartics2 } from 'angulartics2';

// Project dependencies
import { AnalyticsService } from '../analytics.service';

// For session timeout management

// import { LoginService } from '../login/login.service';

import { IdleWatcherUtil } from './idle-watcher';
import {Idle, DEFAULT_INTERRUPTSOURCES} from '@ng-idle/core';
import {Keepalive} from '@ng-idle/keepalive';

/**
 * Controls authorization through IP address and locally stored user object
 */

@Injectable()
export class AuthService implements CanActivate {
  private _storage: Locker;
  private baseUrl;
  private imageFpxUrl;
  private lostPassUrl;
  private hostname;
  private thumbUrl;
  private IIIFUrl;
  private logUrl: string;
  private groupUrl = '';

  private institutionObjValue: any = {};
  private institutionObjSource: BehaviorSubject<any> = new BehaviorSubject(this.institutionObjValue);
  private currentInstitutionObj: Observable<any> = this.institutionObjSource.asObservable();

  private idleState: string = 'Not started.';
  private idleUtil: IdleWatcherUtil = new IdleWatcherUtil(); // Idle watcher, session timeout values are abstracted to a utility
  public showUserInactiveModal: Subject<boolean> = new Subject(); //Set up subject observable for showing inactive user modal

  constructor(
    private _router:Router,
    // private _login: LoginService,
    locker:Locker,
    private http: Http,
    private location: Location,
    private angulartics: Angulartics2,
    private _analytics: AnalyticsService,
    private idle: Idle,
    private keepalive: Keepalive
  ) {
    this._storage = locker.useDriver(Locker.DRIVERS.LOCAL);
    this._router = _router;

    // these can be moved inside the if statement when we want to change services based on dev/prod
    this.hostname = '//beta.artstor.org';
    this.baseUrl =  '//beta.artstor.org/api/secure'; 
    this.imageFpxUrl =  '//beta.artstor.org/api/secure/imagefpx'; 
    // this.lostPassUrl =  '//beta.artstor.org/lostpw'; 
    this.lostPassUrl = '//beta.artstor.org/library/lostpw'
    this.thumbUrl = '//mdxdv.artstor.org';
    this.IIIFUrl = '//tsprod.artstor.org/rosa-iiif-endpoint-1.0-SNAPSHOT/fpx';
    
    // Check domain
    if ( document.location.hostname.indexOf('beta.artstor.org') > -1 || document.location.hostname.indexOf('prod.cirrostratus.org') > -1 || document.location.hostname.indexOf('lively.artstor.org') > -1 ) {
      // Prod/Lively endpoints
      this.logUrl = '//ang-ui-logger.apps.prod.cirrostratus.org/api/v1';
    } else if (document.location.hostname.indexOf('localhost') > -1 || document.location.hostname.indexOf('stage.artstor.org') > -1 || document.location.hostname.indexOf('test.stagely.artstor.org') > -1 || document.location.hostname.indexOf('test.cirrostratus.org') > -1) {
      // Test Endpoints
      this.hostname = '//test.stagely.artstor.org';
      this.baseUrl = '//test.stagely.artstor.org/api/secure';
      this.imageFpxUrl =  '//test.stagely.artstor.org/api/secure/imagefpx'; 
      this.lostPassUrl = '//test.stagely.artstor.org/library/lostpw'; 
      this.IIIFUrl = '//tsprod.artstor.org/rosa-iiif-endpoint-1.0-SNAPSHOT/fpx';
      this.logUrl = '//ang-ui-logger.apps.test.cirrostratus.org/api/v1';
    } else if( document.location.hostname.indexOf('ang-ui-earth.apps.test.cirrostratus.org') > -1 ) {
      // Earth test instance endpoints
      this.hostname = '//artstor-earth-library.apps.test.cirrostratus.org';
      this.baseUrl = '//artstor-earth-library.apps.test.cirrostratus.org/secure';
    }


    // For session timeout on user inactivity
    idle.setIdle(this.idleUtil.generateIdleTime()); // Set an idle time of 1 min, before starting to watch for timeout
    idle.setTimeout(this.idleUtil.generateSessionLength()); // Log user out after 90 mins of inactivity
    idle.setInterrupts(DEFAULT_INTERRUPTSOURCES);

    idle.onIdleEnd.subscribe(() => {
      this.idleState = 'No longer idle.';
      // console.log(this.idleState);
    });
    idle.onTimeout.subscribe(() => {
      let user = this.getUser();
      // console.log(user);
      if(user && user.isLoggedIn){
        this.expireSession();
        this.showUserInactiveModal.next(true);
        this.idleState = 'Timed out!';
        // console.log(this.idleState);
      }
      else{
        this.resetIdleWatcher()
      }
    });
    idle.onIdleStart.subscribe(() => {
      this.idleState = 'You\'ve gone idle!';
      // console.log(this.idleState);

      let currentDateTime = new Date().toUTCString();
      this._storage.set('userGoneIdleAt', currentDateTime);
    });
    idle.onTimeoutWarning.subscribe((countdown) => {
      this.idleState = 'You will time out in ' + countdown + ' seconds!'
      // console.log(this.idleState);
    });

    this.resetIdleWatcher();
  }



  // Reset the idle watcher
  public resetIdleWatcher(): void {
    this.idle.watch();
    this.idleState = 'Idle watcher started';
    // console.log(this.idleState);
  }

  private expireSession(): void {
    this.logoutUser()
      .then(() => {
        this._router.navigate(['/login']);
      })
  }

  /**
   * Logs out and redirects the user to the login component
   */
  private logoutUser() {
      let header = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded' }); // ... Set content type to JSON
      let options = new RequestOptions({ headers: header, withCredentials: true });

      this.clearStorage();
      return this.http
          .post(this.getUrl() + '/logout', {}, options)
          .toPromise()
          .catch(function(err) {
              // error handling
              console.error(err)
          });
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
    // Update Analytics object
    this._analytics.setUserInstitution(institutionObj.institutionId ? institutionObj.institutionId : '')
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

  /** Calls service to register a user
   * @param registration should have properties: _method="update", username, password, role, dept, info<boolean>, survey<boolean>
   */
  public registerUser(registration: any): Observable<any> {
    let data = this.formEncode(registration);

    let header = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded' }); // form encode it
    let options = new RequestOptions({ headers: header, withCredentials: true }); // Create a request option
    return this.http.post(this.baseUrl + "/register", data , options)
      .map((data) => {
        return data.json() || {};
      });
  }

  public changePassword(oldPass: string, newPass: string): Observable<any> {
    let header = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded' }); // form encode it
    let options = new RequestOptions({ headers: header, withCredentials: true }); // Create a request option
    let data = this.formEncode({
      _method: "updatePassword",
      oldPassword: oldPass,
      password: newPass
    });

    return this.http.post(this.baseUrl + "/profile", data, options)
      .map((res) => {
        return res.json() || {};
      });
  }

  /**
   * Takes a response object and turn the data into a json object
   */
  public extractData(res: Response): any {
      let body = res.json();
      return body || { };
  }
  
  public getUrl(): string {
    return this.baseUrl;
  }

  public getImageFpxUrl(): string {
    return this.imageFpxUrl;
  }

  public getLostPassUrl(): string {
    return this.lostPassUrl;
  }

  public getHostname(): string {
    return this.hostname;
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
    return this.getHostname() + '/media';
  }

  /**
   * Saves user to local storage
   * @param user The user should be an object to store in sessionstorage
   */
  public saveUser(user: any) {
    //should have session timeout, username, baseProfileId, typeId
    this._storage.set('user', user);
    // Set analytics object
    this._analytics.setUserInstitution(user.institutionId ? user.institutionId : '')
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
              if (jsonData.isRememberMe || jsonData.remoteaccess) {
                user.isLoggedIn = true
              } 
              
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

  public getUserInfo(): Observable<any> {
    let options = new RequestOptions({ withCredentials: true });

    return this.http
      .get(this.getUrl() + '/userinfo', options)
      .map(
        (res)  => {
          try {
            let data = res.json() || {};
            if (data.status === true) {
              // User is authorized - if you want to check ipAuth then you can tell on the individual route by user.isLoggedIn = false
              let user = data.user;
              if (data.isRememberMe || data.remoteaccess) {
                user.isLoggedIn = true
              } 
              this.saveUser(user);
            } 
            return data;
          } catch (err) {
            console.error(err);
          }
        }
      )
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