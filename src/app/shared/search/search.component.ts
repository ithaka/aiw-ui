import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { Subscription }   from 'rxjs/Subscription';

@Component({
  selector: 'ang-search',
  templateUrl: 'search.component.html'
})
export class SearchComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];

  private term: string;

  constructor(
    private _router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.subscriptions.push(
      this.route.params.subscribe((params) => {
        if (params['term']) {
          this.term = params['term'];
        }
      })
    )
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }

  /**
   * Called from template when new search term is entered
   * @param term Term for desired search
   */
  private updateSearchTerm(term: string) {
    this._router.navigate(['/search', term]);
  }
}