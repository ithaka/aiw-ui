import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { Angulartics2 } from 'angulartics2';
import { CompleterService, CompleterData } from 'ng2-completer';

import { AuthService, User } from './../shared';
import { AnalyticsService } from '../analytics.service';

declare var initPath: string

@Component({
  // The selector is what angular internally uses
  // for `document.querySelectorAll(selector)` in our index.html
  // where, in this case, selector is the string 'home'
  selector: 'login',
  // Our list of styles in our component. We may add more to compose many styles together
  styleUrls: [ './login.component.scss' ],
  // Every Angular template is first compiled by the browser before Angular runs it's compiler
  templateUrl: './login.component.pug'
  // template: `<h1>Test title</h1>`
})
export class Login {
  // Set our default values
  public user = new User('','');
  public errorMsg: string = '';
  public instErrorMsg: string = '';
  public showPwdModal = false;
  public showHelpModal = false;
  public pwdReset = false;
  public expirePwd = false;
  public pwdRstEmail = '';
  public errorMsgPwdRst = '';
  public forcePwdRst = false
  public successMsgPwdRst = '';
  public loginInstitutions = []; /** Stores the institutions returned by the server */
  private loginInstName: string = '' /** Bound to the autocomplete field */
  public showRegister: boolean = false;
  
  private loginLoading = false;

  private dataService: CompleterData
  
  // TypeScript public modifiers
  constructor(
    private _auth: AuthService,
    private _completer: CompleterService,
    private router: Router,
    private location: Location,
    private angulartics: Angulartics2,
    private _analytics: AnalyticsService
  ) { 
  }

  ngOnInit() {
    // Provide redirects for initPath detected in index.html from inital load
    if ( initPath && (initPath.indexOf('ViewImages') > -1 || initPath.indexOf('ExternalIV') > -1 ) ) {
      this.router.navigateByUrl(initPath)
        .then( result => {
          // Clear variable to prevent further redirects
          initPath = null
          console.log('Redirect to initial path attempt: ' + result)
        })
    }

    // this handles showing the register link for only ip auth'd users
    this._auth.getIpAuth()
      .take(1)
      .subscribe((res) => {
        if (res.remoteaccess === false && res.user) {
          this.showRegister = true;
        }
      }, (err) => {
        console.error(err);
      });

    // Until institutions call works without the auth cookie, we need to make sure we have a list available
    this._auth.getFallbackInstitutions()
      .then((data) => {
        if (data.items) {
          this.loginInstitutions = data.items;
          this.dataService = this._completer.local(data.items, 'name', 'name')
        }
      })
      .catch((error) => {
        this.instErrorMsg = "LOGIN.INSTITUTION_LOGIN.ERRORS.SERVICE_ERROR";
        console.error(error);
      });

    // The true institutions call. Don't throw an error, since the above call will provide a backup
    this._auth.getInstitutions()
      .then((data) => {
        if (data.items) {
          this.loginInstitutions = data.items;
          this.dataService = this._completer.local(data.items, 'name', 'name')
        }
      })
      .catch((error) => {
        console.error(error);
      });

    this._analytics.setPageValues('login', '')
  } // OnInit
  
  loadForUser(data: any) {
    if (data && data.user) {
      data.user.hasOwnProperty("username") && this.angulartics.setUsername.next(data.user.username);
      data.user.hasOwnProperty("institutionId") && this.angulartics.setUserProperties.next({ institutionId: data.user.institutionId });
      data.user.hasOwnProperty("isLoggedIn") && this.angulartics.setUserProperties.next({ isLoggedIn: data.user.isLoggedIn });
      data.user.hasOwnProperty("shibbolethUser") && this.angulartics.setUserProperties.next({ shibbolethUser: data.user.shibbolethUser });
      data.user.hasOwnProperty("dept") && this.angulartics.setUserProperties.next({ dept: data.user.dept });
      data.user.hasOwnProperty("ssEnabled") && this.angulartics.setUserProperties.next({ ssEnabled: data.user.ssEnabled })

      if (data.isRememberMe || data.remoteaccess) {
        data.user.isLoggedIn = true
      } 
      this._auth.saveUser(data.user);
      this.errorMsg = '';
      if (this._auth.getFromStorage("stashedRoute")) {
        // We do not want to navigate to the page we are already on
        if (this._auth.getFromStorage("stashedRoute").indexOf('login') > -1) {
          this.router.navigate(['/home']);
        } else {
          this.router.navigateByUrl(this._auth.getFromStorage("stashedRoute"));
        }
        this._auth.deleteFromStorage("stashedRoute");
      } else {
        this.router.navigate(['/home']);
      }
    }
  }

  getLoginError(user) {
    this._auth.getLoginError(user)
      .then((data) => {
        if(data.message === 'loginExpired'){
          this.expirePwd = true;
          this.showPwdModal = true;
        }
        else if(data.message === 'loginFailed'){
          this.errorMsg = 'LOGIN.WRONG_PASSWORD';
        } else {
          //handles any server errors
          this.errorMsg = "LOGIN.SERVER_ERROR";
        }
      })
      .catch((error) => {
        this.errorMsg = this.getLoginErrorMsg(error.message);
      });
  }
  
