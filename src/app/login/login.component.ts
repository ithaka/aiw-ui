import { Locker } from 'angular2-locker';
import { Component } from '@angular/core'
import { Router, ActivatedRoute } from '@angular/router'
import { Location } from '@angular/common'
import { Angulartics2 } from 'angulartics2'
import { CompleterService, LocalData } from 'ng2-completer'
import { BehaviorSubject, Observable, Subscription } from 'rxjs/Rx';

import { AppConfig } from '../app.service'
import { AuthService, User, AssetService } from './../shared'
import { AnalyticsService } from '../analytics.service'

declare var initPath: string

@Component({
  selector: 'login',
  styleUrls: [ './login.component.scss' ],
  templateUrl: './login.component.pug'
})
export class Login {

  private copyBase: string = ''

  // Set our default values
  public user = new User('','')
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

  private loginInstName: string = '' /** Bound to the autocomplete field */
  private stashedRoute: string
  private dataService: LocalData

  /** 
   * Observable for autocomplete list of institutions
   * - We apply additional sorting 
   */
  private instListSubject: BehaviorSubject<any[]> = new BehaviorSubject([])
  private instListObs: Observable<any[]> = this.instListSubject.asObservable()


  // TypeScript public modifiers
  constructor(
    private _auth: AuthService,
    private _assets: AssetService,
    private _completer: CompleterService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private angulartics: Angulartics2,
    private _analytics: AnalyticsService,
    private _app: AppConfig,
    private _storage: Locker
  ) {
  }

  ngOnInit() {

    // Check for a stashed route to pass to proxy links
    // Change from this._storage.get() to this._auth.getFromStorage() to remember the original url, not tested yet
    // this.stashedRoute = this._storage.get("stashedRoute")
    this.stashedRoute = this._auth.getFromStorage("stashedRoute")

    if (this._app.config.copyModifier) {
      this.copyBase = this._app.config.copyModifier + "."
    }

    // Provide redirects for initPath detected in index.html from inital load
    if ( initPath && (initPath.indexOf('ViewImages') > -1 || initPath.indexOf('ExternalIV') > -1 ) ) {
      this.router.navigateByUrl(initPath)
        .then( result => {
          // Clear variable to prevent further redirects
          initPath = null
          console.log('Redirect to initial path attempt: ' + result)
        })
    }

    // The true institutions call. Don't throw an error, since the above call will provide a backup
    this._auth.getInstitutions()
      .then((data) => {
        if (data['items']) {
          this.loginInstitutions = data['items'];
          // Hardcoded test url for new Shibboleth provider
          if (this._auth.getEnv() === 'test') {
            let theUrl = "https://testshibbolethsp.jstor.org/Shibboleth.sso/Login?entityID=https%3A%2F%2Fidp.artstor.org%2Fidp%2Fshibboleth&target=%2Fsecure%2Fshib%3Fdest%3Dhttp%253A%252F%252Fstage.artstor.org%252F%2523%252F%2526site%253Dartstor";
            this.loginInstitutions.push({
              artstorShibbolethLoginUrl: theUrl,
              entityID: theUrl,
              name: "AUSS/Ithaka"
            });
          }
          else {
            let theUrl = "https://shibbolethsp.jstor.org/Shibboleth.sso/Login?entityID=https%3A%2F%2Fidp.artstor.org%2Fidp%2Fshibboleth&target=%2Fsecure%2Fshib%3Fdest%3Dhttp%253A%252F%252Flibrary.artstor.org%252F%2523%252F%2526site%253Dartstor";
            this.loginInstitutions.push({
              artstorShibbolethLoginUrl: theUrl,
              entityID: theUrl,
              name: "AUSS/Ithaka"
            });
          }
          this.dataService = this._completer.local(this.instListObs, 'name', 'name');          
        }
      })
      .catch((error) => {
        console.error(error);
      });

    this._analytics.setPageValues('login', '')
  } // OnInit



  private sortInstitution(event) : void {
    // sort array by string input
    let term = this.loginInstName
    let termReg = new RegExp(term, 'i')
    
    let filtered = this.loginInstitutions.filter( inst => {
      return inst && inst.name.search(termReg) > -1
    })
    filtered = filtered.sort((a, b) => {
        return a.name.search(termReg) - b.name.search(termReg)
    });
    this.instListSubject.next(filtered)
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
    url = selectedInst.entityID ? selectedInst.entityID : '';

    // if the user selected some institution that doesn't exist, kick them out!!
    if (!selectedInst) {
      this.instErrorMsg = "LOGIN.INSTITUTION_LOGIN.ERRORS.SELECT_INSTITUTION";
      return;
    }

    if (selectedInst.type === 'proxy') {
      // Hashes within a parameter are interpretted incorrectly, and we don't need 'em
      let stashedRoute = this.stashedRoute ? this.stashedRoute.replace("#/", "") : "/"
      // WORKAROUND: Auth is still cleaning data to replace www.artstor.org with library.artstor.org
      if (url.match("//www.artstor.org")) {
        url = url.replace("//www.artstor.org", "//library.artstor.org")
      }
      // Handle passing stashed url to proxies
      let urlToken = /!+TARGET_FULL_PATH!+/g;
      let pathToken = /!+TARGET_NO_SERVER!+/g;
      if (url.match(urlToken)) {
        /**
         * EZProxy forwarding
         * Auth provides !!!TARGET_FULL_PATH!!! as a string to replace for forwarding
         */
        url = url.replace(urlToken, document.location.host + stashedRoute )
      } else {
        /**
         * WAM Proxy forwarding
         * Auth provides !!!TARGET_NO_SERVER!!! as a token/string to replace for forwarding
         */
        // pathTokens are appended after a trailing forward slash
        if (stashedRoute[0] === "/") { stashedRoute = stashedRoute.substr(1) }
        url = url.replace(pathToken, stashedRoute )
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
