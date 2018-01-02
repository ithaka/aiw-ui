import { AssetFiltersService } from '../asset-filters/asset-filters.service';
import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Subscription }   from 'rxjs/Subscription';

import { AssetService } from './../shared/assets.service';
import { AssetSearchService } from './../shared/asset-search.service'
import { AnalyticsService } from '../analytics.service';
import { TagsService } from './tags.service';
import { Tag } from './tag/tag.class';
import { TitleService } from '../shared/title.service';

@Component({
  selector: 'ang-lib',
  templateUrl: 'library.component.pug',
  styleUrls: [ './browse-page.component.scss' ]
})
export class LibraryComponent implements OnInit {
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private _assets: AssetService,
    private _search: AssetSearchService,
    private _tags: TagsService,
    private _analytics: AnalyticsService,
    private _title: TitleService,
    private _filters: AssetFiltersService
  ) { }

  private loading: boolean = false;
  private subscriptions: Subscription[] = [];
  private selectedBrowseId: string = '';
  private browseMenuArray: any[];
  private categoryFacets: any[]
  private hierarchicalFacets: object = {}
  private facetType: string = ""
  private splashImgURL: string = '';
  private errorMessage: string = ''
  private JSObject: Object = Object;
  private JSArray: Object = Array;
  private encodeURIComponent = encodeURIComponent

  private tagsObj: any = {
    103 : [],
    250 : [],
    260 : [],
    270 : []
  };
  private descObj: any  = {};

  private categoryFacetMap = {
    '103': 'collectiontypenameid',
    '250': 'artclassification_str',
    '260': 'artstor-geography',
    // '270': '/browse/groups/public?tags=Teaching%2520Resources&page=1',
    'undefined': 'artcollectiontitle_str' // default
  }

  private facetQueryMap = {
    'artcollectiontitle_str': 'artcollectiontitle_str',
    'artclassification_str': 'artclassification_str',
    'artstor-geography': 'geography'
  }

  ngOnInit() {
    // clear applied filters because the facet links will run against search
    this._filters.clearApplied()

    // Set browse array
    this.browseMenuArray = [
      {
        label : 'Collection',
        id: this._assets.getRegionCollection().toString()
      },
      {
        label : 'Classification',
        id: this._assets.getRegionCollection(250).toString()
      },
      {
        label : 'Geography',
        id: this._assets.getRegionCollection(260).toString()
      },
      {
        label : 'Teaching Resources',
        id: this._assets.getRegionCollection(270).toString(),
        link: ['/browse/groups/public', {tags:'Teaching Resources', page: 1}]
      }
    ];
    // Update based on IDs
    this.tagsObj[this._assets.getRegionCollection().toString()]
    this.tagsObj[this._assets.getRegionCollection(250).toString()]
    this.tagsObj[this._assets.getRegionCollection(260).toString()]
    this.tagsObj[this._assets.getRegionCollection(270).toString()]
    // Set page title
    this._title.setSubtitle("Browse Collections")

    if (!this.route.snapshot.params['viewId']) {
      this.selectedBrowseId = this._assets.getRegionCollection().toString();
      this.getTags(this.selectedBrowseId);
      this.updateSplashImgURL();
    }

    this.subscriptions.push(
      this.route.params
      .subscribe((params: Params) => {
        this.loading = true;

        if(params && params['viewId']){
            let adjustedId = params['viewId']
            if (adjustedId.length < 4) {
              adjustedId = this._assets.getRegionCollection(params['viewId']).toString()
            }
            if (this.selectedBrowseId !== adjustedId){
              this.getTags(adjustedId);
            }
            this.selectedBrowseId = adjustedId;
            this.updateSplashImgURL();
        }

        // load category facets
        this.facetType = this.categoryFacetMap[this.selectedBrowseId]

        // empty out containers
        this.clearFacets()

        this._assets.categoryByFacet(this.facetType, 1)
        .then( (resData: any) => {
          // ensure they are emptied in case of multiple fast clicking
          this.clearFacets()

          if (resData.children) { // if is hierarchical
            this.hierarchicalFacets = resData.children
          } else {
            // sort on name
            this.categoryFacets = resData.sort((elemA, elemB) => {
              if (elemA.name > elemB.name) return 1
              else if (elemA.name < elemB.name) return -1
              else return 0
            })
          }

          this.loading = false;
        })

        this.loadDescription(this.selectedBrowseId);
      })
    );
    this._analytics.setPageValues('library', '')
  } // OnInit

  private clearFacets(): void {
    this.hierarchicalFacets = {}
    this.categoryFacets = []
  }

  private updateSplashImgURL(): void{
    if(this.selectedBrowseId === '103'){
      this.splashImgURL = '/assets/img/collection-splash.png';
    }
    else if(this.selectedBrowseId === '250'){
      this.splashImgURL = '/assets/img/classification-splash.png';
    }
    else if(this.selectedBrowseId === '260'){
      this.splashImgURL = '/assets/img/geography-splash.png';
    }
    else{
      this.splashImgURL = '';
    }
  }

  private getTags(browseId): void {
    if (!this.tagsObj[browseId] || this.tagsObj[browseId].length < 1) {
      this.loading = true;
      this._tags.initTags({ type: "library", collectionId: browseId})
      .then((tags) => {
        this.tagsObj[browseId] = tags;
        this.loading = false;
      })
      .catch((err) => {
        console.error(err);
      });
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }

  /**
   * Changes menu between ADL, University Collections, Open Collections, etc...
   * @param id Id of desired menu from colMenuArray enum
   */
  private selectBrowseOpt ( id: string ){
    let menuItem = this.browseMenuArray.find(elem => elem.id === id)

    // navigate if link prop available
    if (menuItem && menuItem.link) {
      this.router.navigate(menuItem.link)
    } else {
      this.getTags(id);
      this.selectedBrowseId = id;
      this.addRouteParam('viewId', id);
    }
  }

  /**
   * Sets browser response for description
   */
  private loadDescription(browseId): void{
    if (!this.descObj[browseId]) {
      this._assets.category( browseId )
        .then((res) => {
            this.descObj[browseId] = res;
        })
        .catch((err) => {
          this.loading = false;
          if (err.status === 401 || err.status === 403) {
            this.errorMessage = 'ACCESS_DENIED'
          } else {
            this.errorMessage = 'GENERIC_ERROR'
          }
          console.log('Unable to load category results.');
        });
    }
  }

    /**
   * Adds a parameter to the route and navigates to new route
   * @param key Parameter you want added to route (as matrix param)
   * @param value The value of the parameter
   */
  private addRouteParam(key: string, value: any) {
    let currentParamsObj: Params = Object.assign({}, this.route.snapshot.params);
    currentParamsObj[key] = value;

    this.router.navigate([currentParamsObj], { relativeTo: this.route });
  }
}
