/**
 * Assets service [DEPRECATED, do not add new functions/properties]
 * - Search calls should be moved to asset-search.service as we implement Solr
 */
import { Injectable, OnDestroy, OnInit, EventEmitter } from '@angular/core'
import { Router, ActivatedRoute, Params } from '@angular/router'
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http'
import { Observable, BehaviorSubject, Subject } from 'rxjs'

import { Subscription }   from 'rxjs'
import { map } from 'rxjs/operators'
import { categoryName } from './datatypes/category.interface'

// Project Dependencies
import { AuthService } from './auth.service'
import { GroupService } from './group.service'
import { AssetFiltersService } from './../asset-filters/asset-filters.service'
import { ToolboxService } from './toolbox.service'
import { AssetSearchService, SearchResponse } from './asset-search.service'
import { ImageGroup, Thumbnail } from '.'
import { AppConfig } from 'app/app.service'
import { APP_CONST } from '../app.constants'
import { ArtstorStorageService } from '../../../projects/artstor-storage/src/public_api';

@Injectable()
export class AssetService {

    /** Constant that defines which collectionType belongs to institutions */
    static readonly institutionCollectionType: number = 2
    public allResults: Observable<any>
    public noIG: Observable<any>
    public noAccessIG: Observable<any>

    // Set up subject observable for clearing select mode
    public clearSelectMode: Subject<boolean> = new Subject();

    // Set up subject observable for skipping the unauthorized asset on asset page, while browsing though assets
    public unAuthorizedAsset: Subject<boolean> = new Subject();
    public pagination: Observable<any>
    public selection: Observable<any>
    public selectModeToggle: EventEmitter<any> = new EventEmitter()


    // Keep track of which params the current results are related to
    public currentLoadedParams: any = {};

    public filterFields: { name: string, value: string }[] = [
        {name: 'Creator', value: '100' },
        {name: 'Title', value: '101' },
        {name: 'Location', value: '102' },
        {name: 'Repository', value: '103' },
        {name: 'Subject', value: '104' },
        {name: 'Material', value: '105' },
        {name: 'Style or Period', value: '106' },
        {name: 'Work Type', value: '107' },
        {name: 'Culture', value: '108' },
        {name: 'Description', value: '109' },
        {name: 'Technique', value: '110' },
        {name: 'Number', value: '111' }
    ];

    // Pagination flag for preserving the select mode while paging through the results
    public paginated: boolean = false;

    // set up thumbnail observables
    private allResultsValue: any[] = [];
    // BehaviorSubjects push last value on subscribe
    private allResultsSource: BehaviorSubject<any> = new BehaviorSubject(this.allResultsValue);

    // set up noIG observables
    private noIGValue: boolean = false;
    private noIGSource: BehaviorSubject<boolean> = new BehaviorSubject(this.noIGValue);

    // set up noIG observables
    private noAccessIGValue: boolean = false;
    private noAccessIGSource: BehaviorSubject<boolean> = new BehaviorSubject(this.noAccessIGValue);

    // Pagination value observable
    private paginationValue: {
        totalPages: number,
        size: number,
        page: number
    } = {
        totalPages: 1,
        size: 24,
        page: 1
    };
    private paginationSource = new BehaviorSubject<any>(this.paginationValue);

    /**
     * Asset Selection Observable
     * - Allow other components to access selected assets via subscription
     */
    private selectedAssets: any[] = [];
    private selectedAssetsSource = new BehaviorSubject<any[]>(this.selectedAssets);

    private subscriptions: Subscription[] = [];

    private searchSubscription: Subscription;

    /**
     * urlParams is used as an enum for special parameters
     */
    private urlParams: any;
    private defaultUrlParams: any = {
            term: '',
            size: 24,
            page: 1,
            startDate: 0,
            endDate: 0,
            igId: '',
            objectId: '',
            colId: '',
            catId: '',
            collTypes: '',
            sort: '0',
            coll: ''
        };
    private activeSort: any = {
        index: 0
     };

    /** Default Headers for this service */
    // ... Set content type to JSON
    private header = new HttpHeaders().set('Content-Type', 'application/json');
    private defaultOptions = { headers: this.header, withCredentials: true };

