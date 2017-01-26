import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { AppState } from '../app.service';

import { AssetService } from '../shared';
import { AuthService } from '../shared';

@Component({
  // The selector is what angular internally uses
  // for `document.querySelectorAll(selector)` in our index.html
  // where, in this case, selector is the string 'home'
  selector: 'home',  // <home></home>
  // We need to tell Angular's Dependency Injection which providers are in our app.
  providers: [
    AuthService
  ],
  // Our list of styles in our component. We may add more to compose many styles together
  styleUrls: [ './home.component.scss' ],
  // Every Angular template is first compiled by the browser before Angular runs it's compiler
  templateUrl: './home.component.html'
})
export class Home {
  // Set our default values
  localState = { value: '' };
  collections = [];
  errors = {};
  user = {};
  private term: string = "";

  // TypeScript public modifiers
  constructor(
      public appState: AppState, 
      private _assets: AssetService, 
      private router: Router,
      private _auth: AuthService
    ) {

  }

  ngOnInit() {    
    this.user = this._auth.getUser();
    
    // this.title.getData().subscribe(data => this.data = data);
    this._assets.getCollections('ssc')
      .then((res) => {
        this.collections = res['Collections'];
      })
      .catch((err) => {
        this.errors['collections'] = "Unable to load collections.";
      });
  }

  searchAssets(term: string) {
    this.router.navigate(['search', term]);
  }

  submitState(value: string) {
    console.log('submitState', value);
    this.appState.set('value', value);
    this.localState.value = '';
  }
}
