import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';

import { AppState } from '../app.service';
import { AssetService, AuthService } from '../shared';

@Component({
  // The selector is what angular internally uses
  // for `document.querySelectorAll(selector)` in our index.html
  // where, in this case, selector is the string 'home'
  selector: 'home',  // <home></home>
  // Our list of styles in our component. We may add more to compose many styles together
  styleUrls: [ './home.component.scss' ],
  // Every Angular template is first compiled by the browser before Angular runs it's compiler
  templateUrl: './home.component.html'
})
export class Home implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];

  // Set our default values
  localState = { value: '' };
  collections = [];
  institution: any = {};
  errors = {};
  private user: any;
  private blogPosts: any[] = [];
  private blogLoading: boolean = true;

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

    this.subscriptions.push(
      this._auth.getInstitution().subscribe((institutionObj) => {
        this.institution = institutionObj;
        console.log(this.institution);
      })
    );
    
    // this.title.getData().subscribe(data => this.data = data);
    this._assets.getCollections('ssc')
      .then((res) => {
        this.collections = res['Collections'];
      })
      .catch((err) => {
        this.errors['collections'] = "Unable to load collections.";
      });


      this._assets.getBlogEntries()
        .then((data) => {
          if (data.posts) {
            this.blogPosts = data.posts;
          }
          this.blogLoading = false;
        },)
        .catch((error) => {
          console.log(error);
          this.blogLoading = false;
        });
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }

  submitState(value: string) {
    console.log('submitState', value);
    this.appState.set('value', value);
    this.localState.value = '';
  }
}