    // // bandaid for the re-search functionality
    // private searchErrorCount: number = 0

    constructor(
        private _filters: AssetFiltersService,
        private _router: Router,
        private route: ActivatedRoute,
        private http: HttpClient,
        private _storage: ArtstorStorageService,
        private _auth: AuthService,
        private _groups: GroupService,
        private _toolbox: ToolboxService,
        private _assetSearch: AssetSearchService,
        private _app: AppConfig
    ) {
        // initialize observables
        this.allResults = this.allResultsSource.asObservable()
        this.noIG = this.noIGSource.asObservable()
        this.noAccessIG = this.noAccessIGSource.asObservable()
        this.pagination = this.paginationSource.asObservable()
        this.selection = this.selectedAssetsSource.asObservable()
    }

    /**
     * Return most recent results set with at least one asset
     */
    public getRecentResults(): any {
        if (this._storage.getLocal('results')) {
            return this._storage.getLocal('results')
        } else {
            return { thumbnails: [] }
        }
    }

    /**
     * Update Selected Assets observable
     */
    public setSelectedAssets(assets: any[]): void {
        this.selectedAssets = assets;
        this.selectedAssetsSource.next(assets);
    }

    /**
     * Getter for array of selected assets
     */
    public getSelectedAssets(): any[] {
        return this.selectedAssets;
    }

    /**
     * Removes all object ids in allResults which match one of the ids in ids and update total number of results
     * @param ids The array of object ids to remove from allResults
     * @param totalResults Total number of results after removing the selected asset(s)
     */
    public removeFromResults(ids: string[], totalResults: number ): void {
        // Remove deleted thumbnails
        this.allResultsValue['thumbnails'] = this.allResultsValue['thumbnails'].filter((thumbnail: Thumbnail) => {
            return ids.indexOf(thumbnail.objectId) < 0
        })
        // Remove deleted ids
        this.allResultsValue['items'] = this.allResultsValue['items'].filter((item: string) => {
            return ids.indexOf(item) < 0
        })
        this.allResultsValue['total'] = totalResults
        this.allResultsSource.next(this.allResultsValue)
    }

    public setSortOpt(sortIndex: string): void{
        this.activeSort.index = sortIndex;
        this.setUrlParam('sort', this.activeSort.index);
    }

    public goToPage(page: number, quiet?: boolean) {
        this.setUrlParam('page', page, quiet);
    }

    public setPageSize(size: number) {
        this.setUrlParam('size', size);
    }

    /**
     * ! Use with Caution !
     * This is a workaround function when we receive the asset count from a separate service
     * Should eventually be deprecated through improving services
     */
    public setAssetCount(count: number) {
        this.paginationValue.totalPages = Math.ceil(count / this.paginationValue.size)
        this.paginationSource.next(this.paginationValue)
    }

    public loadPrevAssetPage(): void{
        let currentParamsObj: Params = Object.assign({}, this.currentLoadedParams);

        if (this.currentLoadedParams.page){
            currentParamsObj['page']--;
        }

        this.queryAll(currentParamsObj);
    }

    public loadNextAssetPage(): void{
        let currentParamsObj: Params = Object.assign({}, this.currentLoadedParams);

        if (this.currentLoadedParams.page){
            currentParamsObj['page']++;
        }
        else{
            currentParamsObj['page'] = 2;
        }
        this.queryAll(currentParamsObj);
    }

    public loadAssetPage(page: number): void{
      let currentParamsObj: Params = Object.assign({}, this.currentLoadedParams);

      if (this.currentLoadedParams.page){
          currentParamsObj['page'] = page;
      }
      else{
          currentParamsObj['page'] = page;
      }
      this.queryAll(currentParamsObj);
    }

    /**
     * Clear Assets for asset grid
     */
    public clearAssets(): void{
        this.allResultsSource.next([]);
    }

