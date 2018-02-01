/**
 * Assets service
 */
import { Injectable, OnDestroy, OnInit, EventEmitter } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, Subject } from 'rxjs/Rx';
import { Locker } from 'angular2-locker';
import 'rxjs/add/operator/toPromise';
import { Subscription }   from 'rxjs/Subscription';

// Project Dependencies
import { AuthService } from './auth.service';
import { GroupService } from './group.service';
import { AssetFiltersService } from './../asset-filters/asset-filters.service';
import { ToolboxService } from './toolbox.service';
import { AssetSearchService, SearchResponse } from './asset-search.service';
import { ImageGroup, Thumbnail } from '.';
import { AppConfig } from "app/app.service";

@Injectable()
export class AssetService {

    /** Constant that defines which collectionType belongs to institutions */
    static readonly institutionCollectionType: number = 2;

    //set up thumbnail observables
    private allResultsValue: any[] = [];
    // BehaviorSubjects push last value on subscribe
    private allResultsSource: BehaviorSubject<any[]> = new BehaviorSubject(this.allResultsValue);
    public allResults: Observable<any> = this.allResultsSource.asObservable();

    //set up noIG observables
    private noIGValue: boolean = false;
    private noIGSource: BehaviorSubject<boolean> = new BehaviorSubject(this.noIGValue);
    public noIG: Observable<any> = this.noIGSource.asObservable();

    //set up noIG observables
    private noAccessIGValue: boolean = false;
    private noAccessIGSource: BehaviorSubject<boolean> = new BehaviorSubject(this.noAccessIGValue);
    public noAccessIG: Observable<any> = this.noAccessIGSource.asObservable();

    //Set up subject observable for clearing select mode
    public clearSelectMode: Subject<boolean> = new Subject();

    //Set up subject observable for skipping the unauthorized asset on asset page, while browsing though assets
    public unAuthorizedAsset: Subject<boolean> = new Subject();

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
    public pagination = this.paginationSource.asObservable();

    /**
     * Asset Selection Observable
     * - Allow other components to access selected assets via subscription
     */
    private selectedAssets: any[] = [];
    private selectedAssetsSource = new BehaviorSubject<any[]>(this.selectedAssets);
    public selection = this.selectedAssetsSource.asObservable();
    public selectModeToggle: EventEmitter<any> = new EventEmitter()


    // Keep track of which params the current results are related to
    public currentLoadedParams: any = {};

    private subscriptions: Subscription[] = [];

    private searchSubscription: Subscription;

     public filterFields: { name: string, value: string }[] = [
        {name: "Creator", value: "100" },
        {name: "Title", value: "101" },
        {name: "Location", value: "102" },
        {name: "Repository", value: "103" },
        {name: "Subject", value: "104" },
        {name: "Material", value: "105" },
        {name: "Style or Period", value: "106" },
        {name: "Work Type", value: "107" },
        {name: "Culture", value: "108" },
        {name: "Description", value: "109" },
        {name: "Technique", value: "110" },
        {name: "Number", value: "111" }
    ];

    /**
     * urlParams is used as an enum for special parameters
     */
    private urlParams: any;
    private defaultUrlParams: any = {
            term: "",
            size: 24,
            page: 1,
            startDate: 0,
            endDate: 0,
            igId: "",
            objectId: "",
            colId: "",
            catId: "",
            collTypes: "",
            sort: "0",
            coll: ""
        };
    private activeSort: any = {
        index: 0
     };

    private baseSolrQuery = {
      "limit": 0,
      "start": 1,
      "content_types": [
        "art"
      ],
      "hier_facet_fields2": [],
      "facet_fields" : [],
      "filter_query" : []
    };
    private baseFacetField = {
      "name" : "", // ex: collectiontypes
      "mincount" : 1,
      "limit" : 100
    }
    private baseHierarchy = {
      "field": "hierarchies",
      "hierarchy": "", // ex: artstor-geography
      "look_ahead": 2,
      "look_behind": -10,
      "d_look_ahead": 1
    }

    /** Keeps track of all filters available in url */
    // private knownFilters: any = {};
    public _storage;

