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
  public pwdRstEmail = '';
  public errorMsgPwdRst = '';
  public successMsgPwdRst = '';
  
  // TypeScript public modifiers
  constructor(public appState: AppState, private _auth: AuthenticationService, private router: Router, private location: Location) { 
    
  }
  
  loadForUser(user) {
    if (user && user.user) {
      this._auth.saveUser(user.user);
    }
    this.router.navigate(['/home']);
    // this.location.go('/home');

  }
  
  login(user) {
    this._auth.login(user)
      .then(
        data  => this.loadForUser(data),
        error =>  this.errorMsg = <any>error
      );
  }

  showPwdResetModal() {
    this.showPwdModal = true;
  }

  hidePwdResetModal() {
    this.pwdRstEmail = '';
    this.successMsgPwdRst = '';
    this.showPwdModal = false;
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
                },5000);
      this.pwdRstEmail = '';
    }
    else{
      this.successMsgPwdRst = 'Your password has been sent.';
    }
  }

  ngOnInit() {
    console.log('hello `Login` component');
    // this.title.getData().subscribe(data => this.data = data);
  }

  submitState(value: string) {
    console.log('submitState', value);
    this.appState.set('value', value);
    this.localState.value = '';
  }
}