    /**
     * Determines which service to call based on which route parameters exist
     * @param params Object conaining all route params
     * @param refresh boolean value specifing if the results need to be refreshed
     */
    public queryAll(params: any, refresh?: boolean): void {
        // Make sure number params are parsed
        params =  Object.assign( Object.assign({}, this.defaultUrlParams), params);
        params.size = parseInt(params.size);
        params.page =  parseInt(params.page);

        // Reset allResults
        if ((this._toolbox.compareObjects(this.currentLoadedParams, params) === true) && !refresh) {
            // Don't query again if the params are identical
            return;
        }

        // Params are different, clear the assets!
        this.allResultsSource.next([]);

        // Set asterisk search to blank string (expected by service)
        if (params['term'] === '*') {
            params['term'] = '';
        }

        // urlParams is used by the below load functions
        this.urlParams = params;

        // Set sort param
        if (params['sort']){
            this.activeSort.index = params['sort'];
        }

        // Read Pagination values
        this.paginationValue.size = parseInt(this.urlParams.size);
        this.paginationValue.page =  parseInt(this.urlParams.page);
        this.paginationSource.next(this.paginationValue);


        // Tell the filters service we have some updates
        this.setFiltersFromURLParams(params)
            .then(() => {
                let searchTerm = params.term ? params.term : ''
                // Pick function to load this query!
                if (params.hasOwnProperty('igId') && params['igId'] !== '') {
                    // Load IG via Groups service
                    this.loadIgAssets(params.igId);
                } else if (
                    (params.hasOwnProperty('clusterId') && params['clusterId'] !== '') ||
                    (params.hasOwnProperty('objectId') && params['objectId'] !== '') ||
                    (params.hasOwnProperty('pcolId') && params['pcolId'] !== '') ||
                    (params.hasOwnProperty('colId') && params['colId'] !== '') ||
                    (params.hasOwnProperty('term'))
                ) {
                    this.loadSearch(searchTerm)
                } else {
                    console.error("Don't know what to query!");
                }
            });
    }

    /**
     * Generate asset share link
     */
    public getShareLink(assetId: string, externalAsset?: boolean) {
        //   Links in the clipboard need a protocol defined
        return  `https://${this._app.clientHostname}/#/asset/${ ( externalAsset ? 'external/' : '' ) + assetId }`
    }

    /**
     * When given an image group, updates the allResultsSource with the ids from that image group
     * @param ig Image group for which you want the results
     */
    public setResultsFromIg(ig: ImageGroup): void {
        // Reset No IG observable
        this.noIGSource.next(false)
        this.noAccessIGSource.next(false);

        if (ig.items.length) {

          // set up the string for calling search
          ig.count = ig.items.length
          let pageStart = (this.urlParams.page - 1) * this.urlParams.size
          let pageEnd = this.urlParams.page * this.urlParams.size
          let idsAsTerm: string =  ig.items.slice(pageStart, pageEnd).join('&object_id=')

          let options = { withCredentials: true }

          this.http.get(this._auth.getHostname() + '/api/v1/items?object_id=' + idsAsTerm, options).pipe(
            map(res => {
                let results = res
                ig.thumbnails = results['items']
                // Set the allResults object
                this.updateLocalResults(ig)
            }, (error) => {
                // Pass portion of the data we have
                this.updateLocalResults(ig)
                // Pass error down to allResults listeners
                this.allResultsSource.next({'error': error}) // .throw(error)
            })).subscribe()
          }
    }

