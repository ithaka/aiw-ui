import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router'
import { Subscription }   from 'rxjs/Subscription';

import { AssetService } from './../shared/assets.service';
import { AssetFiltersService } from '../asset-filters/asset-filters.service';

import { AssetGrid } from './../asset-grid/asset-grid.component';

@Component({
  selector: 'ang-search-page', 
  providers: [],
  styles: [ '' ],
  templateUrl: './search-page.component.html'
})

export class SearchPage implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];

  @ViewChild(AssetGrid)
  private assetGrid: AssetGrid;

  constructor(private _assets: AssetService, private route: ActivatedRoute, private _filters: AssetFiltersService, private _router: Router) {

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
        if (params["term"]) {
          this._assets.queryAll(params);
        } else {
          throw new Error("Search error - no search term");
        }
      })
    ); 
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }

  /**
   * Generate Image URL for the selected image in Edit Mode 
   * @param event Event emitted from the nav-menu
   */
  private generateSelectedImgURL(event): void{
      this.assetGrid.generateImgUrl();
  }
}