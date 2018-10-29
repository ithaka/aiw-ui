import { OnInit, Input } from '@angular/core'
import { Component } from '@angular/core'
import { Router, ActivatedRoute } from '@angular/router'
import { Location } from '@angular/common'
import { Angulartics2 } from 'angulartics2'
import { CompleterService, LocalData } from 'ng2-completer'
import { BehaviorSubject, Observable, Subscription } from 'rxjs'

import { AppConfig } from '../app.service'
import { AuthService, User, AssetService } from './../shared'

@Component({
  selector: 'ang-login-form',
  templateUrl: 'login-form.component.pug'
})

export class LoginFormComponent implements OnInit {

  @Input() samlTokenId: string

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

  @Input() public copyModifier: string = 'DEFAULT'
  public loginLoading = false

  private loginInstName: string = '' /** Bound to the autocomplete field */
  // loginCall is scoped globally for isBadCasePassword() as well as login()
  private loginCall: Function

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
    public _app: AppConfig
  ) {
  }

  ngOnInit() {
    if (this._app.config.copyModifier) {
      this.copyBase = this._app.config.copyModifier + '.'
    }
  } // OnInit

  loadForUser(data: any) {
    if (data && data.user) {
      data.user.hasOwnProperty('username') && this.angulartics.setUsername.next(data.user.username);
      data.user.hasOwnProperty('institutionId') && this.angulartics.setUserProperties.next({ institutionId: data.user.institutionId });
      data.user.hasOwnProperty('isLoggedIn') && this.angulartics.setUserProperties.next({ isLoggedIn: data.user.isLoggedIn });
      data.user.hasOwnProperty('shibbolethUser') && this.angulartics.setUserProperties.next({ shibbolethUser: data.user.shibbolethUser });
      data.user.hasOwnProperty('dept') && this.angulartics.setUserProperties.next({ dept: data.user.dept });
      data.user.hasOwnProperty('ssEnabled') && this.angulartics.setUserProperties.next({ ssEnabled: data.user.ssEnabled })

      if (data.isRememberMe || data.remoteaccess) {
        data.user.isLoggedIn = true
      }
      this._auth.saveUser(data.user);
      this.errorMsg = '';

      // Save user personal collections count in local storage
      this._assets.pccollection()
      .then((res) => {
        let pcEnabled: boolean = false;
        if ( (res['privateCollection'] && (res['privateCollection'].length > 0)) || (res['pcCollection'] && res['pcCollection'].collectionid) ){
          pcEnabled = true;
        }

      })
      .catch(function(err) {
          console.error('Unable to load user PC');
      });

      let stashedRoute = this._auth.getFromStorage('stashedRoute')

      if (typeof(stashedRoute) == 'string') {
        // We do not want to navigate to the page we are already on
        if (stashedRoute.indexOf('login') > -1) {
          this.router.navigate(['/home']);
        } else {
          this.router.navigateByUrl(stashedRoute);
        }
        this._auth.deleteFromStorage('stashedRoute');
      } else {
        this.router.navigate(['/home']);
      }

    }
  }

  getLoginError(user) {
    this._auth.getLoginError(user)
      .then((data) => {
        if (data['message'] === 'loginExpired'){
          this.expirePwd = true;
          this.showPwdModal = true;
        }
        else if (data['message'] === 'loginFailed'){
          this.errorMsg = 'LOGIN.WRONG_PASSWORD';
        } else {
          // handles any server errors
          this.errorMsg = 'LOGIN.SERVER_ERROR';
        }
      })
      .catch((error) => {
        this.errorMsg = this.getLoginErrorMsg(error.message);
      });
  }

  login(user: User) {
    this.loginCall = (user) => { return this._auth.login(user) }

    user.username = user.username.toLowerCase().trim()
    this.loginLoading = true;
    // Clear error messaging
    this.errorMsg = ''
    this.forcePwdRst = false

    if (!this.validateEmail(user.username)){
      this.errorMsg = 'LOGIN.INVALID_EMAIL';
      this.loginLoading = false;
      return;
    }

    if (!this.validatePwd(user.password)){
      this.errorMsg = 'LOGIN.PASSWORD_REQUIRED';
      this.loginLoading = false;
      return;
    }

    if (this.samlTokenId) {
      user.samlTokenId = this.samlTokenId
      this.loginCall = (user) => { return this._auth.linkSamlUser(user)}
    }

    this.angulartics.eventTrack.next({ action: 'remoteLogin', properties: { category: this._auth.getGACategory(), label: 'attempt' }});

    this.loginCall(user)
      .then(
        (data)  => {
          this.loginLoading = false;
          if (data.status === false) {
            if (data.message === 'loginFailed' || data.message === 'Invalid credentials'){
              // Check if old bad-case password
              this.isBadCasePassword(user)
            }
            this.errorMsg = this.getLoginErrorMsg(data.message)
          } else if (!data.isRememberMe && !data.remoteaccess) {
            // In some situations the service might return an ip auth object even tho login was unsuccessful
            this.errorMsg = 'There was an issue with your account, please contact support.';
          } else {
            this.angulartics.eventTrack.next({ action: 'remoteLogin', properties: { category: this._auth.getGACategory(), label: 'success' }});
            this.loadForUser(data);
            this._auth.resetIdleWatcher() // Start Idle on login
          }

        }
      ).catch((err) => {
        this.loginLoading = false;
        let errObj = err.error
        this.errorMsg = this.getLoginErrorMsg(errObj && errObj.message)
        if (!this.errorMsg){
          this.getLoginError(user)
          this.angulartics.eventTrack.next({ action: 'remoteLogin', properties: { category: this._auth.getGACategory(), label: 'failed' }});
        }
        // Shibboleth linking error
        if (errObj && errObj.code) {
          this.errorMsg = 'SHIBBOLETH_ERRORS.' + errObj.code
        }
        // Check if old bad-case password
        this.isBadCasePassword(user)
      });
  }

  getLoginErrorMsg(serverMsg: string): string {
    if (serverMsg) {
       if (serverMsg === 'loginFailed' || serverMsg === 'Invalid credentials'){
        return 'LOGIN.WRONG_PASSWORD'
      } else if (serverMsg === 'loginExpired' || serverMsg === 'Login Expired') {
        return 'LOGIN.EXPIRED'
      } else if (serverMsg === 'portalLoginFailed') {
        return 'LOGIN.INCORRECT_PORTAL'
      } else if (serverMsg.indexOf('disabled') > -1) {
        return 'LOGIN.ARCHIVED_ERROR';
      } else {
        return 'LOGIN.SERVER_ERROR'
      }
    } else {
      return 'LOGIN.SERVER_ERROR'
    }
  }

  /** **THIS CAN LIKELY BE REMOVED AFTER RELEVANT USERS' PASSWORDS HAVE BEEN CHANGED**
   * Tests if user's password is an old all lowercase password
   * @param user User must have username (which is an email address) and password to be passed in the request
   */
  isBadCasePassword(user) {
    // Do not test if the user isn't using upparcase characters
    if (user.password == user.password.toLowerCase()) {
      return;
    }
    // Try password all lowercase
    user.password = user.password.toLowerCase()
    this.loginCall(user).then((data) => {
      if (data.status === true) {
        this.forcePwdRst = true
        this.errorMsg = ''
      }
    }, (error) => {
      console.error(error)
    })
  }

  validateEmail(email: string){
    let re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
  }

  validatePwd(pwd){
    if ((pwd.length >= 7) && (pwd.length <= 20) ){
      return true;
    }
    else{
      return false;
    }
  }
}