    /**
     * Gets all of the thumbnails requested, assuming the user has access, and returns them in a promise resolved with an array
     * @param assetIds the ids for which you need the thumbnails
     * @param igId passed if you are viewing an image group, which may contain pc assets and therefore access is checked against user's access to group
     */
    public getAllThumbnails(groupItems: any[], igId?: string): Promise<Thumbnail[]> {
        let assetIds: string [] = []
        /**
         * 2019/3/14
         * Check for new item format (object), and convert to strings for items service
         */
        if (groupItems[0] && groupItems[0].id) {
            for (let i = 0; i < groupItems.length; i++) {
            if (groupItems[i] && groupItems[i].id) {
                assetIds.push(groupItems[i].id)
            }
            }
        } else {
            assetIds = groupItems
        }
        // return new Promise
        let maxCount = 100
        return new Promise( (resolve, reject) => {
            let allThumbnails = [];
            let options = { withCredentials: true };

            let loadBatch = (i) => {
                let countEnd = i + maxCount
                let objectIdTerm: string = igId ? '&object_ids=' : '&object_id=' // the group version of the call takes object_ids instead of object_id

                let idsAsTerm: string = objectIdTerm + assetIds.slice(i, countEnd).join(objectIdTerm) // concat the query params
                let url: string = this._auth.getHostname() + '/api/'
                if (igId) {
                  url += 'v1/group/' + igId + '/items?' + idsAsTerm
                } else {
                    url += 'v2/items?' + idsAsTerm
                }

                this.http.get(url, options)
                    .toPromise()
                    .then((res) => {
                        let results = res;
                        allThumbnails = allThumbnails.concat(results['items']);
                        if (countEnd >= assetIds.length) {
                            resolve(allThumbnails);
                        } else {
                            loadBatch(countEnd)
                        }
                    }, (error) => {
                        reject('Failure');
                    });
            }
            loadBatch(0);
        });

    } // end setResults

    // NOTE: Deprecated /pccollection endpoint no longer available
    // TODO: REMOVE
    // // Used by Browse page
    // public pccollection(){
    //     let options = { withCredentials: true };

    //     return this.http
    //         .get(this._auth.getHostname() + '/api/pccollection', options)
    //         .toPromise()
    // }

    public categoryNames(): Promise<categoryName[]> {
        let options = { withCredentials: true }

        return this.http
            .get(this._auth.getHostname() + '/api/v1/collections/103/categorynames', options)
            .toPromise()
            .then(res => {
                if (res && res[0]) {
                    return <categoryName[]>res
                } else {
                    return <categoryName[]>[]
                }
            })
    }

    public categoryByFacet(facetName: string, collectionType ?: number): Promise<SolrFacet[]> {
      let options = { withCredentials: true };

      let query = {
            // Base solr query
            'limit': 0,
            'start': 1,
            'content_types': [
                'art'
            ],
            'hier_facet_fields2': [],
            'facet_fields' : [],
            'filter_query' : []
        };
      let isHierarchy = facetName === 'artstor-geography'
      if (isHierarchy) {
        let hierarchy = {
            // Base hierarchy query
            'field': 'hierarchies',
            'hierarchy': '', // ex: artstor-geography
            'look_ahead': 2,
            'look_behind': -10,
            'd_look_ahead': 1
        }
        hierarchy.hierarchy = facetName
        query.hier_facet_fields2 = [hierarchy]
      } else {
        let facetField = {
            // base facet field
            'name' : '', // ex: collectiontypes
            'mincount' : 1,
            'limit' : 1000 // Prod limit of Public Collections
        }
        facetField.name = facetName
        query.facet_fields = [facetField]
      }

      let filterArray = []

      if (collectionType) {
          if (collectionType === 2){
            /**
             * Institutional Collection filter needs to cover:
             * - Collections which an institution has created but has also made public
             * - Collections which have been shared specifically with an institution, and do not have the "contributinginstitutionid" of the current user
             * FYI Static and Shared Collections
             * - CUNY and UC schools have shared collections that are managed by Artstor (known as static collections)
             * - Some schools have shared collections which have a contributinginsitutionid which differs from their own
             */
            filterArray.push('(collectiontypes:2 AND contributinginstitutionid:(' + this._auth.getUser().institutionId.toString() + ')) OR (collectiontypes:(2) AND -(collectiontypes:(5)))')

          }
          // Collction Type 6 Private Collections
          else if (collectionType === 6) {
            filterArray.push('(collectiontypes:6 AND contributinginstitutionid:(' + this._auth.getUser().institutionId.toString() + '))')
          }
          else {
            filterArray.push('collectiontypes:' + collectionType)
          }
      }

      /**
       * Check for WLVs Institution filter
       * - WLVs filter by contributing institution id
       */
      let institutionFilters: number[] = this._app.config.contributingInstFilters
      for (let i = 0; i < institutionFilters.length; i++) {
        filterArray.push('contributinginstitutionid:' + institutionFilters[i])
      }

      query['filter_query'] = filterArray

      return this.http.post(this._auth.getSearchUrl(), query, options)
        .toPromise()
        .then(res => {
          // Object.values is not supported by IE 11
          let hierData = Object.keys(res['hierarchies2']).map(function(e) {
            return res['hierarchies2'][e]
          })
          if (hierData.length) { // if we have hierarchical data
            res = hierData
          } else { // must be a facet
            res = res['facets'][0].values
          }
          return <SolrFacet[]>res
        })
    }

