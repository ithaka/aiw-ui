import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AppState } from '../app.service';
import { Location } from '@angular/common';
import { Angulartics2 } from 'angulartics2';

import { AuthService } from './../shared/auth.service';
import { LoginService, User } from './login.service';

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
  // templateUrl: './login.component.html'
  template: `<h1>Test title</h1>`
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
  public loginInstitutions = [];
  public loginInst;
  
  private loginLoading = false;
  
  // TypeScript public modifiers
  constructor(
    public appState: AppState,
    private _auth: AuthService,
    private _login: LoginService,
    private router: Router,
    private location: Location,
    private angulartics: Angulartics2
  ) { 
    
  }

  ngOnInit() {
    this._login.getInstitutions()
      .then((data) => {
        if (data.items) {
          this.loginInstitutions = data.items;
        }
      })
      .catch((error) => {
        this.instErrorMsg = "We've experience an error and are unable to retrieve the insitutions";
        console.error(error);
      })
  }
  
  loadForUser(data: any) {
    if (data && data.user) {
      data.user.hasOwnProperty("username") && this.angulartics.setUsername.next(data.user.username);
      data.user.hasOwnProperty("institutionId") && this.angulartics.setUserProperties.next({ institutionId: data.user.institutionId });
      data.user.hasOwnProperty("isLoggedIn") && this.angulartics.setUserProperties.next({ isLoggedIn: data.user.isLoggedIn });
      data.user.hasOwnProperty("shibbolethUser") && this.angulartics.setUserProperties.next({ shibbolethUser: data.user.shibbolethUser });
      data.user.hasOwnProperty("dept") && this.angulartics.setUserProperties.next({ dept: data.user.dept });
      data.user.hasOwnProperty("ssEnabled") && this.angulartics.setUserProperties.next({ ssEnabled: data.user.ssEnabled })

      data.user.isLoggedIn = true;
      this._auth.saveUser(data.user);
      this.errorMsg = '';
      console.log(this._auth.getUser());
      if (this._auth.getFromStorage("stashedRoute")) {
        this.router.navigateByUrl(this._auth.getFromStorage("stashedRoute"));
        this._auth.deleteFromStorage("stagedRoute");
      } else {
        this.router.navigate(['/home']);
      }
    }
  }

  getLoginError(user) {
    console.log("LOGIN ERROR!");
    this._login.getLoginError(user)
      .then((data) => {
        console.log(data);
        if(data.message === 'loginExpired'){
          this.expirePwd = true;
          this.showPwdModal = true;
        }
        else if(data.message === 'loginFailed'){
          this.errorMsg = 'Invalid email address or password. Try again.';
        } else {
          //handles any server errors
          this.errorMsg = "There was a connection error, please try again! If the problem persists, try again later.";
        }
      })
      .catch((error) => {
        this.errorMsg = "There was a connection error, please try again! If the problem persists, try again later.";
      });
  }
  
  login(user: User) {
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
              this.errorMsg = 'Whoops, that login don’t work no mo. Please login from campus to renew your account.';
            }
          } else {
            this.angulartics.eventTrack.next({ action:"remoteLogin", properties: { category: "login", label: "success" }});
            this.loadForUser(data); 
          }
         
        }
      ).catch((err) => {
        this.loginLoading = false;
        console.log(err);
        this.getLoginError(user)
        this.angulartics.eventTrack.next({ action:"remoteLogin", properties: { category: "login", label: "failed" }});
      });
  }
  
  validateEmail(email){
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

  goToInstLogin() {
    let url = this.loginInst.entityID ? this.loginInst.entityID : '';
    let type = this.loginInst.type ? this.loginInst.type : '';
    let origin = window.location.origin + '/#/home';

    if (type === 'proxy') {
      // If proxy, simply open url:
      window.open(this.loginInst.entityID);
    } else {
      // Else if Shibboleth, add parameters:
      // eg. for AUSS https://sso.artstor.org/sso/shibssoinit?idpEntityID=https://idp.artstor.org/idp/shibboleth&target=https%3A%2F%2Fsso.artstor.org%2Fsso%2Fshibbolethapplication%3Fo%3D0049a162-7dbe-4fcf-adac-d257e8db95e5
      window.open('https://sso.artstor.org/sso/shibssoinit?idpEntityID=' + encodeURIComponent(url) + '&o=' + encodeURIComponent(origin));
    }
  }

  showPwdResetModal() {
    this.pwdReset = true;
    this.showPwdModal = true;
  }

  hidePwdModal() {
    this.pwdRstEmail = '';
    this.successMsgPwdRst = '';
    this.pwdReset = false;
    this.expirePwd = false;
    this.showPwdModal = false;
  }

  toggleAccessHelpModal() {
    this.showHelpModal = !this.showHelpModal;
  }

  sendResetPwdRequest(){
    this._login.pwdReset(this.pwdRstEmail)
      .then(
        (data)  => { this.loadPwdRstRes(data) },
        (error) => { this.errorMsgPwdRst = <any>error }
      );
  }
  loadPwdRstRes(res: any){
    if(res.status === false){
      this.errorMsgPwdRst = 'Sorry! ' + this.pwdRstEmail + ' is invalid for ARTstor.';
      setTimeout(() => {
        this.errorMsgPwdRst = '';
                }, 8000);
      this.pwdRstEmail = '';
    }
    else{
      this.pwdReset = false;
      this.successMsgPwdRst = 'Your password has been sent.';
    }
  }
}
