import { Injectable, Inject, PLATFORM_ID, Injector } from '@angular/core'
import { Location, isPlatformBrowser } from '@angular/common'
import { HttpClient, HttpHeaders } from '@angular/common/http'
import {
  CanActivate,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot
} from '@angular/router'
import { Observable, BehaviorSubject, Subject, from } from 'rxjs'
import { map, take, catchError } from 'rxjs/operators'

// Project dependencies
import { AppConfig } from '../app.service'

// For session timeout management
import { IdleWatcherUtil } from 'shared/idle-watcher'
import { Idle, DEFAULT_INTERRUPTSOURCES} from '@ng-idle/core'
import { ArtstorStorageService } from '../../../projects/artstor-storage/src/public_api'
import { Angulartics2 } from 'angulartics2'
import { environment } from 'environments/environment'
/**
 * Controls authorization through IP address and locally stored user object
 */

@Injectable()
export class AuthService implements CanActivate {
  public currentUser: Observable<any>
  public currentAuthHeaders: AuthTriplet
  // Track whether or not user object has been refreshed since app opened
  public userSessionFresh: boolean = false
  public showUserInactiveModal: Subject<boolean> = new Subject(); // Set up subject observable for showing inactive user modal
  public clientHostname: string;
  public samlAvailable: boolean = false
  private ENV: string;
  private baseUrl;
  private imageFpxUrl: string;
  private lostPassUrl: string;
  private hostname: string;
  private subdomain: string;
  private thumbUrl: string;
  private compoundUrl: string;
  private IIIFUrl: string;
  private logUrl: string;
  private groupUrl = '';
  private solrUrl: string;
  private solrUrlV3: string;
  public useSearch3: boolean = false

  private institutionObjValue: any = {};
  private institutionObjSource: BehaviorSubject<any> = new BehaviorSubject(this.institutionObjValue);
  private currentInstitutionObj: Observable<any> = this.institutionObjSource.asObservable();

  private userSource: BehaviorSubject<any> = new BehaviorSubject({});
  // private user: any = {}


  private idleState: string = 'Not started.';

  private isOpenAccess: boolean;

  /**
   * We need to make SURE /userinfo is not cached
   * - Successful login returns a 302 to /userinfo, which IE 11 is more than happy to cache :(
   * - We make every /userinfo call unique to ensure a response is never reused
   * - 'no-store' > 'no-cache' in denying caching
   */
  private userInfoHeader: HttpHeaders = new HttpHeaders().set('Cache-Control', 'no-store, no-cache')

  private refreshUserSessionInProgress: boolean = false

