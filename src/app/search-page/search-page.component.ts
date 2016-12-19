import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router'
import { Subscription }   from 'rxjs/Subscription';

import { AssetService } from './../shared/assets.service';

@Component({
  selector: 'ang-search-page', 
  providers: [],
  styles: [ '' ],
  templateUrl: './search-page.component.html'
})

export class SearchPage implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];

  private term: string;

  constructor(private _assets: AssetService, private route: ActivatedRoute) {

  }

  ngOnInit() {
    // Subscribe to term in params
    this.subscriptions.push(
      this.route.params.subscribe((routeParams) => {
        this.term = routeParams["term"];
        if (this.term) {
          this._assets.queryAll();
        } else {
          throw new Error("Search error - no search term");
        }
        
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }
}