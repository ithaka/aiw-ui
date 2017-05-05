import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router'
import { Subscription }   from 'rxjs/Subscription';

import { AssetService } from './../shared/assets.service';
import { AssetFiltersService } from '../asset-filters/asset-filters.service';

import { AssetGrid } from './../asset-grid/asset-grid.component';

@Component({
  selector: 'ang-search-page', 
  providers: [],
  styleUrls: ['./search-page.component.scss'],
  templateUrl: './search-page.component.html',
})

export class SearchPage implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];

  @ViewChild(AssetGrid)
  private assetGrid: AssetGrid;

  private searchInResults: boolean = false;

  constructor(private _assets: AssetService, private route: ActivatedRoute, private _filters: AssetFiltersService, private _router: Router) {
    // this makes the window always render scrolled to the top
    this._router.events.subscribe(() => {
      window.scrollTo(0, 0);
    });
  }

  ngOnInit() {
    // Subscribe to term in params
    this.subscriptions.push(
      this.route.params.subscribe( (routeParams) => {
        this._filters.clearApplied();
        let params = Object.assign({}, routeParams);
        // If a page number isn't set, reset to page 1!
        if (!params['currentPage']){
          params['currentPage'] = 1;
        } 
        if (params["term"] ) {
          this._assets.queryAll(params);
        } else {
          console.log('No search term');
        }
      })
    ); 
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }

  private updateSearchInRes(value: boolean): void{
   this.searchInResults = value; 
  }
}