    /** Default Headers for this service */
    // ... Set content type to JSON
    private header = new HttpHeaders().set('Content-Type', 'application/json');
    private defaultOptions = { headers: this.header, withCredentials: true };

    // Pagination flag for preserving the select mode while paging through the results
    public paginated: boolean = false;

    private MAX_RESULTS_COUNT: number = 1500

    // // bandaid for the re-search functionality
    // private searchErrorCount: number = 0

    constructor(
        private _filters: AssetFiltersService,
        private _router: Router,
        private route: ActivatedRoute,
        private http: HttpClient,
        locker: Locker,
        private _auth: AuthService,
        private _groups: GroupService,
        private _toolbox: ToolboxService,
        private _assetSearch: AssetSearchService,
        private _app: AppConfig
    ) {
        this._storage = locker.useDriver(Locker.DRIVERS.LOCAL);
    }

    private updateLocalResults(resultObj: any) {
        // These Params have been loaded now
        this.currentLoadedParams = Object.assign(Object.assign({}, this.defaultUrlParams), this.urlParams);

        let totalPages = 1;

        if (resultObj.count) {
          const COUNT = Math.min(resultObj.count, this.MAX_RESULTS_COUNT)

          totalPages = Math.ceil( COUNT / this.urlParams.size );
        }

        // Retain total pages if results limit exceeds
        if(resultObj.errors && resultObj.errors[0] && (resultObj.errors[0] === 'Too many rows requested')){
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

        // Update results thumbnail array
        this.allResultsValue = resultObj;
        this.allResultsSource.next(resultObj);

        // Set Recent Results (used by Compare Mode)
        if (resultObj.thumbnails && resultObj.thumbnails.length > 0) {
            this._storage.set('results', resultObj);
        }

        if(this.paginated){
            this.paginated = false;
        }
        else{
            this.clearSelectMode.next(true);
        }
    }

    /**
     * Return most recent results set with at least one asset
     */
    public getRecentResults(): any {
        if (this._storage.get('results')) {
            return this._storage.get('results');
        } else {
            return { thumbnails: [] };
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
        this.allResultsValue['thumbnails'] = this.allResultsValue['thumbnails'].filter((thumbnail: Thumbnail) => {
            return ids.indexOf(thumbnail.objectId) < 0
        });
        this.allResultsValue['total'] = totalResults;
        this.allResultsSource.next(this.allResultsValue);
    }

    public getCurrentInstitution(): any {
        return this._storage.get('institution');
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
        this.paginationValue.totalPages = Math.ceil(count/this.paginationValue.size)
        this.paginationSource.next(this.paginationValue)
    }

    private setUrlParam(key: string, value: any, quiet?: boolean) {
        this.urlParams[key] = value;
        let currentParamsObj: Params = {};

        let term: string = '';
        for(let paramKey in this.urlParams){
            if(paramKey == 'term'){
                term = this.urlParams[paramKey];
                continue;
            }
            if((this.urlParams[paramKey] !== '') && (this.urlParams[paramKey] !== 0)){
                currentParamsObj[paramKey] = this.urlParams[paramKey];
            }
        }

        if(currentParamsObj['size']){
            currentParamsObj['size'] = currentParamsObj['size'].toString();
        }
        if(currentParamsObj['page']){
            currentParamsObj['page'] = currentParamsObj['page'].toString();
        }

        if(!quiet){
            if(term.length > 0){
                this._router.navigate(['/search', term, currentParamsObj]);
            }
            else if(currentParamsObj['catId']){
                let cat_id = currentParamsObj['catId'];
                delete currentParamsObj['catId'];
                this._router.navigate(['/category', cat_id, currentParamsObj]);
            }
            else if(currentParamsObj['colId']){
                let col_id = currentParamsObj['colId'];
                delete currentParamsObj['colId'];
                this._router.navigate(['/collection', col_id, currentParamsObj]);
            }
            else if(currentParamsObj['igId']){
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
        var encodedString = '';
        for (var key in obj) {
            if (encodedString.length !== 0) {
                encodedString += '&';
            }

            encodedString += key + '=' + encodeURIComponent(obj[key]);
        }
        return encodedString.replace(/%20/g, '+');
    };

    public loadPrevAssetPage(): void{
        let currentParamsObj: Params = Object.assign({}, this.currentLoadedParams);

        if(this.currentLoadedParams.page){
            currentParamsObj['page']--;
        }

        this.queryAll(currentParamsObj);
    }

    public loadNextAssetPage(): void{
        let currentParamsObj: Params = Object.assign({}, this.currentLoadedParams);

        if(this.currentLoadedParams.page){
            currentParamsObj['page']++;
        }
        else{
            currentParamsObj['page'] = 2;
        }
        this.queryAll(currentParamsObj);
    }

    public loadAssetPage(page: number): void{
      let currentParamsObj: Params = Object.assign({}, this.currentLoadedParams);

      if(this.currentLoadedParams.page){
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
        if (params["term"] === "*") {
            params["term"] = "";
        }

        // urlParams is used by the below load functions
        this.urlParams = params;

        //Set sort param
        if(params['sort']){
            this.activeSort.index = params['sort'];
        }

        // Read Pagination values
        this.paginationValue.size = parseInt(this.urlParams.size);
        this.paginationValue.page =  parseInt(this.urlParams.page);
        this.paginationSource.next(this.paginationValue);


        // Tell the filters service we have some updates
        this.setFiltersFromURLParams(params)
            .then(() => {
                // Pick function to load this query!
                if (params.hasOwnProperty("objectId") && params["objectId"] !== "" && params.hasOwnProperty("colId") && params["colId"] !== "") {
                    //gets associated images thumbnails
                    this.loadAssociatedAssets(params.objectId, params.colId);
                } else if (params.hasOwnProperty("igId") && params["igId"] !== "") {
                    //get image group thumbnails
                    this.loadIgAssets(params.igId);
                } else if (params.hasOwnProperty("objectId") && params["objectId"] !== "") {
                    //get clustered images thumbnails
                    this.loadCluster(params.objectId);
                } else if (params.hasOwnProperty("catId")  && params["catId"] !== "") {
                    // To load category assets pass the 'catId' as 'query/searchTerm' parameter
                    let searchTerm = 'categoryid:' + params["catId"];
                    this.loadSearch(searchTerm);
                }  else if (params.hasOwnProperty("pcolId") && params["pcolId"] !== "") {
                    //get personal collection thumbnails
                    this.loadCollection(params.pcolId);
                }  else if (params.hasOwnProperty("colId") && params["colId"] !== "") {
                    // get collection thumbnails
                    let searchTerm = params.term ? params.term : '';
                    this.loadSearch(searchTerm);
                } else if (params.hasOwnProperty("term")) {
                    this.loadSearch(params.term);
                } else {
                    console.error("Don't know what to query!");
                }
            });
    }

    /**
     * Set the filters using filter service from URL params
     * @param params Object conaining all route params
     */
    private setFiltersFromURLParams(params: any): Promise<any>{
        return new Promise((resolve, reject) => {
            let dateObj;

            Object.keys(params).forEach((key) => {
                var filter = {};
                if(key.indexOf('str') > -1){
                    if(!this._filters.isApplied(key, params[key])){ // Add Filter
                        this._filters.apply(key, params[key]);
                    }
                }
            });

            if(params['startDate'] && params['endDate']){
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
     * DEPRECATED
     * Generates Image URL
     * @param assetId: string Asset or object ID
     */
    public generateImageURL(assetId: string) {

        return this.http
            .get(this._auth.getUrl() + '/encrypt/'+ assetId + '?_method=encrypt', this.defaultOptions)
            .toPromise()
    }

    /**
     * Generate asset share link
     */
    public getShareLink(assetId: string) {
        //   Links in the clipboard need a protocol defined
        return  `${window.location.protocol}//${window.location.host}/asset/${assetId}`

        // For Reference: Old service for generating share url:
        // this._assets.genrateImageURL( this.assets[0].id )
        //   .then((imgURLData) => {
        //       this._assets.encryptuserId()
        //         .then((userEncryptData) => {
        //           var imgEncryptId = imgURLData.encryptId;
        //           var usrEncryptId = userEncryptData.encryptId;
        //         //   Links in the clipboard need a protocol defined
        //             this.generatedImgURL =  'http:' + this._auth.getUrl() + '/ViewImages?id=' + imgEncryptId + '&userId=' + usrEncryptId + '&zoomparams=&fs=true';
        //         })
        //         .catch(function(err){
        //           console.log('Unable to Encrypt userid');
        //           console.error(err);
        //         });
        //   })
        //   .catch(function(err) {
        //       console.log('Unable to generate image URL');
        //       console.error(err);
        //   });
    }

    /**
     * Encrypt User Id
     */
    public encryptuserId() {

        return this.http
            .get(this._auth.getUrl() + '/encrypt/?_method=encryptuserId', this.defaultOptions)
            .toPromise()
    }

    /**
     * Gets File Properties table for an asset
     * @param assetId Id for an asset/object
     */
    public getFileProperties(assetId: string): Promise<any> {
        return this.http
            .get(this._auth.getUrl(true) + '/metadata/' + assetId + '?_method=FpHtml', this.defaultOptions)
            .toPromise()
            .then(data => {
                // This call only returns Html!
                return data['_body'].toString();
            });
    }

    public getRegionCollection(rootId ?: number): number {
        let collectionId = rootId ? rootId : 103
        let user = this._auth.getUser()

        if (user.regionId !== 1) {
            collectionId = parseInt( (3+user.regionId) + collectionId.toString() )
        }
        return collectionId
    }

    /**
     * Get metadata for an Asset
     * @param assetId string Asset or object ID
     */
    public getMetadata(assetId: string, groupId?: string): Observable<MetadataRes> {
        let url = this._auth.getUrl() + '/v1/metadata?object_ids=' + assetId
        if (groupId){
            // Groups service modifies certain access rights for shared assets
            url = this._auth.getUrl() + '/v1/group/'+ groupId +'/metadata?object_ids=' + assetId
        }
        return this.http
            .get<MetadataRes>( url, this.defaultOptions)
    }

    /**
     * Gets array of thumbnails associated to objectId
     * @param objectId Object Id for which to retrieve image results
     * @param colId Collection Id in which the Object resides
     */
    private loadAssociatedAssets(objectId: string, colId: string) {
        let startIndex = ((this.urlParams.page - 1) * this.urlParams.size) + 1
        this.getAssociated(objectId, colId, startIndex, this.urlParams.size)
            .then((data) => {
                if (!Object.keys(data).length) {
                    throw new Error("No data in image group thumbnails response")
                }
                // The thumnail grid expects the total number of results in 'total' property of the response
                data['total'] = data['count']
                this.updateLocalResults(data)
            })
            .catch((error) => {
                console.log(error)
            });
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

        let requestString: string = [this._auth.getUrl(), "imagegroup",igId, "thumbnails", startIndex, this.urlParams.size, this.activeSort.index].join("/")

        this._groups.get(igId)
            .toPromise()
            .then((data) => {
                if (!Object.keys(data).length) {
                    throw new Error("No data in image group thumbnails response")
                }

                data.total = data.items.length

                // Fetch the asset(s) via items call only if the IG has atleast one asset
                if(data.total > 0){
                    let pageStart = (this.urlParams.page - 1)*this.urlParams.size
                    let pageEnd = this.urlParams.page*this.urlParams.size
                    // Maintain param string in a single place to avoid debugging thumbnails lost to a bad param
                    const ID_PARAM = "object_ids="
                    let idsAsTerm: string =  data.items.slice(pageStart,pageEnd).join('&'+ ID_PARAM)

                    let options = { withCredentials: true }

                    this.http.get(this._auth.getHostname() + '/api/v1/group/'+ igId +'/items?'+ ID_PARAM + idsAsTerm, options)
                        .subscribe(
                            (res) => {
                                let results = res
                                data.thumbnails = results['items']
                                // Set the allResults object
                                this.updateLocalResults(data)
                        }, (error) => {
                            // Pass portion of the data we have
                            this.updateLocalResults(data)
                            // Pass error down to allResults listeners
                            this.allResultsSource.error(error) // .throw(error);
                        });
                } else {
                    data.thumbnails = []
                    this.updateLocalResults(data)
                }

            })
            .catch((error) => {
                // console.error(error)
                if(error.status === 404){
                    this.noIGSource.next(true)
                }
                else if(error.status === 403){
                    this.noAccessIGSource.next(true)
                }
            });
    }

    /**
     * When given an image group, updates the allResultsSource with the ids from that image group
     * @param ig Image group for which you want the results
     */
    public setResultsFromIg(ig: ImageGroup): void {
        // Reset No IG observable
        this.noIGSource.next(false)
        this.noAccessIGSource.next(false);

        // set up the string for calling search
        ig.count = ig.items.length
        let pageStart = (this.urlParams.page - 1)*this.urlParams.size
        let pageEnd = this.urlParams.page*this.urlParams.size
        let idsAsTerm: string =  ig.items.slice(pageStart,pageEnd).join('&object_id=')

        let options = { withCredentials: true }

        this.http.get(this._auth.getHostname() + '/api/v1/items?object_id=' + idsAsTerm, options)
            .subscribe(
                (res) => {
                    let results = res
                    ig.thumbnails = results['items']
                    // Set the allResults object
                    this.updateLocalResults(ig)
            }, (error) => {
                // Pass portion of the data we have
                this.updateLocalResults(ig)
                // Pass error down to allResults listeners
                this.allResultsSource.error(error) // .throw(error)
            })
    }

    public getAllThumbnails(igIds: string[]) : Promise<any> {
        // return new Promise
        let maxCount = 100
        return new Promise( (resolve, reject) => {
            let allThumbnails = [];
            let options = { withCredentials: true };

            let loadBatch = (i) => {
                let countEnd = i+maxCount
                let idsAsTerm: string =  igIds.slice(i,countEnd).join('&object_id=');
                this.http.get(this._auth.getHostname() + '/api/v1/items?object_id=' + idsAsTerm, options)
                        .toPromise()
                        .then(
                            (res) => {
                                let results = res;
                                allThumbnails = allThumbnails.concat(results['items']);
                                if (countEnd >= igIds.length) {
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
    }

    /**
     * Loads thumbnails from a collectionType
     * @param colId Collection Id for which to fetch results
     */
    private loadCollection(colId: string) {
        let options = {withCredentials: true};
        let imageSize = 0;
        let startIndex = ((this.urlParams.page - 1) * this.urlParams.size) + 1;

        let requestString = [this._auth.getUrl(), 'collections', colId, 'thumbnails', startIndex, this.urlParams.size, this.activeSort.index].join('/');

        return this.http
            .get(requestString, options)
            .toPromise()
            .then((data) => {
                this.updateLocalResults(data);
            })
            .catch(error => {
                console.log(error);
            });
    }

    /**
     *  Loads thumbnails for a Category to this.AllResults
     *  @param catId Category ID
     */
    private loadCategory(catId: string): Promise<any> {
        let imageSize = 0;
        let startIndex = ((this.urlParams.page - 1) * this.urlParams.size) + 1;
        if (catId.startsWith('103')) {
            catId = this.getRegionCollection(parseInt(catId)).toString()
        }
        let requestString = [this._auth.getUrl(), 'categories', catId, 'thumbnails', startIndex, this.urlParams.size, this.activeSort.index].join('/');

        return this.http
            .get(requestString, this.defaultOptions)
            .toPromise()
            .then((data) => {
                this.updateLocalResults(data);
            })
            .catch(error => {
                console.log(error);
            });
    }

    private loadCluster(objectId: string){

        let options = { withCredentials: true };
        let startIndex = ((this.urlParams.page - 1) * this.urlParams.size) + 1;

        let requestString = [this._auth.getUrl(), "cluster", objectId, "thumbnails", startIndex, this.urlParams.size].join("/");

        this.http
            .get(requestString, options)
            .toPromise()
            .then((res) => {
                if (res['thumbnails']) {
                    // Set the allResults object
                    this.updateLocalResults(res);
                } else {
                    throw new Error("There are no thumbnails. Server responsed with status " + res['status']);
                }
            })
            .catch((err) => {
                console.log(err)
                this.allResultsSource.error(err)
            });
    }

    // Used by Browse page
    public pccollection(){
        let options = { withCredentials: true };

        return this.http
            .get(this._auth.getHostname() + '/api/pccollection', options)
            .toPromise()
    }

    public category(catId: string) {
        let options = { withCredentials: true };

        return this.http
            .get(this._auth.getHostname() + '/api/collections/' + catId + '/categoryroot', options)
            .toPromise()
    }

    public categoryNames() : Promise<any> {
        let options = { withCredentials: true }
        
        return this.http
            .get(this._auth.getHostname() + '/api/collections/103/categorynames', options)
            .toPromise()
    }

    public categoryByFacet(facetName: string, collectionType ?: number) {
      let options = { withCredentials: true };

      let query = Object.assign({}, this.baseSolrQuery)
      let isHierarchy = facetName === "artstor-geography"

      if (isHierarchy) {
        let hierarchy = Object.assign({}, this.baseHierarchy)
        hierarchy.hierarchy = facetName
        query.hier_facet_fields2 = [hierarchy]
      } else {
        let facetField = Object.assign({}, this.baseFacetField)
        facetField.name = facetName
        facetField.limit = 500
        // Ignore junk data, collections with only one asset aren't collections we care about
        facetField.mincount = 5
        query.facet_fields = [facetField]
      }

      let filterArray = []

      if (collectionType) {
          filterArray.push("collectiontypes:"+ collectionType)
      }

      /**
       * Check for WLVs Institution filter
       * - WLVs filter by contributing institution id
       */
      let institutionFilters: number[] = this._app.config.contributingInstFilters
      for (let i = 0; i < institutionFilters.length; i++) {
        filterArray.push("contributinginstitutionid:" + institutionFilters[i])
      }

      query["filter_query"] = filterArray

      return this.http.post(this._auth.getSearchUrl(), query, options)
        .toPromise()
        .then(res => {
          let hierData = Object.values(res['hierarchies2'])
          if (hierData.length) { // if we have hierarchical data
            res = hierData[0]
          } else { // must be a facet
            res = res['facets'][0].values
          }
          return res
        })
    }

    nodeDesc(descId, widgetId){
        let options = { withCredentials: true };

        // Can be removed once region specific ids are no longer used
        if (descId.indexOf('103') == 1) {
            descId = descId.slice(1)
        }

        return this.http
            .get(this._auth.getHostname() + '/api/categorydesc/' + descId + '/' + widgetId, options)
            .toPromise()
    }

    /**
     * Get Collection
     * @param colId id of collection to fetch
     * @returns thumbnails of assets for a collection, and collection information
     */
    public getCollectionThumbs(colId: string, pageNo?: number, size?: number) {
        let options = {withCredentials: true};
        let imageSize = 0;

        if (!pageNo) { pageNo = 1; }
        if (!size) { size = 72; }

        let requestString = [this._auth.getUrl(), 'collections', colId, 'thumbnails', pageNo, size, imageSize].join('/');

        return this.http
            .get(requestString, options)
            .toPromise()
    }

    /**
     * Executes search and sets relevant asset-grid parameters
     * @param term Search term for which a search should be executed
     */
    private loadSearch(term: string): void {
        // Don't wait for previous subscription anymore
        if (this.searchSubscription && this.searchSubscription.hasOwnProperty('unsubscribe')) {
            this.searchSubscription.unsubscribe()
        }

         // Solr Search
        this.searchSubscription = this._assetSearch.search(this.urlParams, term, this.activeSort.index)
            .subscribe(
                (res) => {
                    let data = res
                    data.facets.forEach( (facet, index) => {
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
                    this.allResultsSource.error(error)
            });
    }

    /**
     * Wrapper function for HTTP call to get Image Groups. Used by browse component
     * @returns Chainable promise containing Image Groups data
     */
    public getIgs(){
        let options = { withCredentials: true };

        return this.http
            .get(this._auth.getUrl() + '/folders/110', options)
            .toPromise()
            .then((data) => {
                return data;
            });
    }

    /**
     * Wrapper function for HTTP call to get subImageGroups. Used by browse/groups component
     * @param subImageGroup id
     * @returns Chainable promise containing subImageGroups data
     */
    public subGroups(id: string){
        let options = { withCredentials: true };

        return this.http
            .get(this._auth.getUrl() + '/folders/' + id + '/imagegroups?studWkFldrs=true&parentWritable=true', options)
            .toPromise()
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
            .get(this._auth.getUrl() + '/collections/', options)
            .map( res => {
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
            })
    }

    public getFolders() {
        let options = { withCredentials: true };

        let requestString = [this._auth.getUrl(), "folders"].join("/");

        return this.http
            .get(requestString)
            .toPromise()
    }

    /**
     * Get associated images
     * @param objectId The id of the object for which you want associated items
     * @param colId The id of the collection from which the asset came
     * @param pageNum Value for pagination
     * @param size How many thumbnails per page
     */
    private getAssociated(objectId: string, colId: string, page: number, size: number) {
        let header = new HttpHeaders().set('Content-Type', 'application/json'); // ... Set content type to JSON
        let options = { headers: header, withCredentials: true }; // Create a request option
        let requestString: string = [this._auth.getUrl(), "collaboratoryfiltering", objectId, "thumbnails", page, size].join("/") + "?collectionId=" + colId;

        return this.http
            .get(requestString, options)
            .toPromise()
    }

    /**
     * Expected to return an object with a imageUrl at all costs
     * eg. http://kts.stage.artstor.org/service/get_player/?entry_id=1:0_s6agwcv9
     */
    public getFpxInfo(objectId: string, objectTypeId: number): Promise<any> {
        let requestUrl = this._auth.getUrl() + '/imagefpx/' + objectId + '/' + objectTypeId;

        return this.http
            .get(requestUrl, this.defaultOptions)
            .toPromise()
    }

    /**
     * Generate Thumbnail URL
     */
    public makeThumbUrl(imagePath: string, size ?: number): string {
        if (imagePath) {
            if (size) {
                imagePath = imagePath.replace(/(size)[0-4]/g, 'size' + size);
            }
            // Ensure relative
            if (imagePath.indexOf('artstor.org') > -1) {
                imagePath = imagePath.substring(imagePath.indexOf('artstor.org') + 12);
            }

            if (imagePath[0] != '/') {
                imagePath = '/' + imagePath;
            }

            if (imagePath.indexOf('thumb') < 0) {
                imagePath = '/thumb' + imagePath;
            }
        } else {
            imagePath = '';
        }

        // Ceanup
        return this._auth.getThumbUrl() + imagePath;
    }

    public getBlogEntries(query ?: string) {
        if (!query || query == "*") {
            // An asterisk query on the Wordpress API *LIMITS* results to those with an asterisk!
            query = "";
        } else {
            // Force exact phrase match
            query = '"'+ query +'"';
        }
        return this.http
            .get("https://public-api.wordpress.com/rest/v1.1/sites/artstor.wordpress.com/posts/?number=24&search=" + query)
            .toPromise()
    }

    /**
     * Call to API which returns an asset, given an encrypted_id
     * @param token The encrypted token that you want to know the asset id for
     */
    public decryptToken(token: string): Observable<any> {
        let header
        let options
        // if (document.referrer && document.referrer.indexOf('kressfoundation.org') > -1){
            // Custom header makes this call function as if IP auth
            header = new HttpHeaders({ withCredentials: 'true', fromKress : 'true' });
        // } else {
        //     header = new Headers({});
        // }

        options = { headers: header }; // Create a request option

        return this.http.get(this._auth.getHostname() + "/api/v1/items/resolve?encrypted_id=" + token, options)
        .map((res) => {
            let jsonRes = res
            if (jsonRes && jsonRes['success'] && jsonRes['item']) {
                return jsonRes
            }
            else { throw new Error("No success or item found on response object") }
        })
  }
}

export interface MetadataRes {
    success: boolean
    total: number
    metadata: {
        SSID: string
        collection_id: string
        collection_name: string
        download_size: string
        fileProperties: any[]
        height: number
        width: number
        image_url: string
        metadata_json: any[]
        object_id: string
        object_type_id: number
        resolution_x: number
        resolution_y: number
        thumbnail_url: string
        title: string
    }[]
}