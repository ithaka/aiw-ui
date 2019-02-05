import { Component, OnInit, OnDestroy, Input, Output } from '@angular/core'
import { Router, ActivatedRoute, NavigationEnd, Params } from '@angular/router'
import { Subscription } from 'rxjs'
import { map } from 'rxjs/operators'
import { Angulartics2 } from 'angulartics2'

// Project dependencies
import { AssetService } from '../../shared/assets.service'
import { AssetFiltersService } from '../../asset-filters/asset-filters.service'
import { AuthService } from '../auth.service'
import { DomUtilityService } from '../../shared';

@Component({
  selector: 'ang-search',
  templateUrl: 'search.component.pug',
  styleUrls: [ './search.component.scss' ]
})
export class SearchComponent implements OnInit, OnDestroy {

  public showSearchModal: boolean = false;
  public term: string;
  public startSearch: boolean = false;

  @Input()
  public allowSearchInRes: boolean;

  @Input()
  public UserNotLoggedIn: boolean;
  private subscriptions: Subscription[] = [];

  private size: number = 24;

  // @Input()
  private searchInResults: boolean = false;

  private nestedSrchLbl: string = 'results';

  constructor(
    private _assets: AssetService,
    private _router: Router,
    private route: ActivatedRoute,
    private angulartics: Angulartics2,
    private _filters: AssetFiltersService,
    private _auth: AuthService,
    private _dom: DomUtilityService
  ) {
    // console.log("Constructing Search component...")
  }

  ngOnInit() {
    this.subscriptions.push(
      this.route.params.pipe(
        map(params => {
          if (params.term) {
            this.formatSearchTerm(params.term)
          }
      })).subscribe()
    )

    // Subscribe to pagination values
    this.subscriptions.push(
      this._assets.pagination.pipe(
        map(pagination => {
          this.size = parseInt(pagination.size)
      })).subscribe()
    )

    this.subscriptions.push(
      this._router.events.pipe(
        map(event => {
          this.startSearch = false; // Remove error message when applying filter
          if (event instanceof NavigationEnd) {
            let routeName = event.url.split('/')[1]
            if ((routeName === 'category') || (routeName === 'collection')){
              this.nestedSrchLbl = routeName;
            }
            else{
              this.nestedSrchLbl = 'results'
            }
          }
        }
      )).subscribe()
    )
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe() })
  }

  /**
   * Called from template when new search term is entered
   * @param term Term for desired search
   */
  public updateSearchTerm(term: string) {
    if (!term || term === '') {
      return
    }

    // Clear filters for new search
    this._filters.clearApplied()

    // Pipes are reserved by Advanced Search
    term = term.replace('|', ' ')

    this.angulartics.eventTrack.next({ action: 'simpleSearch', properties: { category: this._auth.getGACategory(), label: this.term }})

    let routeParams = this.route.snapshot.params;
    let params: Params = {
      page: 1,
      size: this.size
    }

    // Maintain feature flags
    if (routeParams.featureFlag) {
      params.featureFlag = routeParams.featureFlag
    }

    if (this.searchInResults){ // Search within results

      if (routeParams.colId){
        // params['coll'] = [ routeParams['colId'] ];
        params.term = term;
        this._router.navigate( [ '/collection', routeParams['colId'], params ] );
        return;
      }
      else if (routeParams.catId){
        params.term = term;
        this._router.navigate( [ '/category', routeParams.catId, params ] );
        return;
      }
      else if (routeParams.pcolId){
        params.term = term;
        this._router.navigate( [ '/pcollection', routeParams.pcolId, params ] );
        return;
      }
      else if (routeParams.term){
        let updatedTermValue = '';
        updatedTermValue = routeParams.term + ' AND ' + term;
        term = updatedTermValue;

        if (routeParams.classification){
          params.classification = routeParams.classification.split(',');
        }
        if (routeParams.coll){
          params.coll = routeParams.coll.split(',');
        }
        if (routeParams.collTypes){
          params.collTypes = routeParams.collTypes.split(',');
        }
        if (routeParams.geography){
          params.geography = routeParams.geography.split(',');
        }
      }
    }

    // Allow user to reload search (eg., hitting enter on search field)
    this._router.navigate(['/search', term, params])
      .then((navigated) => {
        if (!navigated) {
          // trigger re-search here
          this._assets.queryAll(this.route.snapshot.params, true)
        }
      })
  }

  public setFocus(): void {
    window.setTimeout(() => {
      if (this._dom.byId('empty-search-alert')){
        this._dom.byId('empty-search-alert').focus()
      }
    }, 110);
  }

  /**
   * Formats search string to strip symbols
   * @param searchString Search term from the URL
   */
  private formatSearchTerm(searchString: string) {
    let queries = searchString.split('#');
    let searchTerm = '';

    for (let query of queries){
      let queryParts = query.split(',');
      if (queryParts.length > 1){
        searchTerm += ' ' + queryParts[0].toUpperCase();
        searchTerm += ' ' + queryParts[1];
        // searchTerm += ' ' + queryParts[1].split('|')[0];
      }
      else if (queryParts.length === 1){
        searchTerm += queryParts[0];
        // searchTerm += queryParts[0].split('|')[0];
      }
    }

    this.term = searchTerm;
  }

  /**
   * 'ngModelChange' event handler for 'search within' checkbox
   * @param value New value of the checkbox
   */
  private onSearchWithinChange(value: boolean): void{
    this._filters.searchWithin = value
  }
}
