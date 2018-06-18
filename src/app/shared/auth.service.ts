import { Injectable } from '@angular/core'
import { Location } from '@angular/common'
import { Locker } from 'angular2-locker'
import { HttpClient, HttpHeaders } from '@angular/common/http'
import {
  CanActivate,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot
} from '@angular/router'
import { Observable, BehaviorSubject, Subject } from 'rxjs/Rx'
import { Angulartics2 } from 'angulartics2'

// Project dependencies
import { AnalyticsService } from '../analytics.service'
import { AppConfig } from '../app.service'

// Import beta tester emails
import { BETA_USR_EMAILS } from '../beta-users-email.ts'

// For session timeout management

// import { LoginService } from '../login/login.service'

import { IdleWatcherUtil } from './idle-watcher'
import {Idle, DEFAULT_INTERRUPTSOURCES} from '@ng-idle/core'
import {Keepalive} from '@ng-idle/keepalive'
import { FlagService } from '.'

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
  public showUserInactiveModal: Subject<boolean> = new Subject(); //Set up subject observable for showing inactive user modal

  private betausers: Array<string>

  /**
   * We need to make SURE /userinfo is not cached
   * - Successful login returns a 302 to /userinfo, which IE 11 is more than happy to cache :(
   * - We make every /userinfo call unique to ensure a response is never reused
   * - 'no-store' > 'no-cache' in denying caching
   */
  private userInfoHeader: HttpHeaders = new HttpHeaders().set('Cache-Control', 'no-store, no-cache')
  private genUserInfoUrl() : string {
    return this.getUrl(true) + '/userinfo?no-cache=' + new Date().valueOf()
  }

  constructor(
    private _router:Router,
    // private _login: LoginService,
    locker:Locker,
    private http: HttpClient,
    private location: Location,
    private angulartics: Angulartics2,
    private _analytics: AnalyticsService,
    private _app: AppConfig,
    private _flags: FlagService,
    private idle: Idle,
    private keepalive: Keepalive
  ) {
    this._storage = locker.useDriver(Locker.DRIVERS.LOCAL);
    this._router = _router;

    // Default to relative or prod endpoints
    this.ENV = 'prod'
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
      'sahara.artstor.org'
    ]

    // Check domain
    if (  new RegExp(prodHostnames.join("|")).test(document.location.hostname)  ) {
      // Explicit live endpoints
      this.logUrl = '//ang-ui-logger.apps.prod.cirrostratus.org/api/v1'
      this.solrUrl = '/api/search/v1.0/search'
      this.ENV = 'prod'
    }
    else if ( document.location.hostname.indexOf('prod.cirrostratus.org') > -1 ) {
      console.info("Using Prod Endpoints (Absolute)")
      // Prod/Lively endpoints
      this.hostname = '//library.artstor.org'
      this.baseUrl =  '//library.artstor.org/api'
      this.logUrl = '//ang-ui-logger.apps.prod.cirrostratus.org/api/v1'
      this.solrUrl = this.hostname + '/api/search/v1.0/search'
      this.ENV = 'prod'
    } else if ( new RegExp(testHostnames.join("|")).test(document.location.hostname) ) {
      console.info("Using Test Endpoints")
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
      this.ENV = 'test'
    }

    // Sahara routing WORKAROUND
    if (document.location.hostname.indexOf('sahara.beta.stage.artstor.org') > -1) {
      this.hostname = '//sahara.beta.stage.artstor.org'
      this.ENV = 'test'
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
    idle.setIdle(IdleWatcherUtil.generateIdleTime()); // Set an idle time of 1 min, before starting to watch for timeout
    idle.setTimeout(IdleWatcherUtil.generateSessionLength()); // Log user out after 90 mins of inactivity
    idle.setInterrupts(DEFAULT_INTERRUPTSOURCES);

    idle.onIdleEnd.subscribe(() => {
      this.idleState = 'No longer idle.';
      // We want to ensure a user is refreshed as soon as they return to the tab
      this.refreshUserSession(true)
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

    // Init idle watcher
    this.resetIdleWatcher()

    // Initialize user and institution objects from localstorage
    this.userSource.next(this.getUser())
    let institution = this._storage.get('institution')
    if (institution) { this.institutionObjSource.next(institution) }

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
    
    // Set beta users email
    this.betausers = Object.assign(BETA_USR_EMAILS)
  }

  // Reset the idle watcher
  public resetIdleWatcher(): void {
    this.idle.watch();
    // When a user comes back, we don't want to wait for the time interval to refresh the session
    this.refreshUserSession(true)
  }

  private refreshUserSessionInProgress: boolean = false
  public refreshUserSession(triggerSessionExpModal?: boolean): void {
    // cancel out if we're currently getting the user session
    if (this.refreshUserSessionInProgress && !triggerSessionExpModal) { return }

    // set to true so we don't have multiple /userinfo calls going on at once
    this.refreshUserSessionInProgress = true
    this.getUserInfo(triggerSessionExpModal).take(1).toPromise()
      .then(res => {
        this.refreshUserSessionInProgress = false
        console.info('Access Token refreshed <3')
      })
      .catch(err => {
        this.refreshUserSessionInProgress = false
        console.error('Access Token refresh failed </3')
      })
  }

  private expireSession(): void {
    this.logout()
      .then(() => {
        // We want the user to see the "Session Expired" modal triggered by this.refreshUserSession() & this.getUserInfo()
        // Do not route user away
      })
  }

  /**
   * Logs out and redirects the user to the login component
   */
  public logout() {
      // Stop, unwatch Idle session. Note: resetIdleWatcher() calls watch, and is called from login component
      this.idle.stop()

      let header = new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded'); // ... Set content type to JSON
      let options = { headers: header, withCredentials: true };

      // Clear local user object, and other settings
      this.clearStorage()
      // Clear observables
      this.userSource.next({})
      this.institutionObjSource.next({})

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
  private refreshUserInstitution() {
    let options = { withCredentials: true }
    // Returns all of the collections names
    return this.http
      .get(this.getUrl() + '/v2/institution', options)
      .toPromise()
      .then((data) => {
        this.setInstitution(data)
        // this.institutionRefreshInProgress = false
        return data
      })
      .catch((err) => {
        // this.institutionRefreshInProgress = false
        if (err && err.status != 401 && err.status != 403) {
          console.error(err)
        }
      })
  }

  public getInstitution(): Observable<any> {
    return this.currentInstitutionObj;
  }

  public setInstitution(institutionObj: any): void {
    // Save to local storage
    this._storage.set('institution', institutionObj)
    // Update Observable
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
  }

  /** Calls service to register a user
   * @param registration should have properties: _method="update", username, password, role, dept, info<boolean>, survey<boolean>
   */
  public registerUser(registration: any): Observable<any> {
    let data = this.formEncode(registration);

    let header = new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded'); // form encode it
    let options = { headers: header, withCredentials: true }; // Create a request option
    return this.http.post(this.getUrl(true) + "/register", data , options);
  }

  /**
   * Shibboleth/Saml registration
   * @param registration in addition to regular registration form, requires "samlTokenId" property
   */
  public registerSamlUser(registration: any): Observable<any> {
    // Clear method used for regular registration
    registration["_method"] = null
    // // Encode da
    // let dataStr = this.formEncode(registration)
    let header = new HttpHeaders().set('Content-Type', 'application/json')
    let options = { headers: header, withCredentials: true }
    
    return this.http.post(this.getHostname() + "/saml/user/create", registration , options)
  }

  /**
   * Shibboleth/Saml linking
   * @param user Artstor login credentials requires "username", "password", and "samlTokenId"
   */
  public linkSamlUser(credentials: any): Promise<any> {
    let header = new HttpHeaders().set('Content-Type', 'application/json')
    let options = { headers: header, withCredentials: true }

    return this.http.post(this.getHostname() + "/saml/user/link", credentials , options)
      .toPromise()
  }

  public changePassword(oldPass: string, newPass: string): Observable<any> {
    let header = new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded'); // form encode it
    let options = { headers: header, withCredentials: true }; // Create a request option
    let data = this.formEncode({
      _method: "updatePassword",
      oldPassword: oldPass,
      password: newPass
    });

    return this.http.post(this.getUrl(true) + "/profile", data, options)
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
    // short-circuit this function so it can't be used to replace an existing user with a non-existing one
    //  clearing the user should only be done using the logout function
    let currentUser = this._storage.get('user')
    if (currentUser && currentUser.username && !user.username) { return }
    
    // Should have session timeout, username, baseProfileId, typeId
    this._storage.set('user', user);
    // only do these things if the user is ip auth'd or logged in and the user has changed
    let institution = this.institutionObjSource.getValue();
    if (user.status && (!institution.institutionId || user.institutionId != institution.institutionId)) {
      // Refresh institution object
      this.refreshUserInstitution()
    }
    // Update observable
    this.userSource.next(user)
    // Set analytics object
    this._analytics.setUserInstitution(user.institutionId ? user.institutionId : '')
    
    // if (user.status && (this._storage.get('user').username != user.username || !institution.institutionid)) {
  }

  /**
   * Gets user object from local storage
   */
  public getUser() : any {
      return this._storage.get('user') ? this._storage.get('user') : {};
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
    let options = { headers: this.userInfoHeader, withCredentials: true }

    if (this.isPublicOnly() && state.url.includes('/register')) { // For unaffiliated users, trying to access /register route
      return new Observable(observer => {
        observer.next(false)
      })
    } else if (this.canUserAccess(this.getUser()) || route.params.samlTokenId) { // If user object already exists, we're done here
      return new Observable(observer => {
        observer.next(true)
      })
    } 

    // If user object doesn't exist, try to get one!
    return new Observable(observer => {
      this.http
      .get(this.genUserInfoUrl(), options)
      .map(
        (data)  => {
          let user = this.decorateValidUser(data)
          let onSahara: boolean = this.getHostname().toString().includes('sahara')
          if (user && (!onSahara || user.status)) {
            // Clear expired session modal
            this.showUserInactiveModal.next(false)
            // Update user object
            this.saveUser(user)
            return true
          } else {
            this.logout()
            // Store the route so that we know where to put them after login!
            this.store("stashedRoute", this.location.path(false))
            return false
          }
        }
      )
      .subscribe(res => {
          // CanActivate is not handling the Observable value properly,
          // ... so we do an extra redirect in here
          if (res === false) {
            this._router.navigate(['/login'])
          }
          observer.next(res)
        }, err => {
          this._router.navigate(['/login'])
          observer.next(false)
      })
    })
  }

  /**
   * Asks the back-end for the user's info and a fresh set of cookies
   * @param triggerSessionExpModal Sometimes this is called after unsuccessful logins, and we don't want failovers to always trigger the modal, so it's an option
   */
  public getUserInfo(triggerSessionExpModal?: boolean): Observable<any> {
    let options = { headers: this.userInfoHeader, withCredentials: true };

    return this.http
      .get(this.genUserInfoUrl(), options)
      .map(
        (data)  => {
          let user = this.decorateValidUser(data)
          if (user) {
            // Clear expired session modal
            this.showUserInactiveModal.next(false)
            // Update user object
            this.saveUser(user)
          } else {
            // Clear user session (local objects and cookies)
            this.logout()
            if (triggerSessionExpModal === true) {
              this.showUserInactiveModal.next(triggerSessionExpModal)
            }
          }
          return data
        }
      )
  }

  /**
   * Decorates and Validates user from the user response
   * - Used to verify that we want the user object
   * - Used to decorate the user object for saving
   */
  private decorateValidUser(data: any) : any {
    let currentUser = this.getUser()
    let currentUsername = currentUser.username

    if (data['status'] === true && (!currentUsername || data['user'].username == currentUsername)) {
      // User is authorized - if you want to check ipAuth then you can tell on the individual route by user.isLoggedIn = false
      let user = data['user']
      user.status = data['status']
      if (data['isRememberMe'] || data['remoteaccess']) {
        user.isLoggedIn = true
      }

      // Save ipAuthed flag to user object
      user.ipAuthed = !user.isLoggedIn && user.status ? true : false

      if (this.canUserAccess(user)) {
        return user
      } else {
        return null
      }
    } else if(!data['status'] && this._flags.unaffiliated) {
      // Return generic user object for unaffiliated users
      let user = {
        'unaffliatedUser' : true,
        'status' : data['status'],
        'isLoggedIn' : false
      }
      return user
    } else {
      return null
    }
  }

  private canUserAccess(user: any): boolean {
    return user && user.hasOwnProperty('status') && (this._app.config.disableIPAuth === true ? user.isLoggedIn : true)
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
     * Logs user in
     * @param user User must have username (which is an email address) and password to be passed in the request
     */
    login(user: User) : Promise<any> {
        let header = new HttpHeaders().set('Cache-Control', 'no-store, no-cache').set('Content-Type', 'application/x-www-form-urlencoded'); // ... Set content type to JSON
        let options = { headers: header, withCredentials: true }; // Create a request option
        let data = this.formEncode({
                'j_username': user.username.toLowerCase(),
                'j_password': user.password
            });

        return this.http
            .post(this.getUrl(true) + '/login', data, options)
            .toPromise();
    }

    getLoginError(user: User) {
        let header = new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded'); // ... Set content type to JSON
        let options = { headers: header, withCredentials: true }; // Create a request option

        return this.http
            .get(this.getUrl(true) + '/login?j_username=' + encodeURIComponent(user.username) + '&j_password=' + encodeURIComponent(user.password) )
            .toPromise();
    }

    getInstitutions() {
        let url = this.getHostname() + '/api/institutions?_method=shibbolethOnly';

        return this.http
            .get(url)
            .toPromise();
    }

    pwdReset(email: string) {
        let options = { withCredentials: true };

        return this.http
            .get(this.getUrl() + '/lostpw?email=' + email.toLowerCase() + '&portal=' + this._app.config.pwResetPortal, options)
            .toPromise();
    }

  /**
   * This is the same call we use in canActivate to determine if the user is IP Auth'd
   * @returns json which should have
   */
  public getIpAuth(): Observable<any> {
    let options = { headers: this.userInfoHeader, withCredentials: true };
    return this.http.get(this.genUserInfoUrl(), options)
  }



  /**
   * Gets user's geo IP information
   * @returns Observable resolved with object containing geo IP information
   */
  public getUserIP(): Observable<any> {
    return this.http.get("https://freegeoip.net/json/")
  }

  public ssLogin(username: string, password: string): Observable<SSLoginResponse> {

    let data = this.formEncode({ username: username, password: password })
    let headers = new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded')
    return this.http.post<SSLoginResponse>(
      [this.hostname, "gust", "login"].join("/"),
      data,
      { withCredentials: true, headers: headers }
    )
  }


  /**
   * Check if the logged-in username matches the beta tester emails
   */
  public isBetaUser(): boolean{
    let isBeta: boolean = false
    let loggedInUser: any = this.getUser()
    if(loggedInUser && loggedInUser.username){
      isBeta = this.betausers.indexOf(loggedInUser.username) > -1
    }
    return isBeta
  }

  public isPublicOnly(): boolean{
    return this._flags.unaffiliated && !(this.getUser() && this.getUser().status)
  }
}

export class User {
  public samlTokenId: string
  constructor(
    public username: string,
    public password: string,
  ) {}
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