    /**
     * Get metadata about a Category
     * @param catId The Category ID
     */
    public getCategoryInfo(catId: string) {
        let options = { withCredentials: true };

        return this.http
            .get(this._auth.getUrl() + '/v1/categorydesc/' + catId, options)
            .toPromise();
    }

    /**
     * Wrapper function for HTTP call to get collections. Used by home component
     * @param type Can either be 'ssc' or 'institution'
     * @returns Chainable promise containing collection data
     */
    public getCollectionsList(type?: string) {
        let options = { withCredentials: true };
        // Returns all of the collections names
        return this.http
            .get(this._auth.getUrl() + '/v1/collections/', options).pipe(
              map(res => {
                if (type) {
                    let data = res

                    if (type == 'institution') {
                        data['Collections'] = data['Collections'].filter((collection) => {
                            return collection.collectionType == 2 || collection.collectionType == 4
                        })
                    }
                    if (type == 'ssc') {
                        data['Collections'] = data['Collections'].filter((collection) => {
                            return collection.collectionType == 5
                        })
                    }

                    return data
                } else {
                    return res
                }
              }
            ))
    }

    public getBlogEntries(query ?: string) {
        if (!query || query == '*') {
            // An asterisk query on the Wordpress API *LIMITS* results to those with an asterisk!
            query = '';
        } else {
            // Force exact phrase match
            query = '"' + query + '"';
        }
        return this.http
            .get('https://public-api.wordpress.com/rest/v1.1/sites/artstor.wordpress.com/posts/?number=24&search=' + query)
            .toPromise()
    }

    /**
     * Get metadata about a collection
     * @param colId The collection ID
     */
    public getPCImageStatus(ssid: string): Observable<any> {
        let options = { withCredentials: true };
        return this.http
            .get(this._auth.getUrl() + '/v1/pcollection/image-status/' + ssid, options)
    }

    private updateLocalResults(resultObj: any) {
        // These Params have been loaded now
        this.currentLoadedParams = Object.assign(Object.assign({}, this.defaultUrlParams), this.urlParams);

        let totalPages = 1;

        if (resultObj.count) {
          const COUNT = Math.min(resultObj.count, APP_CONST.MAX_RESULTS)

          totalPages = Math.ceil( COUNT / this.urlParams.size );
        }

        // Retain total pages if results limit exceeds
        if (resultObj.errors && resultObj.errors[0] && (resultObj.errors[0] === 'Too many rows requested')){
            totalPages = this.paginationValue.totalPages;
        }

        // Update pagination object
        let paginationValue = {
            totalPages: totalPages,
            size: this.urlParams.size,
            page: this.urlParams.page
        };
        this.paginationValue = paginationValue;
        this.paginationSource.next(paginationValue);

        /**
         * Include only availble assets to the resultsObj thumbnails array, set aside restricted assets
         */
        if (resultObj.thumbnails){
            // let thumbnailsOrignalLength: number = resultObj.thumbnails.length
            resultObj['restricted_thumbnails'] = []
            resultObj.thumbnails = resultObj.thumbnails.filter( thumbnail => {
                if (thumbnail.status === 'not-available') {
                    resultObj['restricted_thumbnails'].push(thumbnail)
                    return false
                } else {
                    return true
                }
            })
        }
        // Update results thumbnail array
        this.allResultsValue = resultObj;
        this.allResultsSource.next(resultObj);

        // Set Recent Results (used by Compare Mode)
        if (resultObj.thumbnails && resultObj.thumbnails.length > 0) {
            this._storage.setLocal('results', resultObj)
        }

        if (this.paginated){
            this.paginated = false;
        }
        else{
            this.clearSelectMode.next(true);
        }
    }

