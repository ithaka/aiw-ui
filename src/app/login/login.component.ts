import { Locker } from 'angular-safeguard'
import { Component, OnInit, OnDestroy } from '@angular/core'
import { Router, ActivatedRoute } from '@angular/router'
import { Location } from '@angular/common'
import { Angulartics2 } from 'angulartics2'
import { CompleterService, LocalData } from 'ng2-completer'
import { BehaviorSubject, Observable, Subscription } from 'rxjs'
import { map, take } from 'rxjs/operators'

import { AppConfig } from '../app.service'
import { AuthService, User, AssetService, FlagService } from './../shared'
import { LockerService } from 'app/_services';

declare var initPath: string

@Component({
  selector: 'login',
  styleUrls: [ './login.component.scss' ],
  templateUrl: './login.component.pug'
})
export class Login implements OnInit, OnDestroy {

  public copyBase: string = ''

  // Set our default values
  public user = new User('', '')
  public errorMsg: string = ''
  public instErrorMsg: string = ''
  public showPwdModal = false
  public pwdReset = false
  public expirePwd = false
  public pwdRstEmail = ''
  public errorMsgPwdRst = ''
  public forcePwdRst = false
  public successMsgPwdRst = ''
  public loginInstitutions = [] /** Stores the institutions returned by the server */

  public showRegister: boolean = false
  public showHelpModal: boolean = false

  private loginInstName: string = '' /** Bound to the autocomplete field */
  private stashedRoute: string
  private dataService: LocalData

  /**
   * Observable for autocomplete list of institutions
   * - We apply additional sorting
   */
  private instListSubject: BehaviorSubject<any[]> = new BehaviorSubject([])
  private instListObs: Observable<any[]> = this.instListSubject.asObservable()

  private subscriptions: Subscription[] = []


  // TypeScript public modifiers
  constructor(
    private _auth: AuthService,
    private _assets: AssetService,
    private _completer: CompleterService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private angulartics: Angulartics2,
    public _app: AppConfig,
    private _flags: FlagService,
    private _locker: LockerService
  ) {
  }

