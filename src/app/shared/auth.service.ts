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
import { AppConfig } from '../app.service';

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
  private ENV: string;
  private baseUrl;
  private imageFpxUrl;
  private lostPassUrl;
  private hostname;
  private subdomain;
  private thumbUrl;
  private IIIFUrl;
  private logUrl: string;
  private groupUrl = '';
  private solrUrl: string;

  private institutionObjValue: any = {};
  private institutionObjSource: BehaviorSubject<any> = new BehaviorSubject(this.institutionObjValue);
  private currentInstitutionObj: Observable<any> = this.institutionObjSource.asObservable();

  private userSource: BehaviorSubject<any> = new BehaviorSubject({});
  public currentUser: Observable<any> = this.userSource.asObservable();

  private idleState: string = 'Not started.';
  private idleUtil: IdleWatcherUtil = new IdleWatcherUtil(); // Idle watcher, session timeout values are abstracted to a utility
  public showUserInactiveModal: Subject<boolean> = new Subject(); //Set up subject observable for showing inactive user modal

  /**
   * Global Feature Flag object
   * - Keep updated when flags are added or removed, for reference
   * - Update via url param subscriptions inside of relevant components
   */
  public featureFlags = {
    pcUpload : false
  }

  constructor(
    private _router:Router,
    // private _login: LoginService,
    locker:Locker,
    private http: Http,
    private location: Location,
    private angulartics: Angulartics2,
    private _analytics: AnalyticsService,
    private _app: AppConfig,
    private idle: Idle,
    private keepalive: Keepalive
  ) {
    this._storage = locker.useDriver(Locker.DRIVERS.LOCAL);
    this._router = _router;

    // Default to relative or prod endpoints
    this.ENV = 'test'
    this.hostname = ''
    this.baseUrl =  '/api'
    this.thumbUrl = '//mdxdv.artstor.org'
    this.IIIFUrl = '//tsprod.artstor.org/rosa-iiif-endpoint-1.0-SNAPSHOT/fpx'
    this.subdomain = 'library'
    this.solrUrl = '/api/search/v1.0/search'

    let testHostnames = [
      'localhost',
      'local.artstor.org',
      'stage.artstor.org',
      // test.artstor subdomain is used for WLVs
      'test.artstor.org',
      'test.cirrostratus.org'
    ]

    let prodHostnames = [
      'library.artstor.org',
      'beta.artstor.org',
      'proxy.artstor.org',
      // prod.artstor subdomain is used for WLVs
      'prod.artstor.org',
    ]

    // Check domain
    if (  new RegExp(prodHostnames.join("|")).test(document.location.hostname)  ) {
      // Explicit live endpoints
      this.logUrl = '//ang-ui-logger.apps.prod.cirrostratus.org/api/v1'
      this.solrUrl = '/api/search/v1.0/search'
      this.ENV = 'prod'
    }
    else if ( document.location.hostname.indexOf('prod.cirrostratus.org') > -1 ) {
      // Prod/Lively endpoints
      this.hostname = '//library.artstor.org'
      this.baseUrl =  '//library.artstor.org/api'
      this.logUrl = '//ang-ui-logger.apps.prod.cirrostratus.org/api/v1'
      this.solrUrl = '/api/search/v1.0/search'
      this.ENV = 'prod'
    } else if ( new RegExp(testHostnames.join("|")).test(document.location.hostname) ) {
      // Test Endpoints
      this.hostname = '//stage.artstor.org'
      this.subdomain = 'stage'
      this.baseUrl = '//stage.artstor.org/api'
      this.thumbUrl = '//mdxstage.artstor.org'
      this.logUrl = '//ang-ui-logger.apps.test.cirrostratus.org/api/v1'
      this.solrUrl = '/api/search/v1.0/search'
      this.IIIFUrl = '//tsstage.artstor.org/rosa-iiif-endpoint-1.0-SNAPSHOT/fpx'
      this.ENV = 'test'
    }

    // Additional Local dev domains
    if (document.location.hostname.indexOf('local.sahara') > -1) {
      this.hostname = '//sahara.beta.stage.artstor.org'
    }

    // Sahara routing WORKAROUND
    if (document.location.hostname.indexOf('sahara.beta.stage.artstor.org') > -1) {
      this.hostname = '//sahara.beta.stage.artstor.org'
    }
    if (document.location.hostname.indexOf('sahara.prod.artstor.org') > -1) {
      this.hostname = '//sahara.prod.artstor.org/'
    }

    // Local routing should point to full URL
    // * This should NEVER apply when using a proxy, as it will break authorization
    if (new RegExp(["cirrostratus.org", "localhost", "local.", "sahara.beta.stage.artstor.org", "sahara.prod.artstor.org"].join("|")).test(document.location.hostname)) {
      this.baseUrl = this.hostname + '/api'
      this.solrUrl = this.hostname + '/api/search/v1.0/search'
    }

    // For session timeout on user inactivity
    idle.setIdle(this.idleUtil.generateIdleTime()); // Set an idle time of 1 min, before starting to watch for timeout
    idle.setTimeout(this.idleUtil.generateSessionLength()); // Log user out after 90 mins of inactivity
    idle.setInterrupts(DEFAULT_INTERRUPTSOURCES);

    idle.onIdleEnd.subscribe(() => {
      this.idleState = 'No longer idle.';
    });
    idle.onTimeout.subscribe(() => {
      let user = this.getUser();
      // console.log(user);
      if(user && user.isLoggedIn){
        this.expireSession();
        this.showUserInactiveModal.next(true);
        this.idleState = 'Timed out!';
      }
      else{
        this.resetIdleWatcher()
      }
    });
    idle.onIdleStart.subscribe(() => {
      this.idleState = 'You\'ve gone idle!';

      let currentDateTime = new Date().toUTCString();
      this._storage.set('userGoneIdleAt', currentDateTime);
    });
    idle.onTimeoutWarning.subscribe((countdown) => {
      this.idleState = 'You will time out in ' + countdown + ' seconds!'
      // console.log(this.idleState);
    });

    this.resetIdleWatcher();

    // Initialize user object from localstorage
    this.userSource.next(this.getUser())

    /**
     * User Access Heartbeat
     * - Poll /userinfo every 15min
     * - Refreshs AccessToken with IAC
     */
    const userInfoInterval = 15*1000*60*60
    // Run on Init
    this.refreshUserSession()
    // Run every X mins
    setInterval(() => {
      this.refreshUserSession()
    }, userInfoInterval)
  }



  // Reset the idle watcher
  public resetIdleWatcher(): void {
    this.idle.watch();
    this.idleState = 'Idle watcher started';
    // When a user comes back, we don't want to wait for the time interval to refresh the session
    this.refreshUserSession()
  }

  private refreshUserSession(): void {
    this.getUserInfo().take(1).toPromise()
      .then(res => {
        console.info('Access Token refreshed <3')
      })
      .catch(err => {
        console.error('Access Token refresh failed </3')
      })
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

      // Clear local user object, and other settings
      this.clearStorage();

      return this.http
          .post(this.getUrl(true) + '/logout', {}, options)
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

  /**
   * Wrapper function for HTTP call to get user institution. Used by nav component
   * @returns Chainable promise containing collection data
   */
  public refreshUserInstitution() {
      let options = new RequestOptions({ withCredentials: true })
      // Returns all of the collections names
      return this.http
          .get(this.getUrl() + '/v2/institution', options)
          .toPromise()
          .then(this.extractData)
          .then((data) => {
              this._storage.set('institution', data);
              data && this.setInstitution(data);
              return data;
          });
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
    return this.http.get(this.getUrl(true) + "/user?_method=deptRoles")
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
    return this.http.post(this.getUrl(true) + "/register", data , options)
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

    return this.http.post(this.getUrl(true) + "/profile", data, options)
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

  public getUrl(secure?: boolean): string {
    let url: string = this.baseUrl
    if (secure) {
      url += "/secure"
    }
    return url
  }

  public getHostname(): string {
    return this.hostname;
  }

  public getSubdomain(): string {
    return this.subdomain;
  }

  public getIIIFUrl(): string {
    return this.IIIFUrl;
  }

  public getSearchUrl(): string {
    return this.solrUrl;
  }

  public getEnv(): string {
    return this.ENV;
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
    // Preserve added pcEnabled, determined by _assets.pccollection() call
    if (user.isLoggedIn && this.getUser().pcEnabled) {
      user.pcEnabled = true
    }
    // Should have session timeout, username, baseProfileId, typeId
    this._storage.set('user', user);
    // Update observable
    this.userSource.next(user)
    // Set analytics object
    this._analytics.setUserInstitution(user.institutionId ? user.institutionId : '')
    // Refresh institution object
    this.refreshUserInstitution()
  }

  /**
   * Gets user object from local storage
   */
  public getUser() : any {
      return this._storage.get('user') ? this._storage.get('user') : {};
  }

  /**
   * Sets pcEnabled in local storage
   */
  public setpcEnabled(pcEnabled: boolean): void {
    let user = this.getUser()
    user.pcEnabled = pcEnabled
    this.saveUser(user)
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
    if (this.canUserAccess(this.getUser())) {
      return new Observable(observer => {
          observer.next(true);
      });
    }

    // If user object doesn't exist, try to get one!
    return new Observable(observer => {
      this.http
      .get(this.getUrl(true) + '/userinfo', options)
      .map(
        (data)  => {
          try {
            let jsonData = data.json() || {};
            if (jsonData.status === true) {
              // User is authorized - if you want to check ipAuth then you can tell on the individual route by user.isLoggedIn = false
              let user = jsonData.user;
              user.status = jsonData.status
              if (jsonData.isRememberMe || jsonData.remoteaccess) {
                user.isLoggedIn = true
              }

              if (this.canUserAccess(user)) {
                this.saveUser(user)
                return true
              } else {
                return false
              }
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
      .get(this.getUrl(true) + '/userinfo', options)
      .map(
        (res)  => {
          try {
            let data = res.json() || {};
            // User has access!
            if (data.status === true) {
              // User is authorized - if you want to check ipAuth then you can tell on the individual route by user.isLoggedIn = false
              let user = data.user;
              user.status = data.status
              if (data.isRememberMe || data.remoteaccess) {
                user.isLoggedIn = true
              }
              if (this.canUserAccess(user)) {
                this.saveUser(user);
              } else {
                this.saveUser({})
                this._router.navigate(['/login'])
              }
            }
            // User does not have access!
            if (data.status === false) {
              // Clear user, and trigger router canActivate
              this.saveUser({})
              this._router.navigate(['/login'])
            }
            return data;
          } catch (err) {
            console.error(err);
          }
        }
      )
  }

  private canUserAccess(user: any): boolean {
    return user && user.hasOwnProperty('status') && (this._app.getWLVConfig().disableIPAuth === true ? user.isLoggedIn : true)
  }

  /** Getter for downloadAuthorized parameter of local storage */
  public downloadAuthorized(): boolean {
    return this._storage.get('downloadAuthorized');
  }

  /** Setter for downloadAuthorized parameter of local storage */
  public authorizeDownload(): void {
    this._storage.set('downloadAuthorized', true);
  }

    /**
     * Logs out and redirects the user to the login component
     */
    logout() {
        let header = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded' }); // ... Set content type to JSON
        let options = new RequestOptions({ headers: header, withCredentials: true });

        this.clearStorage();

        return this.http
            .post(this.getUrl(true) + '/logout', {}, options)
            .toPromise()
            .catch((err) => {
                // error handling
                console.error(err)
            });
    }

    /** BELOW IS THE STUFF THAT USED TO BE IN THE LOGIN SERVICE */

    /**
     * Logs user in
     * @param user User must have username (which is an email address) and password to be passed in the request
     */
    login(user: User) : Promise<any> {
        let header = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded' }); // ... Set content type to JSON
        let options = new RequestOptions({ headers: header, withCredentials: true }); // Create a request option
        let data = this.formEncode({
                'j_username': user.username.toLowerCase(),
                'j_password': user.password
            });

        return this.http
            .post(this.getUrl(true) + '/login', data, options)
            .toPromise()
            .then(this.extractData);
    }

    getLoginError(user: User) {
        let header = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded' }); // ... Set content type to JSON
        let options = new RequestOptions({ headers: header, withCredentials: true }); // Create a request option

        return this.http
            .get(this.getUrl(true) + '/login?j_username=' + encodeURIComponent(user.username) + '&j_password=' + encodeURIComponent(user.password) )
            .toPromise()
            .then(this.extractData);
    }

    getFallbackInstitutions() {
        let url =  '/assets/institutions-initial.json';

        return this.http
            .get(url)
            .toPromise()
            .then(this.extractData);
    }

    getInstitutions() {
        let url = this.getHostname() + '/api/institutions?_method=shibbolethOnly';

        return this.http
            .get(url)
            .toPromise()
            .then(this.extractData);
    }

    pwdReset(email: string) {
        let options = new RequestOptions({ withCredentials: true });

        return this.http
            .get(this.getUrl() + '/lostpw?email=' + email.toLowerCase() + '&portal=ARTstor', options)
            .toPromise()
            .then(this.extractData);
    }

  /**
   * This is the same call we use in canActivate to determine if the user is IP Auth'd
   * @returns json which should have
   */
  public getIpAuth(): Observable<any> {
    let options = new RequestOptions({ withCredentials: true });
    return this.http.get(this.getUrl(true) + "/userinfo", options)
        .map((res) => {
            return res.json() || {};
        });
  }



  /**
   * Gets user's geo IP information
   * @returns Observable resolved with object containing geo IP information
   */
  public getUserIP(): Observable<any> {
    return this.http.get("https://freegeoip.net/json/")
      .map((res) => {
        return res.json() || {};
      });
  }

  public ssLogin(username: string, password: string): Observable<SSLoginResponse> {

    let data = this.formEncode({ username: username, password: password })
    let headers = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded' })
    return this.http.post(
      [this.hostname, "gust", "login"].join("/"),
      data,
      { withCredentials: true, headers: headers }
    ).map((res) => { return res.json() })
  }
}

export class User {
  constructor(
    public username: string,
    public password: string) { }
}

interface SSLoginResponse {
  email: string
  firstname: string
  lastname: string
  active: boolean
  profileid: number
  userid: string
  institutionid: string
  ss: {
      admin_for: number[]
      enabled_for: number[]
  }
}