    private setUrlParam(key: string, value: any, quiet?: boolean) {
        this.urlParams[key] = value;
        let currentParamsObj: Params = {};

        let term: string = '';
        for (let paramKey in this.urlParams){
            if (paramKey == 'term'){
                term = this.urlParams[paramKey];
                continue;
            }
            if ((this.urlParams[paramKey] !== '') && (this.urlParams[paramKey] !== 0)){
                currentParamsObj[paramKey] = this.urlParams[paramKey];
            }
        }

        if (currentParamsObj['size']){
            currentParamsObj['size'] = currentParamsObj['size'].toString();
        }
        if (currentParamsObj['page']){
            currentParamsObj['page'] = currentParamsObj['page'].toString();
        }

        if (!quiet){
            if (term.length > 0){
                this._router.navigate(['/search', term, currentParamsObj]);
            }
            else if (currentParamsObj['catId']){
                let cat_id = currentParamsObj['catId'];
                delete currentParamsObj['catId'];
                this._router.navigate(['/category', cat_id, currentParamsObj]);
            }
            else if (currentParamsObj['colId']){
                let col_id = currentParamsObj['colId'];
                delete currentParamsObj['colId'];
                this._router.navigate(['/collection', col_id, currentParamsObj]);
            }
            else if (currentParamsObj['igId']){
                let ig_id = currentParamsObj['igId'];
                delete currentParamsObj['igId'];
                this._router.navigate(['/group', ig_id, currentParamsObj]);
            }
            else{
                let newUrl = this._router.createUrlTree([
                    currentParamsObj
                ], {relativeTo: this.route });
                this._router.navigateByUrl(newUrl);
            }
        }
    }

    private formEncode = function (obj) {
        let encodedString = '';
        for (let key in obj) {
            if (encodedString.length !== 0) {
                encodedString += '&';
            }

            encodedString += key + '=' + encodeURIComponent(obj[key]);
        }
        return encodedString.replace(/%20/g, '+');
    };

    /**
     * Set the filters using filter service from URL params
     * @param params Object conaining all route params
     */
    private setFiltersFromURLParams(params: any): Promise<any>{
        return new Promise((resolve, reject) => {
            let dateObj;

            Object.keys(params).forEach((key) => {
                let filter = {};
                if (key.indexOf('str') > -1){
                    if (!this._filters.isApplied(key, params[key])){ // Add Filter
                        this._filters.apply(key, params[key]);
                    }
                }
            });

            if (params['startDate'] && params['endDate']){
                dateObj = {
                    modified : true,
                    earliest : {
                        date : Math.abs(params['startDate']),
                        era : params['startDate'] < 0 ? 'BCE' : 'CE'
                    },
                    latest : {
                        date : Math.abs(params['endDate']),
                        era : params['endDate'] < 0 ? 'BCE' : 'CE'
                    }
                }
                this._filters.setAvailable('dateObj', dateObj);
                resolve(this._filters.getAvailable())
            } else {
                dateObj = {
                    modified : false,
                    earliest : {
                        date : 1000,
                        era : 'BCE'
                    },
                    latest : {
                        date : 2017,
                        era : 'CE'
                    }
                }
                this._filters.setAvailable('dateObj', dateObj);
                resolve(this._filters.getAvailable())
            }
        })
    }