  login(user: User) {
    user.username = user.username.toLowerCase().trim()
    this.loginLoading = true;
    // Clear error messaging
    this.errorMsg = ''
    this.forcePwdRst = false

    if(!this.validateEmail(user.username)){
      this.errorMsg = 'LOGIN.INVALID_EMAIL';
      this.loginLoading = false;
      return;
    }
    
    if(!this.validatePwd(user.password)){
      this.errorMsg = 'LOGIN.PASSWORD_REQUIRED';
      this.loginLoading = false;
      return;
    }

    this.angulartics.eventTrack.next({ action:"remoteLogin", properties: { category: "login", label: "attempt" }});

    this._auth.login(user)
      .then(
        (data)  => {
          this.loginLoading = false;
          if (data.status === false) {
            if(data.message === 'loginFailed' || data.message === 'Invalid credentials'){
              // Check if old bad-case password
              this.isBadCasePassword(user)
            }
            this.errorMsg = this.getLoginErrorMsg(data.message)
          } else if (!data.isRememberMe && !data.remoteaccess) {
            // In some situations the service might return an ip auth object even tho login was unsuccessful
            this.errorMsg = 'There was an issue with your account, please contact support.';
          } else {
            this.angulartics.eventTrack.next({ action:"remoteLogin", properties: { category: "login", label: "success" }});
            this.loadForUser(data);
          }
         
        }
      ).catch((err) => {
        this.loginLoading = false;
        let errObj = err.json ? err.json() : {};
        this.errorMsg = this.getLoginErrorMsg(errObj.message)
        if (!this.getLoginErrorMsg(errObj.message)){
          this.getLoginError(user)
          this.angulartics.eventTrack.next({ action:"remoteLogin", properties: { category: "login", label: "failed" }});
        }
        // Check if old bad-case password
        this.isBadCasePassword(user)
      });
  }

  getLoginErrorMsg(serverMsg: string) : string {
    if (serverMsg) {
       if(serverMsg === 'loginFailed' || serverMsg === 'Invalid credentials'){
        return 'LOGIN.WRONG_PASSWORD'
      } else if (serverMsg === 'loginExpired' || serverMsg === 'Login Expired') {
        return 'LOGIN.EXPIRED'
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
    if(user.password == user.password.toLowerCase()) {
      return;
    }
    // Try password all lowercase
    user.password = user.password.toLowerCase()
    this._auth.login(user).then((data) => {
      if (data.status === true) { 
        this.forcePwdRst = true
        this.errorMsg = ''
      }
    }, (error) => {
      console.error(error)

      /**
       * WORKAROUND for TEST: Earth's login service isn't properly redirecting based on context
       */
      this._auth.getUserInfo().take(1)
        .subscribe( data => {
          if (data.status === true && data.user && user.username == data.user.username) {
            this.forcePwdRst = true
            this.errorMsg = ''
          } 
        }, error => {
          
        });
    })
  }
  
  validateEmail(email: string){
    let re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
  }

  validatePwd(pwd){
    if((pwd.length >= 7) && (pwd.length <= 20) ){
      return true;
    }
    else{
      return false;
    }
  }

  /** 
   * Fired when the user logs in through their institution
   */
  goToInstLogin(): void {
    let len: number = this.loginInstitutions.length
    let selectedInst: any
    // search through the institutions store locally and see if the name the user selected matches one
    for (let i = 0; i < len; i++) {
      if (this.loginInstitutions[i].name == this.loginInstName) {
        selectedInst = this.loginInstitutions[i]
        break
      }
    }

    // if the user selected some institution that doesn't exist, kick them out!!
    if (!selectedInst) {
      this.instErrorMsg = "LOGIN.INSTITUTION_LOGIN.ERRORS.SELECT_INSTITUTION";
      return;
    }

    if (selectedInst.type === 'proxy') {
      // If proxy, simply open url:
      window.open(selectedInst.entityID);
    } else {
      // Else if Shibboleth, add parameters:
      // eg. for AUSS https://sso.artstor.org/sso/shibssoinit?idpEntityID=https://idp.artstor.org/idp/shibboleth&target=https%3A%2F%2Fsso.artstor.org%2Fsso%2Fshibbolethapplication%3Fo%3D0049a162-7dbe-4fcf-adac-d257e8db95e5
      let url = selectedInst.entityID ? selectedInst.entityID : '';
      let origin = window.location.origin + '/#/home';
      let ssoSubdomain = this._auth.getSubdomain() == 'library' ? 'sso' : 'sso.' + this._auth.getSubdomain()
      window.open('https://' + ssoSubdomain + '.artstor.org/sso/shibssoinit?idpEntityID=' + encodeURIComponent(url) + '&o=' + encodeURIComponent(origin));
    }
  }
  
}
