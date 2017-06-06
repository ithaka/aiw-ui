import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { Angulartics2 } from 'angulartics2';
import { CompleterService, CompleterData } from 'ng2-completer';

import { AuthService, LoggingService } from './../shared';
import { LoginService, User } from './login.service';
import { AnalyticsService } from '../analytics.service';

@Component({
  // The selector is what angular internally uses
  // for `document.querySelectorAll(selector)` in our index.html
  // where, in this case, selector is the string 'home'
  selector: 'login',
  // We need to tell Angular's Dependency Injection which providers are in our app.
  providers: [
    LoginService
  ],
  // Our list of styles in our component. We may add more to compose many styles together
  styleUrls: [ './login.component.scss' ],
  // Every Angular template is first compiled by the browser before Angular runs it's compiler
  templateUrl: './login.component.html'
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
  public successMsgPwdRst = '';
  public loginInstitutions = []; /** Stores the institutions returned by the server */
  private loginInstName: string = '' /** Bound to the autocomplete field */
  public showRegister: boolean = false;
  
  private loginLoading = false;

  private dataService: CompleterData
  
  // TypeScript public modifiers
  constructor(
    private _auth: AuthService,
    private _login: LoginService,
    private _log: LoggingService,
    private _completer: CompleterService,
    private router: Router,
    private location: Location,
    private angulartics: Angulartics2,
    private _analytics: AnalyticsService
  ) { 
  }

  ngOnInit() {
    // this handles showing the register link for only ip auth'd users
    this._login.getIpAuth()
      .take(1)
      .subscribe((res) => {
        if (res.remoteaccess === false && res.user) {
          this.showRegister = true;
        }
      }, (err) => {
        console.error(err);
      });

    this._login.getInstitutions()
      .then((data) => {
        if (data.items) {
          this.loginInstitutions = data.items;
          this.dataService = this._completer.local(data.items, 'name', 'name')
        }
      })
      .catch((error) => {
        this.instErrorMsg = "We've experience an error and are unable to retrieve the insitutions";
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

      if (data.user.isRememberMe || data.user.remoteaccess) {
        data.user.isLoggedIn = true
      } 
      this._auth.saveUser(data.user);
      this.errorMsg = '';
      if (this._auth.getFromStorage("stashedRoute")) {
        this.router.navigateByUrl(this._auth.getFromStorage("stashedRoute"));
        this._auth.deleteFromStorage("stashedRoute");
      } else {
        this.router.navigate(['/home']);
      }
    }
  }

  getLoginError(user) {
    this._login.getLoginError(user)
      .then((data) => {
        if(data.message === 'loginExpired'){
          this.expirePwd = true;
          this.showPwdModal = true;
        }
        else if(data.message === 'loginFailed'){
          this.errorMsg = 'Invalid email address or password. Try again.';
        } else {
          //handles any server errors
          this.errorMsg = "LOGIN.SERVER_ERROR";
        }
      })
      .catch((error) => {
        this.errorMsg = "LOGIN.SERVER_ERROR";
      });
  }
  
  login(user: User) {
    user.username = user.username.toLowerCase().trim()
    this.loginLoading = true;
    if(!this.validateEmail(user.username)){
      this.errorMsg = 'Please enter a valid email address';
      this.loginLoading = false;
      return;
    }
    
    if(!this.validatePwd(user.password)){
      this.errorMsg = 'Password must be 7-20 characters';
      this.loginLoading = false;
      return;
    }

    this.angulartics.eventTrack.next({ action:"remoteLogin", properties: { category: "login", label: "attempt" }});

    this._login.login(user)
      .then(
        (data)  => {
          this.loginLoading = false;
          if (data.status === false) {
            if(data.message === 'loginFailed'){
              this.errorMsg = 'Invalid email address or password. Try again.';
            } else if (data.message === 'loginExpired') {
              this.errorMsg = 'That login is expired. Please login from campus to renew your account.';
            }
          } else {
            this.angulartics.eventTrack.next({ action:"remoteLogin", properties: { category: "login", label: "success" }});
            this._log.Warp6({ eventType: "remote_login" });
            this.loadForUser(data);
          }
         
        }
      ).catch((err) => {
        this.loginLoading = false;
        let errObj = err.json ? err.json() : {};
         if(errObj.message === 'Invalid credentials'){
            this.errorMsg = 'Invalid email address or password. Try again.';
          } else if (errObj.message === 'Login Expired' || errObj.message === 'loginExpired') {
            this.errorMsg = 'That login is expired. Please login from campus to renew your account.';
          } else {
            this.getLoginError(user)
            this.angulartics.eventTrack.next({ action:"remoteLogin", properties: { category: "login", label: "failed" }});
          }

         /**
         * WORKAROUND for TEST: Earth's login service isn't properly redirecting based on context
         */
        this._auth.getUserInfo().take(1)
          .subscribe( data => {
            console.log(data);
            if (data.status === true && data.user && user.username == data.user.username) {
              this.angulartics.eventTrack.next({ action:"remoteLogin", properties: { category: "login", label: "success" }});
              this._log.Warp6({ eventType: "remote_login" });
              this.loadForUser(data);
            } else {
               if(data.message === 'loginFailed'){
                this.errorMsg = 'Invalid email address or password. Try again.';
              } else if (data.message === 'loginExpired') {
                this.errorMsg = 'That login is expired. Please login from campus to renew your account.';
              }
            }
          }, error => {
            
          });

      });
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
      this.instErrorMsg = "Please select an institution";
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
      window.open('https://sso.artstor.org/sso/shibssoinit?idpEntityID=' + encodeURIComponent(url) + '&o=' + encodeURIComponent(origin));
    }
  }

  toggleAccessHelpModal() {
    this.showHelpModal = !this.showHelpModal;
  }
  
}