    /**
     * Gets array of thumbnails and sets equal to results
     * @param igId Image group id for which to retrieve thumbnails
     */
    private loadIgAssets(igId: string) {

        // Reset No IG observable
        this.noIGSource.next(false)
        this.noAccessIGSource.next(false)

        // Create a request option
        let startIndex = ((this.urlParams.page - 1) * this.urlParams.size) + 1

        let requestString: string = [this._auth.getUrl(), 'imagegroup', igId, 'thumbnails', startIndex, this.urlParams.size, this.activeSort.index].join('/')
        this._groups.get(igId)
            .toPromise()
            .then((data) => {

                if (!Object.keys(data).length) {
                    throw new Error('No data in image group thumbnails response')
                }

                data.total = data.items.length

                // Fetch the asset(s) via items call only if the IG has atleast one asset
                if (data.total > 0) {
                    let pageStart = (this.urlParams.page - 1) * this.urlParams.size
                    let pageEnd = this.urlParams.page * this.urlParams.size

                    let itemIdsArray: any[]
                    itemIdsArray = data.items

                    // itemsIdsArray needs to be an array strings for search call
                    itemIdsArray = itemIdsArray.map(item => {
                      return (typeof(item) === 'string') ? item : item.id
                    })

                    // Maintain param string in a single place to avoid debugging thumbnails lost to a bad param
                    const ID_PARAM = 'object_ids='
                    let idsAsTerm: string =  itemIdsArray.slice(pageStart, pageEnd).join('&' + ID_PARAM)

                    let options = { withCredentials: true }

                    this.http.get(this._auth.getHostname() + '/api/v1/group/' + igId + '/items?' + ID_PARAM + idsAsTerm, options).pipe(
                      map((res) => {
                        let results = res
                        data.thumbnails = results['items'] // V1 ?items from search
                        // For multi-view items, make the thumbnail urls and update the array
                        data.thumbnails = data.items.map((item) => {

                          // Attach zoom object from items to the relevant thumbnail, to be used in asset grid
                          for(let thumbnail of data.thumbnails) {

                            thumbnail = Object.assign({}, thumbnail)  // Make copy to avoid modifying subsequent items

                            if (item['id'] === thumbnail['objectId']) {
                              if(item['zoom']){
                                  thumbnail['zoom'] = item['zoom']
                              }
                              if (thumbnail['thumbnailImgUrl'] && thumbnail['compoundmediaCount'] > 0) {
                                thumbnail.thumbnailImgUrl = this._auth.getThumbHostname(true) + thumbnail.thumbnailImgUrl
                              }

                              return thumbnail
                            }
                          }
                        })

                        // Set the allResults object
                        this.updateLocalResults(data)
                      }, (error) => {
                        // Pass portion of the data we have
                        this.updateLocalResults(data)
                        // Pass error down to allResults listeners
                        this.allResultsSource.next({'error': error}) // .throw(error);
                    })).subscribe()
                } else {
                    data.thumbnails = []
                    this.updateLocalResults(data)
                }

            })
            .catch((error) => {
                if (error.status === 404){
                    this.noIGSource.next(true)
                }
                else if (error.status === 403){
                    this.noAccessIGSource.next(true)
                }
            });
    }

    /**
     * Executes search and sets relevant asset-grid parameters
     * @param term Search term for which a search should be executed
     */
    private loadSearch(term: string): void {
        // Don't wait for previous subscription anymore
        if (this.searchSubscription && this.searchSubscription.unsubscribe) {
            this.searchSubscription.unsubscribe()
        }

         // Solr Search
        this.searchSubscription = this._assetSearch.search(this.urlParams, term, this.activeSort.index)
            .subscribe(
                (res) => {
                    let data = res
                    let facets = data.facets
                    let len = facets.length

                    data.facets.forEach((facet, index) => {
                        this._filters.setAvailable(facet.name, facet.values)
                    })

                    if (data.hierarchies2 && data.hierarchies2['artstor-geography']){
                        this._filters.generateHierFacets( data.hierarchies2['artstor-geography'].children, 'geography' )
                    }
                    else{
                        this._filters.generateHierFacets( [], 'geography' )
                    }

                    // count and thumbnails are relics from the previous search logic and should be removed eventaully
                    // Transform data from SOLR queries
                    if (data.results) {
                        data['thumbnails'] = data.results
                    }
                    data['count'] = data.total
                    // Set the allResults object
                    this.updateLocalResults(data)
            }, (error) => {
                    console.error(error)
                    this.allResultsSource.next({'error': error})
            });

    }

}

export interface categoryName {
    categoryid: string,
    categoryname: string
}
export interface SolrFacet {
    name: string,
    count: number,
    efq: string,
    fq: string,
    // Additional property for Hierarchical facets
    children?: SolrFacet[]
    // Value added by the UI
    title?: string
}
