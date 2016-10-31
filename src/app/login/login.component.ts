import { Component } from '@angular/core';

import { AppState } from '../app.service';
import { AuthenticationService, User } from './login.service';

@Component({
  // The selector is what angular internally uses
  // for `document.querySelectorAll(selector)` in our index.html
  // where, in this case, selector is the string 'home'
  selector: 'login',  // <home></home>
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
  constructor(public appState: AppState, private _service: AuthenticationService) { }
  
  login() {
    this._service.login(function(user) {
      console.log(user);
    });
    //this.user
      // if(!this._service.login()){
      //     this.errorMsg = 'Failed to login';
      // } else {
      //     this.errorMsg = 'Success';
      // }
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
