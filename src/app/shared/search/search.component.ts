import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { Subscription }   from 'rxjs/Subscription';

import { AssetService } from '../';

@Component({
  selector: 'ang-search',
  templateUrl: 'search.component.html',
  styleUrls: [ './search.component.scss' ],
})
export class SearchComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];

  private showSearchModal: boolean = false;
  private term: string;

  private pageSize: number = 24;

  constructor(
    private _assets: AssetService,
    private _router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.subscriptions.push(
      this.route.params.subscribe((params) => {
        if (params['term']) {
          this.formatSearchTerm(params['term']);
          // this.term = params['term'];
        }
      })
    );

    // Subscribe to pagination values
    this.subscriptions.push(
      this._assets.pagination.subscribe((pagination: any) => {
        this.pageSize = parseInt(pagination.pageSize);
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }

  /**
   * Called from template when new search term is entered
   * @param term Term for desired search
   */
  private updateSearchTerm(term: string) {
    if (!term || term === "") {
      term = "*";
    }
    this._router.navigate(['/search', term, { currentPage: 1, pageSize: this.pageSize }]);
  }

  /**
   * Formats search string to strip symbols
   * @param searchString Search term from the URL
   */
  private formatSearchTerm(searchString: string) {
    let queries = searchString.split('#');
    let searchTerm = '';

    for(let query of queries){
      let queryParts = query.split(',');
      if(queryParts.length > 1){
        searchTerm += ' ' + queryParts[0].toUpperCase();
        searchTerm += ' ' + queryParts[1].split('|')[0];
      }
      else if(queryParts.length === 1){
        searchTerm += queryParts[0].split('|')[0];
      }
    }

    this.term = searchTerm;
  }
}