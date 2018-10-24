import { AssetFiltersService } from '../asset-filters/asset-filters.service'
import { Component, OnInit } from '@angular/core'
import { Router, ActivatedRoute, Params } from '@angular/router'
import { Subscription }   from 'rxjs'
import { map } from 'rxjs/operators'

import { AssetService } from './../shared/assets.service'
import { AssetSearchService } from './../shared/asset-search.service'
import { AuthService } from './../shared/auth.service'
import { TagsService } from './tags.service'
import { Tag } from './tag/tag.class'
import { TitleService } from '../shared/title.service'
import { LockerService } from 'app/_services';


@Component({
  selector: 'ang-lib',
  templateUrl: 'library.component.pug',
  styleUrls: [ './browse-page.component.scss' ]
})
export class LibraryComponent implements OnInit {
  public unaffiliatedUser: boolean = false

  public loading: boolean = false;
  public selectedBrowseId: string = '';
  public browseMenuArray: any[];
  public categoryFacets: any[]
  public hierarchicalFacets: object = {}
  public facetType: string = ''
  public errorMessage: string = ''
  public ObjectKeys = Object.keys;
  public searchTerm: string = ''
  public descObj: any  = {
    '103' : 'BROWSE.LIBRARY_COLLECTION',
    '250' : 'BROWSE.CLASSIFICATION',
    '260' : 'BROWSE.GEOGRAPHY'
  };
  public facetQueryMap = {
    'artcollectiontitle_str': 'artcollectiontitle_str',
    'artclassification_str': 'artclassification_str',
    'artstor-geography': 'geography',
    'categoryid': 'category'
  }
  private subscriptions: Subscription[] = [];
  private splashImgURL: string = '';
  private JSArray: Object = Array;
  private encodeURIComponent = encodeURIComponent

  private tagsObj: any = {
    103 : [],
    250 : [],
    260 : [],
    270 : []
  };

  private categoryFacetMap = {
    '103': 'categoryid',
    '250': 'artclassification_str',
    '260': 'artstor-geography',
    // '270': '/browse/groups/public?tags=Teaching%2520Resources&page=1',
    'undefined': 'artcollectiontitle_str' // default
  }

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private _assets: AssetService,
    private _auth: AuthService,
    private _search: AssetSearchService,
    private _tags: TagsService,
    private _title: TitleService,
    private _filters: AssetFiltersService,
    private _locker: LockerService
  ) {
    this.unaffiliatedUser = this._auth.isPublicOnly() ? true : false
  }

  ngOnInit() {
    // clear applied filters because the facet links will run against search
    this._filters.clearApplied()

    // Set browse array
    this.browseMenuArray = [
      {
        label : 'Collection',
        id: '103'
      },
      {
        label : 'Classification',
        id: '250'
      },
      {
        label : 'Geography',
        id: '260'
      },
      {
        label : 'Teaching Resources',
        id: '270',
        link: ['/browse/groups/public', {tags: 'Teaching Resources', page: 1}]
      }
    ];
    // Set page title
    this._title.setSubtitle('Browse Collections')

    if (!this.route.snapshot.params['viewId']) {
      this.selectedBrowseId = '103'
    }

    this.subscriptions.push(
      this.route.params.pipe(
      map((params: Params) => {
        this.loading = true

        if (params && params['viewId']){
            this.selectedBrowseId = params['viewId'].toString()
            // this.updateSplashImgURL();
        }

        if (params && params['searchTerm']){
          this.searchTerm = params['searchTerm']
        }
        // load category facets
        // > Use locally scope variable to avoid data crossover
        let facetType = this.facetType = this.categoryFacetMap[this.selectedBrowseId]

        // Clear facet objects/arrays
        this.clearFacets()

        // Fetch browse collection object from local storage & check if the required collection list has already been set
        let storageBrwseColObj = this._locker.get('browseColObject')

        let hasCategoryTitles = storageBrwseColObj && storageBrwseColObj['categoryid'] && storageBrwseColObj['categoryid'][2] && storageBrwseColObj['categoryid'][2].title.length > 0
        if ( storageBrwseColObj && storageBrwseColObj[facetType] && hasCategoryTitles){
          if (facetType === 'artstor-geography'){
            this.hierarchicalFacets = storageBrwseColObj[facetType]
          } else{
            this.categoryFacets = storageBrwseColObj[facetType]
          }
          this.loading = false
        } else{

          if (storageBrwseColObj === null){
            storageBrwseColObj = {}
          }
          // Get facets from Solr/search
          this._assets.categoryByFacet(facetType, 1)
          .then( (facetData) => {
            // ensure they are emptied in case of multiple fast clicking
            this.clearFacets()

            // Categoryid facets require an additional call for labels/titles
            if (facetType == 'categoryid') {

                this._assets.categoryNames()
                  .then((data) => {
                    // Create an index by ID for naming the facets
                    let categoryIndex = data.reduce( ( result, item ) => {
                        result[item.categoryId] = item.categoryName;
                        return result;
                    }, {});
                    // Append titles to the facets (we can't replace "name", as its the ID, which we need)
                    let categoryFacets: any[] = facetData
                      .map( facet => {
                        facet.title = categoryIndex[facet.name] ? categoryIndex[facet.name] : ''
                        return facet
                      })
                      // Then also sort the facets, A-Z
                      .sort((elemA, elemB) => {
                        if (elemA.title > elemB.title) return 1
                        else if (elemA.title < elemB.title) return -1
                        else return 0
                      })
                    this.loading = false

                    this.categoryFacets = categoryFacets

                    storageBrwseColObj[facetType] = this.categoryFacets
                    this._locker.set('browseColObject', storageBrwseColObj)
                  })
                  .catch((err) => {
                    console.error(err)
                  })
              // }
            } else if (facetData[0].children) {
              // Hierarchical facets are stored in a separate object
              this.hierarchicalFacets = facetData[0].children
              this.loading = false

              storageBrwseColObj[facetType] = this.hierarchicalFacets
              this._locker.set('browseColObject', storageBrwseColObj)
            } else {
              // Generically handle all other facets, which use "name" property to filter and display
              // - Sort by name, A-Z, then set to categoryFacets array
              let categoryFacets: any[] = facetData.sort((elemA, elemB) => {
                if (elemA.name > elemB.name) return 1
                else if (elemA.name < elemB.name) return -1
                else return 0
              })

              // Filter out categories containing pipe in name field
              this.categoryFacets = categoryFacets.filter((category) => {
                return category.name.indexOf('|') === -1
              })

              this.loading = false

              storageBrwseColObj[facetType] = this.categoryFacets
              this._locker.set('browseColObject', storageBrwseColObj)
            }
          })
        }
      })).subscribe()
    )

  } // OnInit

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }

  private clearFacets(): void {
    this.hierarchicalFacets = {}
    this.categoryFacets = []
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
      this.selectedBrowseId = id;
      this.addRouteParam('viewId', id);
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

  private getLinkParam(facetType, facetName) {
    let param = {}
    if (this.facetQueryMap[facetType]) {
      param[this.facetQueryMap[facetType]] = facetName
    }
    return param
  }

  private clearSearchTerm() {
    this.searchTerm = ''
    this.addRouteParam('searchTerm', this.searchTerm)
  }
}
