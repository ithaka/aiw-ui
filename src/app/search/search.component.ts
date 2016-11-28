import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { AppState } from '../app.service';

import { AssetService } from '../home/assets.service';

@Component({
  // The selector is what angular internally uses
  // for `document.querySelectorAll(selector)` in our index.html
  // where, in this case, selector is the string 'home'
  selector: 'search', 
  // We need to tell Angular's Dependency Injection which providers are in our app.
  providers: [
    AssetService
  ],
  // Our list of styles in our component. We may add more to compose many styles together
  styleUrls: [ './search.component.scss' ],
  // Every Angular template is first compiled by the browser before Angular runs it's compiler
  templateUrl: './search.component.html'
})
export class Search {
  // Set our default values
  localState = { value: '' };
  errors = {};
  results = [];
  activeSort = {
    index : 0,
    label : 'Relevance'
  };
  term;
  sub;

  // TypeScript public modifiers
  constructor(public appState: AppState, private _assets: AssetService, private route: ActivatedRoute) {

  }

  ngOnInit() {
    console.log('hello `Search` component');
    let searchScope = this;

    this.route.params.map(params => params['term'])
            .subscribe(term => { 
                searchScope.term = term;
                searchScope.searchAssets(term);
               });
  }

  searchAssets(term) {
    let searchScope = this;
    this._assets.search(term, this.activeSort.index)
      .then(function(res){
        console.log(res);
        searchScope.results = res.thumbnails;
      })
      .catch(function(err) {
        searchScope.errors['search'] = "Unable to load search.";
      });
  }

  changeSortOpt(index, label) {
    this.activeSort.index = index;
    this.activeSort.label = label; 
    this.searchAssets(this.term);
  }

  submitState(value: string) {
    console.log('submitState', value);
    this.appState.set('value', value);
    this.localState.value = '';
  }
}
