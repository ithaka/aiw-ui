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
  
  // TypeScript public modifiers
  constructor(public appState: AppState, private _service: AuthenticationService, private router: Router, private location: Location) { 
    
  }
  
  loadForUser(user) {
    if (user.user) {
      console.log(user.user);
    }
    this.router.navigate(['/home']);
    // this.location.go('/home');

  }
  
  login(user) {
    this._service.login(user)
      .then(
        data  => this.loadForUser(data),
        error =>  this.errorMsg = <any>error
      );
  }

  showPwdResetModal() {
    console.log('works!');
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
