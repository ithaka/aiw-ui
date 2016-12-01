import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { AppState } from '../app.service';
import { AuthenticationService, User } from './login.service';
import { Location } from '@angular/common';

@Component({
  // The selector is what angular internally uses
  // for `document.querySelectorAll(selector)` in our index.html
  // where, in this case, selector is the string 'home'
  selector: 'login',
  // We need to tell Angular's Dependency Injection which providers are in our app.
  providers: [
    AuthenticationService
  ],
  // Our list of styles in our component. We may add more to compose many styles together
  styleUrls: [ './login.component.scss' ],
  // Every Angular template is first compiled by the browser before Angular runs it's compiler
  templateUrl: './login.component.html'
})
export class Login {
  // Set our default values
  localState = { value: '' };
  public user = new User('','');
  public errorMsg = '';
  public showPwdModal = false;
  public showHelpModal = false;
  public pwdReset = false;
  public expirePwd = false;
  public pwdRstEmail = '';
  public errorMsgPwdRst = '';
  public successMsgPwdRst = '';
  public loginInstitutions = [];
  public loginInst;
  
  // TypeScript public modifiers
  constructor(public appState: AppState, private _auth: AuthenticationService, private router: Router, private location: Location) { 
    
  }

  ngOnInit() {
    let scope = this;

    this._auth.getInstitutions()
      .then(function(data){
        console.log(data);
        if (data.items) {
          scope.loginInstitutions = data.items;
        }
      });
  }
  
  loadForUser(user) {
    if (user && user.user) {
      this._auth.saveUser(user.user);
      this.errorMsg = '';
      this.router.navigate(['/home']);
    }
  }

  getLoginError(user) {
    console.log("LOGIN ERROR!");
    let scopeObj = this;
    scopeObj._auth.getLoginError(user)
    .then(function(data){
      console.log(data);
      if(data.message === 'loginExpired'){
        scopeObj.expirePwd = true;
        scopeObj.showPwdModal = true;
      }
      else if(data.message === 'loginFailed'){
        scopeObj.errorMsg = 'Invalid email address or password. Try again.';
      }
    });
  }
  
  login(user) {
    let scope = this;

    if(!scope.validateEmail(user.username)){
      scope.errorMsg = 'Please enter a valid email address';
      return;
    }
    
    if(!scope.validatePwd(user.password)){
      scope.errorMsg = 'Password must be 7-20 characters';
      return;
    }

    scope._auth.login(user)
      .then(
        data  => scope.loadForUser(data),
        error =>  scope.getLoginError(user)
      ).catch(function(err) {
        scope.getLoginError(user)
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
    this._auth.pwdReset(this.pwdRstEmail)
      .then(
        data  => this.loadPwdRstRes(data),
        error =>  this.errorMsgPwdRst = <any>error
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

  submitState(value: string) {
    console.log('submitState', value);
    this.appState.set('value', value);
    this.localState.value = '';
  }
}