  ngOnInit() {
    /*
     * Subscribe to route params
     * - Set featureFlag in Auth service if the route param contains featureFlag
     * - The featureFlag values in Auth service would be persistent until the page is refreshed
    */
    this.subscriptions.push(
      this.route.params.pipe(
      map(params => {
        if (params && params['featureFlag']) {
          this._flags[params['featureFlag']] = true
        }
      })).subscribe()
    )

    // Check for a stashed route to pass to proxy links
    this.stashedRoute = this._locker.get('stashedRoute')

    if (this._app.config.copyModifier) {
      this.copyBase = this._app.config.copyModifier + '.'
    }

    // The true institutions call. Don't throw an error, since the above call will provide a backup
  this._auth.getInstitutions()
      .then((data) => {
        if (data['items']) {
          this.loginInstitutions = data['items'];
          // Hardcoded test url for new Shibboleth provider
          if (this._auth.getEnv() === 'test') {
            let theUrl = 'https://testshibbolethsp.jstor.org/Shibboleth.sso/Login?entityID=https%3A%2F%2Fidp.artstor.org%2Fidp%2Fshibboleth&target=%2Fsecure%2Fshib%3Fdest%3Dhttp%253A%252F%252Fstage.artstor.org%252F%2523%252F%2526site%253Dartstor';
            this.loginInstitutions.push({
              artstorShibbolethLoginUrl: theUrl,
              entityID: theUrl,
              name: 'AUSS/Ithaka'
            });
          }
          else {
            let theUrl = 'https://shibbolethsp.jstor.org/Shibboleth.sso/Login?entityID=https%3A%2F%2Fidp.artstor.org%2Fidp%2Fshibboleth&target=%2Fsecure%2Fshib%3Fdest%3Dhttp%253A%252F%252Flibrary.artstor.org%252F%2523%252F%2526site%253Dartstor';
            this.loginInstitutions.push({
              artstorShibbolethLoginUrl: theUrl,
              entityID: theUrl,
              name: 'AUSS/Ithaka'
            });
          }
          this.dataService = this._completer.local(this.instListObs, 'name', 'name');
        }
      })
      .catch((error) => {
        console.error(error);
      });

    /**
     * This handles showing the register link for only ip auth'd users
     *
     * @todo - Should we have to call gtUserInfo here?
     * We don't need to reload user info that we should alreay have.
     */
    this._auth.getUserInfo().pipe(
      take(1),
      map((res) => {
        if ((res.remoteaccess === false) && res.user && (!this._app.config.disableIPAuth)) {
          this.showRegister = true
        }
      }, (err) => {
        console.error(err)
      })).subscribe()

  } // OnInit

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe() })
  }

  /**
   * Filtering and sorting function for institution login list
   * @param event keyup value event
   */
  public sortInstitution(event, term): void {
    // Do not evaluate if key up event is arrow key
    if ([37, 38, 39, 40].indexOf(event.keyCode) > -1) {
      return
    }
    let termReg = new RegExp(term, 'i')

    let filtered = this.loginInstitutions.filter( inst => {
      return inst && inst.name.search(termReg) > -1
    })
    filtered = filtered.sort((a, b) => {
        return a.name.search(termReg) - b.name.search(termReg)
    });
    this.instListSubject.next(filtered)

    // We need to clear any error messages here if there is one
    if (this.instErrorMsg.length)
        this.instErrorMsg = ''
  }

  /**
   * Fired when the user logs in through their institution
   */
  goToInstLogin(): void {
    let len: number = this.loginInstitutions.length
    let selectedInst: any
    let url: string
    // search through the institutions store locally and see if the name the user selected matches one
    for (let i = 0; i < len; i++) {
      if (this.loginInstitutions[i].name == this.loginInstName) {
        selectedInst = this.loginInstitutions[i]
        break
      }
    }

    // if the user selected some institution that doesn't exist, kick them out!!
    if (!selectedInst) {
      this.instErrorMsg = 'LOGIN.INSTITUTION_LOGIN.ERRORS.SELECT_INSTITUTION';
      return;
    }
    else {
      this.instErrorMsg = ''
    }

    url = selectedInst.entityID ? selectedInst.entityID : '';

    if (selectedInst.type === 'proxy') {
      // Hashes within a parameter are interpretted incorrectly, and we don't need 'em
      let stashedRoute = this.stashedRoute ? this.stashedRoute.replace('#/', '') : '/'
      // WORKAROUND: Auth is still cleaning data to replace www.artstor.org with library.artstor.org
      if (url.match('//www.artstor.org')) {
        url = url.replace('//www.artstor.org', '//library.artstor.org')
      }
      // WORKAROUND: Auth is still cleaning data with legacy "basicSearch" pathes
      if (url.match('/action/showBasicSearch')) {
        url = url.replace('/action/showBasicSearch', '')
      }
      // Handle passing stashed url to proxies
      let urlToken = /!+TARGET_FULL_PATH!+/g;
      let pathToken = /!+TARGET_NO_SERVER!+/g;
      let baseUrlParam = /(:\/\/library.artstor.org)$|(:\/\/library.artstor.org\/)$/;
      if (url.match(urlToken)) {
        /**
         * EZProxy forwarding
         * Auth provides !!!TARGET_FULL_PATH!!! as a string to replace for forwarding
         */
        url = url.replace(urlToken, document.location.host + stashedRoute )
      } else if (url.match(pathToken)) {
        /**
         * WAM Proxy forwarding
         * Auth provides !!!TARGET_NO_SERVER!!! as a token/string to replace for forwarding
         */
        // pathTokens are appended after a trailing forward slash
        if (stashedRoute[0] === '/') { stashedRoute = stashedRoute.substr(1) }
        url = url.replace(pathToken, stashedRoute)
      } else if (url.match(baseUrlParam)) {
        /**
         * Legacy proxy configurations that point "library.artstor.org" without any tokens
         */
        // Verify URL ends with a slash
        if (url[url.length - 1] != '/') { url = url + '/' }
        // Verify stashed route does NOT start with a slash
        if (stashedRoute[0] == '/') { stashedRoute = stashedRoute.substr(1) }
        // Append stashed route to query param
        url = url + stashedRoute
      }
      // If proxy, simply open url:
      window.open(url);
    } else {
      // Else if Shibboleth, add parameters:
      // eg. for AUSS https://sso.artstor.org/sso/shibssoinit?idpEntityID=https://idp.artstor.org/idp/shibboleth&target=https%3A%2F%2Fsso.artstor.org%2Fsso%2Fshibbolethapplication%3Fo%3D0049a162-7dbe-4fcf-adac-d257e8db95e5

      // For institution that has the key "artstorShibbolethLoginUrl", just open the Url
      if (selectedInst.artstorShibbolethLoginUrl) {
        window.open(selectedInst.artstorShibbolethLoginUrl);
        return;
      }

      let origin = window.location.origin + '/#/home';
      let ssoSubdomain = this._auth.getSubdomain() == 'library' ? 'sso' : 'sso.' + this._auth.getSubdomain()
      window.open('https://' + ssoSubdomain + '.artstor.org/sso/shibssoinit?idpEntityID=' + encodeURIComponent(url) + '&o=' + encodeURIComponent(origin));
    }
  }

}