  private isBrowser: boolean

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private _router: Router,
    private _storage: ArtstorStorageService,
    private http: HttpClient,
    private location: Location,
    private _app: AppConfig,
    private idle: Idle,
    private injector: Injector,
    private angulartics: Angulartics2
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId)
    // Set WLV and App Config variables
    this.isOpenAccess = this._app.config.isOpenAccess
    this.clientHostname = this._app.clientHostname
    console.log("_auth start Client hostname: " + this.clientHostname)
    // Initialize observables
    this.currentUser = this.userSource.asObservable()
    // Default to relative or prod endpoints
    this.ENV = 'prod'
    this.hostname = ''
    this.thumbUrl = '//mdxdv.artstor.org'
    this.compoundUrl = '//stor.artstor.org/stor'
    this.IIIFUrl = '//tsprod.artstor.org/rosa-iiif-endpoint-1.0-SNAPSHOT/fpx'
    this.subdomain = 'library'
    this.solrUrl = '/api/search/v1.0/search'
    this.solrUrlV3 = '/api/search/v3.0/search'
    // Variables set via environment rather than hostname
    this.baseUrl =  environment.API_URL + '/api'


    let testHostnames = [
      'localhost',
      'localhost:3000',
      'localhost:4000',
      'local.artstor.org',
      'stage.artstor.org',
      'beta.stage.artstor.org',
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

    let samlHostnames = [
      'library.artstor.org',
      'stage.artstor.org',
      'localhost',
      'localhost:3000'
    ]

    // Check domain
    if (  new RegExp(prodHostnames.join('|')).test(this.clientHostname)  ) {
      // Explicit live endpoints
      this.logUrl = '//ang-ui-logger.apps.prod.cirrostratus.org/api/v1'
      this.solrUrl = '/api/search/v1.0/search'
      this.solrUrlV3 = '/api/search/v3.0/search'
      this.ENV = 'prod'
    }
    else if ( this.clientHostname.indexOf('prod.cirrostratus.org') > -1 ) {
      console.info('Using Prod Endpoints (Absolute)')
      // Prod/Lively endpoints
      this.hostname = '//library.artstor.org'
      // this.baseUrl =  '//library.artstor.org/api'
      this.logUrl = '//ang-ui-logger.apps.prod.cirrostratus.org/api/v1'
      this.solrUrl = this.hostname + '/api/search/v1.0/search'
      this.solrUrlV3 = this.hostname + '/api/search/v3.0/search'
      this.ENV = 'prod'
    } else if ( new RegExp(testHostnames.join('|')).test(this.clientHostname) ) {
      console.info('Using Test Endpoints')
      // Test Endpoints
      this.hostname = '//stage.artstor.org'
      this.subdomain = 'stage'
      // this.baseUrl = '//stage.artstor.org/api'
      this.thumbUrl = '//mdxstage.artstor.org'
      this.compoundUrl = '//stor.stage.artstor.org/stor'
      this.logUrl = '//ang-ui-logger.apps.test.cirrostratus.org/api/v1'
      this.solrUrl = '/api/search/v1.0/search'
      this.solrUrlV3 = '/api/search/v3.0/search'
      this.IIIFUrl = '//tsstage.artstor.org/rosa-iiif-endpoint-1.0-SNAPSHOT/fpx'
      this.ENV = 'test'
    }

    // Set Saml availability
    if (new RegExp(samlHostnames.join('|')).test(this.clientHostname)) {
      this.samlAvailable = true
    }

    // Additional Local dev domains
    if (this.clientHostname.indexOf('local.sahara') > -1) {
      this.hostname = '//sahara.beta.stage.artstor.org'
      this.ENV = 'test'
    }

    // SSR routing WORKAROUND
    if (this.clientHostname.indexOf('beta.stage.artstor.org') > -1) {
      this.hostname = '//beta.stage.artstor.org'
      this.ENV = 'test'
    } else if (this.clientHostname.indexOf('beta.artstor.org') > -1) {
      this.hostname = '//beta.artstor.org'
      this.ENV = 'prod'
    }

    // Sahara routing WORKAROUND
    if (this.clientHostname.indexOf('sahara.beta.stage.artstor.org') > -1) {
      this.hostname = '//sahara.beta.stage.artstor.org'
      this.ENV = 'test'
    }
    if (this.clientHostname.indexOf('sahara.prod.artstor.org') > -1) {
      this.hostname = '//sahara.prod.artstor.org/'
    }

    // Local routing should point to full URL
    // * This should NEVER apply when using a proxy, as it will break authorization
    if (new RegExp(['cirrostratus.org', 'localhost', 'local.', 'beta.stage.artstor.org', 'sahara.beta.stage.artstor.org', 'sahara.prod.artstor.org'].join('|')).test(this.clientHostname)) {
      // this.baseUrl = this.hostname + '/api'
      this.solrUrl = this.hostname + '/api/search/v1.0/search'
      this.solrUrlV3 = this.hostname + '/api/search/v3.0/search'
    }

    // Set idle timer and auth heartbeat when loaded in Browser
    if (this.isBrowser) {
      this.initIdleWatcher()
      /**
       * User Access Heartbeat
       * - Poll /userinfo every 15min
       * - Refreshs AccessToken with IAC
       */
      const userInfoInterval = 15 * 1000 * 60 * 60
      // Run every X mins
      setInterval(() => {
        this.refreshUserSession(true)
      }, userInfoInterval)
    }

    // Initialize user and institution objects from localstorage
    this.userSource.next(this.getUser())
    let institution = this._storage.getLocal('institution')
    if (institution) { this.institutionObjSource.next(institution) }

    // SSR Logging
    console.log("Auth service Base url: " + this.baseUrl + ", Hostname: " + this.hostname)
  }

  public initIdleWatcher(): void {
     // For session timeout on user inactivity
     this.idle.setIdle(IdleWatcherUtil.generateIdleTime()); // Set an idle time of 1 min, before starting to watch for timeout
     this.idle.setTimeout(IdleWatcherUtil.generateSessionLength()); // Log user out after 90 mins of inactivity
     this.idle.setInterrupts(DEFAULT_INTERRUPTSOURCES);

     this.idle.onIdleEnd.pipe(
       map(() => {
         this.idleState = 'No longer idle.';
         // We want to ensure a user is refreshed as soon as they return to the tab
         this.refreshUserSession(true)
       })).subscribe()

     this.idle.onTimeout.pipe(
       map(() => {
         let user = this.getUser();
         // console.log(user);
         if (user && user.isLoggedIn){
           this.expireSession();
           this.showUserInactiveModal.next(true);
           this.idleState = 'Timed out!';
         }
         else{
           this.resetIdleWatcher()
         }
       })).subscribe()

     this.idle.onIdleStart.pipe(
       map(() => {
         this.idleState = 'You\'ve gone idle!';
         let currentDateTime = new Date().toUTCString();
         this._storage.setLocal('userGoneIdleAt', currentDateTime);
       })).subscribe()

    this.idle.onTimeoutWarning.pipe(
       map((countdown) => {
         this.idleState = 'You will time out in ' + countdown + ' seconds!'
         // console.log(this.idleState);
       })).subscribe()

     // Init idle watcher (this will also run getUserInfo)
     this.resetIdleWatcher()
  }

  // Reset the idle watcher
  public resetIdleWatcher(): void {
    //this.idle.watch();
    // When a user comes back, we don't want to wait for the time interval to refresh the session
    this.refreshUserSession(true)
  }
  public refreshUserSession(triggerSessionExpModal?: boolean) {
    // cancel out if we're currently getting the user session
    if (this.refreshUserSessionInProgress && !triggerSessionExpModal) { return }

    // set to true so we don't have multiple /userinfo calls going on at once
    this.refreshUserSessionInProgress = true
    this.getUserInfo(triggerSessionExpModal)
      .pipe(
        take(1),
        map((res) => {
          this.refreshUserSessionInProgress = false
          console.info('Access Token refreshed <3')
        },
        (err) => {
          this.refreshUserSessionInProgress = false
          console.error('Access Token refresh failed </3', err)
        })
      ).subscribe()
  }

  /**
   * Logs out and redirects the user to the login component
   */
  public logout() {
      // Stop, unwatch Idle session. Note: resetIdleWatcher() calls watch, and is called from login component
      //this.idle.stop()

      let header = new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded'); // ... Set content type to JSON
      let options = { headers: header, withCredentials: true };
      // Clear in-memory object
      // delete this.currentAuthHeaders
      // Clear local user object, and other settings
      let quizModeTTDismissed = this._storage.getLocal('quizModeTTDismissed')
      this._storage.clearLocalStorage()

      // if quizModeTTDismissed is set make sure it's set after logout as well.
      if(quizModeTTDismissed) {
        this._storage.setLocal('quizModeTTDismissed', quizModeTTDismissed)
      }

      // Clear observables
      this.userSource.next({})
      this.institutionObjSource.next({})

      return this.http
          .post(environment.API_URL + '/api/secure/logout', {}, options)
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
      let encodedString = '';
      for (let key in obj) {
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
    // Save to local storage
    this._storage.setLocal('institution', institutionObj)
    // Update Observable
    this.institutionObjValue = institutionObj;
    this.institutionObjSource.next(this.institutionObjValue);
  }

  /**
   * Gets the roles and departments lists, which are used in the registration page
   * @returns Observable resolved with object containing: roleArray, deptArray
   */
  public getUserRoles(): Observable<any> {
    return this.http.get(this.getUrl(true) + '/user?_method=deptRoles')
  }

  /** Calls service to register a user
   * @param registration should have properties: _method="update", username, password, role, dept, info<boolean>, survey<boolean>
   */
  public registerUser(registration: any): Observable<any> {
    let data = this.formEncode(registration);

    let header = new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded'); // form encode it
    let options = { headers: header, withCredentials: true }; // Create a request option

    return this.http.post(environment.API_URL + '/api/secure/register', data , options);
  }

  /**
   * Shibboleth/Saml registration
   * @param registration in addition to regular registration form, requires "samlTokenId" property
   */
  public registerSamlUser(registration: any): Observable<any> {
    // Clear method used for regular registration
    registration['_method'] = null
    // // Encode da
    // let dataStr = this.formEncode(registration)
    let header = new HttpHeaders().set('Content-Type', 'application/json')
    let options = { headers: header, withCredentials: true }

    return this.http.post(environment.API_URL + '/saml/user/create', registration , options)
  }

  /**
   * Shibboleth/Saml linking
   * @param user Artstor login credentials requires "username", "password", and "samlTokenId"
   */
  public linkSamlUser(credentials: any): Promise<any> {
    let header = new HttpHeaders().set('Content-Type', 'application/json')
    let options = { headers: header, withCredentials: true }

    return this.http.post(environment.API_URL + '/saml/user/link', credentials , options)
      .toPromise()
  }

  public changePassword(oldPass: string, newPass: string): Observable<any> {
    let header = new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded'); // form encode it
    let options = { headers: header, withCredentials: true }; // Create a request option
    let data = this.formEncode({
      _method: 'updatePassword',
      oldPassword: oldPass,
      password: newPass
    });

    return this.http.post(this.getUrl(true) + '/profile', data, options)
  }

  public getUrl(secure?: boolean): string {
    let url: string = this.baseUrl
    // Append secure path
    if (secure) {
      url += '/secure'
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
    return this.useSearch3 ? this.solrUrlV3 : this.solrUrl;
  }

  public getEnv(): string {
    return this.ENV;
  }

  /**
   * Our thumbnails come
   */
  public getThumbHostname(compound?: boolean): string {
    if (compound) {
      return this.compoundUrl;
    }
    return this.thumbUrl;
  }

  /** Returns url used for downloading some media, such as documents */
  public getMediaUrl(): string {
    // This is a special case, and should always points to library.artstor or stage
    return environment.API_URL + '/media';
  }

  /**
   * Get Headers
   * - wraps logic for forwarding client ip on SSR
   */
  public getHeaders() : HttpHeaders {
      let headers: HttpHeaders = new HttpHeaders().set('Content-Type', 'application/json')
      if (!this.isBrowser) {
          let req = this.injector.get('request');
          let clientIp: string = ''
          // Server rendered app needs to pass along the fastly IP
          if (req.headers['fastly-client-ip']) {
            clientIp = req.headers['fastly-client-ip']
            console.log("Fastly client ip: " + clientIp)
          } else if (req.headers['forwarded']) {
            clientIp = req.headers['forwarded']
            console.log("Forwarded: " + clientIp)
          } else {
            clientIp = req.ip
            if(clientIp === '::1') {
              // Local ipv6 requests
              // Assign a regular, non-vpn address for local dev
              clientIp = "65.128.116.207" // Minneapolis IP
            }
          }
          // Set triplet headers if available
          if (this.currentAuthHeaders) {
            Object.keys(this.currentAuthHeaders).forEach(header => {
              headers = headers.append(header, this.currentAuthHeaders[header])
            })
          }
          // Value specifically used within Artstor apps-gateway rules
          headers = headers.append("CLIENTIP", clientIp)
          // Expected Fastly ip header used by most services
          headers = headers.append('Fastly-Client-Ip', clientIp)
          return headers
      } else {
          return headers
      }
  }

  /**
   * Saves user to local storage
   * @param user The user should be an object to store in sessionstorage
   */
  public saveUser(user: any) {
    this.updateAnalyticUserProperties(user)
    // Preserve user via localstorage
    this._storage.setLocal('user', user);
    // only do these things if the user is ip auth'd or logged in and the user has changed
    let institution = this.institutionObjSource.getValue();
    if (this.isBrowser && user.status && (!institution.institutionId || user.institutionId != institution.institutionId)) {
      // Refresh institution object
      this.refreshUserInstitution()
    }
    // Update observable
    this.userSource.next(user)
  }

  /**
   * Gets user object from local storage
   */
  public getUser(): any {
      return this._storage.getLocal('user') ? this._storage.getLocal('user') : {};
  }

  /** Stores an object in local storage for you - your welcome */
  public store(key: string, value: any): void {
      if (key != 'user' && key != 'token') {
          this._storage.setLocal(key, value);
      }
  }

  /** Gets an object from local storage */
  public getFromStorage(key: string): any {
      return this._storage.getLocal(key);
  }

  /** Deletes things (not user or token) from local storage */
  public deleteFromStorage(key: string): void {
      if (key != 'user' && key != 'token') {
          this._storage.removeLocalItem(key);
      }
  }

  /**
   * Update GA/GTM properties
   * - Should run whenever the user object is modified locally
   */
  updateAnalyticUserProperties(user: any): void {
    let institution = this.institutionObjSource.value
    // Push user vars to data layer
    let authMethod = user.isLoggedIn ? 'personal' : (user.institutionId ? 'institutional' : 'unaffiliated')
    let userGTMVars = {
      'loggedIn' : user.isLoggedIn,
      'userAuthentication' : authMethod,
      'userInstitution' : institution.institutionName || '',
      'institutionID' : user.institutionId || '',
      'userID' : user.baseProfileId || '',
      'userRole' : user.role || '',
      'userDepartment' : user.dept || ''
    }
    // Push to GTM data layer
    this.angulartics.eventTrack.next( { properties : {
      gtmCustom : {
        "user" : userGTMVars
      }
    } });
    // user : {}
    // Set GA user properties
    this.angulartics.setUsername.next((user.baseProfileId || ''));
    this.angulartics.setUserProperties.next({ institutionId: (user.institutionId || '') });
    this.angulartics.setUserProperties.next({ isLoggedIn: (user.isLoggedIn || false) });
    this.angulartics.setUserProperties.next({ shibbolethUser: (user.shibbolethUser || false) });
    this.angulartics.setUserProperties.next({ dept: (user.dept || '') });
    this.angulartics.setUserProperties.next({ ssEnabled: (user.ssEnabled || false) })
  }

  /**
   * Required by implementing CanActivate, and is called on routes which are protected by canActivate: [AuthService]
   */
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    console.log("Running canActivate for... " + state.url)
    let options = { headers: this.userInfoHeader, withCredentials: true }
    /**
     * @todo: Enable the server to call the user info call
     */
    if (!this.isBrowser) {
      return new Observable(observer => {
        observer.next(true)
      })
    }
    // Allow access to pages that don't require login/auth
    if ((route.params.samlTokenId || route.params.type == 'shibboleth') && state.url.includes('/register')) {
      // Shibboleth workflow is unique, should allow access to the register page
      return new Observable(observer => {
        observer.next(true)
      })
    }
    // Verify user is logged in
    let user = this.getUser()
    if (this.canUserAccess(user)) {
      // Ensure GTM data layer is updated when user data is pulled from localStorage
      this.updateAnalyticUserProperties(user)
      // If user object already exists, we're done here
      return new Observable(observer => {
        observer.next(true)
      })
    }

    // If user object doesn't exist, try to get one!
    return new Observable(observer => {
      this.http
      .get(this.genUserInfoUrl(), options).pipe(
      map(
        (data)  => {
          console.log("User info call returned!")
          // The Artstor Sotrage service will return a default user object for use on the Server
          let user = this.isBrowser ? this.decorateValidUser(data) : this._storage.getLocal('user')
          // Track whether or not user object has been refreshed since app opened
          this.userSessionFresh = true

          if (user && (this.isOpenAccess || user.status)) {
            // Clear expired session modal
            this.showUserInactiveModal.next(false)
            // Update user object
            this.saveUser(user)
            return true
          } else {
            // We don't have a user here, and WLV is not open access, go to /login
            if (!this.isOpenAccess) {
              console.log('Not open access - redirecting')
              this._router.navigate(['/login'])
            }
            else {
              console.log('fell through to this.logout')
              this.logout()
              // Store the route so that we know where to put them after login!
              this.store('stashedRoute', this.location.path(false))
              return false
            }
          }
        }
      )).pipe(
      take(1),
      map(res => {
        // CanActivate is not handling the Observable value properly,
        // ... so we do an extra redirect in here
        if (res === false) {
          this._router.navigate(['/login'])
        }
        observer.next(res)
      }, err => {
        this._router.navigate(['/login'])
        observer.next(false)
      })).subscribe()
    })
  }

  /**
   * Asks the back-end for the user's info and a fresh set of cookies
   * @param triggerSessionExpModal Sometimes this is called after unsuccessful logins, and we don't want failovers to always trigger the modal, so it's an option
   */
  public getUserInfo(triggerSessionExpModal?: boolean): Observable<any> {
    return this.http
      .get(this.genUserInfoUrl(), {
        observe: 'response',
        headers: this.getHeaders(),
        withCredentials: true
      }).pipe(
      map((res)  => {
          let data = res.body
          let headers = res.headers
          let user = this.decorateValidUser(data)
          // Track whether or not user object has been refreshed since app opened
          this.userSessionFresh = true

          if (user && (this.isOpenAccess || user.status)) {
            // Clear expired session modal
            this.showUserInactiveModal.next(false)
            // Update user object
            this.saveUser(user)
          } else {
            // Clear user session (local objects and cookies)
            this.logout()
          }
          // Save session auth header values for attaching to subsequent requests
          if (headers.get('x-jstor-access-session')) {
            this.currentAuthHeaders = {
              'x-jstor-access-session': headers.get('x-jstor-access-session'),
              'x-jstor-access-session-signature': headers.get('x-jstor-access-session-signature'),
              'x-jstor-access-session-timed-signature': headers.get('x-jstor-access-session-timed-signature')
            }
          }
          // If user session was downgraded/expired, notify
          if (triggerSessionExpModal && user.loggedInSessionLost) {
              // Current saved user object needs to be cleared if session was lost
              this.logout()
              // Tell user their session was lost
              this.showUserInactiveModal.next(true)
          }
          return data
        }
      ))
  }

  /** Getter for downloadAuthorized parameter of local storage */
  public downloadAuthorized(): boolean {
    return this._storage.getLocal('downloadAuthorized');
  }

  /** Setter for downloadAuthorized parameter of local storage */
  public authorizeDownload(): void {
    this._storage.setLocal('downloadAuthorized', true);
  }

    /**
     * Logs user in
     * @param user User must have username (which is an email address) and password to be passed in the request
     */
    login(user: any): Promise<any> {
        // let header = new HttpHeaders().set('Cache-Control', 'no-store, no-cache').set('Content-Type', 'application/x-www-form-urlencoded')
        // let options = { 
        //   // headers: header, 
        //   // withCredentials: true
        // }; // Create a request option
        let data = this.formEncode({
            'j_username': user.username, //.toLowerCase(),
            'j_password': user.password
        });

        return this.http
            .post(environment.API_URL + '/api/secure/login', data)
            .toPromise();
    }

    getLoginError(user: User) {
        let header = new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded')
        let options = { headers: header, withCredentials: true }; // Create a request option

        return this.http
            .get(this.getUrl(true) + '/login?j_username=' + encodeURIComponent(user.username) + '&j_password=' + encodeURIComponent(user.password) )
            .toPromise();
    }

    getInstitutions() {
        let url = environment.API_URL + '/api/institutions?_method=shibbolethOnly';

        return this.http
            .get(url)
            .toPromise();
    }

    /**
     * Service call for password reset
     * @note This call actually changes the password to a random new one (2019-06-06)
     * @param email account password should be reset on
     */
    pwdReset(email: string): Promise<any> {
        let options = { 
          withCredentials: true, 
          params: { 
            'email': email, 
            'portal' : this._app.config.pwResetPortal 
          }
        }
        return this.http
            .get(environment.API_URL + '/api/lostpw', options)
            .toPromise();
    }

  public ssLogin(username: string, password: string): Observable<SSLoginResponse> {

    let data = this.formEncode({ username: username, password: password })
    let headers = new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded')
    return this.http.post<SSLoginResponse>(
      [this.hostname, 'gust', 'login'].join('/'),
      data,
      { withCredentials: true, headers: headers }
    )
  }

  public isPublicOnly(): boolean {
    let user = this.userSource.value
    let userObj = user || this.getUser()
    return !(userObj && userObj.status)
  }


  /**
   * Deprecated: User info is now tracked in the data layer
   * Return "category" to report to Google Analytics
   * - We use category to track the type of user the event is tied to
   */
  // public getGACategory(): string {
  //   let category = 'unaffiliatedUser'
  //   let user = this.getUser()

  //   if (user.isLoggedIn) {
  //     category = 'loggedInUser'
  //   } else if (user.institutionId && user.institutionId.toString().length > 0) {
  //     category = 'institutionalUser'
  //   }

  //   return category
  // }

  private genUserInfoUrl(): string {
    return this.getUrl(true) + '/userinfo?no-cache=' + new Date().valueOf()
  }

  private expireSession(): void {
    this.logout()
      .then(() => {
        // We want the user to see the "Session Expired" modal triggered by this.refreshUserSession() & this.getUserInfo()
        // Do not route user away
      })
  }

  /**
   * Wrapper function for HTTP call to get user institution. Used by nav component
   * @returns Chainable promise containing collection data
   */
  private refreshUserInstitution() {
    let header = new HttpHeaders().set('Cache-Control', 'no-store, no-cache')
    let options = { headers: header, withCredentials: true }

    // Returns all of the collections names
    return this.http
      .get(this.getUrl() + '/v2/institution?no-cache=' + new Date().valueOf(), options)
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

  /**
   * Decorates and Validates user from the user response
   * - Used to verify that we want the user object
   * - Used to decorate the user object for saving
   */
  private decorateValidUser(data: any): any {
    let user = this.userSource.value
    let currentUser = user.hasOwnProperty('status') ? user : this.getUser()
    let newUser = data['user'] ? data['user'] : {}
    let currentUsername = currentUser.username
    let loggedInSessionLost = currentUser.isLoggedIn ? (!newUser.username || currentUsername !== newUser.username) : false;

    if (data['status'] === true) {
      // User is authorized - if you want to check ipAuth then you can tell on the individual route by user.isLoggedIn = false
      let user = data['user']
      user.status = data['status']
      if (data['isRememberMe'] || (data.maxPeriod > 0 || data.dayRemain > 0)) {
        user.isLoggedIn = true
      }

      // Save ipAuthed flag to user object
      user.ipAuthed = !user.isLoggedIn && user.status ? true : false
      // If user downgraded from logged in user to ip auth or other, add flag
      user.loggedInSessionLost = loggedInSessionLost

      if (this.canUserAccess(user)) {
        return user
      } else {
        return null
      }
    } else if (data['status'] === false) {
      // Return generic user object for unaffiliated users
      let user = {
        'status': false,
        'isLoggedIn': false,
        'loggedInSessionLost': loggedInSessionLost
      }
      return user
    } else {
      console.error('Did not receive a valid user object', data)
      return null
    }
  }

  private canUserAccess(user: any): boolean {
    return user && user.hasOwnProperty('status') && (this._app.config.disableIPAuth === true ? user.isLoggedIn : true)
  }
}

export class User {
  public samlTokenId: string
  constructor(
    public username: string,
    public password: string,
  ) {}
}

interface AuthTriplet {
  'x-jstor-access-session': string
  'x-jstor-access-session-signature': string
  'x-jstor-access-session-timed-signature': string
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
