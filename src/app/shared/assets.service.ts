/**
 * Assets service
 */
import { Injectable, OnDestroy, OnInit, EventEmitter } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Observable, BehaviorSubject, Subject } from 'rxjs/Rx';
import { Locker } from 'angular2-locker';
import 'rxjs/add/operator/toPromise';
import { Subscription }   from 'rxjs/Subscription';
 
// Project Dependencies
import { AuthService } from './auth.service';
import { GroupService } from './group.service';
import { AssetFiltersService } from './../asset-filters/asset-filters.service';
import { ToolboxService } from './toolbox.service';

import { ImageGroup, Thumbnail } from '.';

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

    //Set up subject observable for clearing select mode
    public clearSelectMode: Subject<boolean> = new Subject();  

    // Pagination value observable
    private paginationValue: any = {
        totalPages: 1,
        pageSize: 24,
        currentPage: 1
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

    public filterFields = [
        {name: "In any field", value: "all"},
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
            pageSize: 24,
            currentPage: 1,
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

    /** Keeps track of all filters available in url */
    // private knownFilters: any = {};
    public _storage;

    /** Default Headers for this service */
    // ... Set content type to JSON
    private header = new Headers({ 'Content-Type': 'application/json' }); 
    private defaultOptions = new RequestOptions({ headers: this.header, withCredentials: true });

    // Switch for using Sycamore's New Search interface
    private newSearch : boolean = false;

    // Pagination flag for preserving the select mode while paging through the results
    public paginated: boolean = false;

    // bandaid for the re-search functionality
    private searchErrorCount: number = 0

    constructor(
        private _filters: AssetFiltersService,
        private _router: Router,
        private route: ActivatedRoute,
        private http: Http,
        locker: Locker,
        private _auth: AuthService,
        private _groups: GroupService,
        private _toolbox: ToolboxService
    ) {
        this._storage = locker.useDriver(Locker.DRIVERS.LOCAL);

        // Flip switch for Sycamore's New Search
        if( document.location.hostname.indexOf('ang-ui-sycamore-search.apps.test.cirrostratus.org') > -1 ) {
            this.newSearch = true;
        }
    } 

    private updateLocalResults(resultObj: any) {
        // These Params have been loaded now
        this.currentLoadedParams = Object.assign(Object.assign({}, this.defaultUrlParams), this.urlParams);

        let totalPages = 1;
        
        if (resultObj.count) {
          totalPages = Math.ceil( resultObj.count / this.urlParams.pageSize );
        }

        // Update pagination object
        let paginationValue = {
            totalPages: totalPages,
            pageSize: this.urlParams.pageSize,
            currentPage: this.urlParams.currentPage
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
     * Removes all object ids in allResults which match one of the ids in ids
     * @param ids The array of object ids to remove from allResults
     */
    public removeFromResults(ids: string[]): void {
        this.allResultsValue['thumbnails'] = this.allResultsValue['thumbnails'].filter((thumbnail: Thumbnail) => {
            return ids.indexOf(thumbnail.objectId) < 0
        });
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
        this.setUrlParam('currentPage', page, quiet);
    }

    public setPageSize(size: number) {
        this.setUrlParam('pageSize', size);
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

        if(currentParamsObj['pageSize']){
            currentParamsObj['pageSize'] = currentParamsObj['pageSize'].toString();
        }
        if(currentParamsObj['currentPage']){
            currentParamsObj['currentPage'] = currentParamsObj['currentPage'].toString();
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
    
    private extractData(res: Response) {
        let body = res.json();
        return body || { };
    }

    public loadPrevAssetPage(): void{
        let currentParamsObj: Params = Object.assign({}, this.currentLoadedParams);
        
        if(this.currentLoadedParams.currentPage){
            currentParamsObj['currentPage']--;
        }

        this.queryAll(currentParamsObj);
    }
    
    public loadNextAssetPage(): void{
        let currentParamsObj: Params = Object.assign({}, this.currentLoadedParams);
        
        if(this.currentLoadedParams.currentPage){
            currentParamsObj['currentPage']++;
        }
        else{
            currentParamsObj['currentPage'] = 2;
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
        params.pageSize = parseInt(params.pageSize);
        params.currentPage =  parseInt(params.currentPage);

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

        // Tell the filters service we have some updates
        this.setFiltersFromURLParams(params);

        //Set sort param
        if(params['sort']){
            this.activeSort.index = params['sort'];
        }

        // Read Pagination values
        this.paginationValue.pageSize = parseInt(this.urlParams.pageSize);
        this.paginationValue.currentPage =  parseInt(this.urlParams.currentPage);
        this.paginationSource.next(this.paginationValue);

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
            //get collection thumbnails
            this.loadCategory(params.catId);
        }  else if (params.hasOwnProperty("colId") && params["colId"] !== "") {
            //get collection thumbnails
            this.loadCollection(params.colId);
        } else if (params.hasOwnProperty("term")) {
            this.loadSearch(params.term);
        } else {
            console.log("Don't know what to query!");
        } 
    }

    /**
     * Set the filters using filter service from URL params
     * @param params Object conaining all route params
     */
    private setFiltersFromURLParams(params: any): void{
        var thisObj = this;
        Object.keys(params).forEach(function(key) {
            var filter = {};
            if((key == 'collTypes') || (key == 'classification') || (key == 'geography')){
                if(!thisObj._filters.isApplied(key, params[key])){ // Add Filter
                    thisObj._filters.apply(key, params[key]);
                }
            }
        });

        if(params['startDate'] && params['endDate']){
            var dateObj = {
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
        }
        else{
            var dateObj = {
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
        }
    }

    /**
     * Gets metadata for a single asset by ID
     * @param assetId: string Asset or object ID
     */
    public getById(assetId: string) {

        return this.http
            .get(this._auth.getUrl() + '/metadata/' + assetId, this.defaultOptions)
            .toPromise()
            .then(this.extractData);
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
            .then(this.extractData);
    }

    /**
     * Generate asset share link
     */
    public getShareLink(assetId: string) {
        //   Links in the clipboard need a protocol defined
        return 'http://' + window.location.host + '/#/asset/' + assetId;

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
            .then(this.extractData);
    }

    /**
     * Gets File Properties table for an asset
     * @param assetId Id for an asset/object
     */
    public getFileProperties(assetId: string): Promise<any> {
        return this.http
            .get(this._auth.getUrl() + '/metadata/' + assetId + '?_method=FpHtml', this.defaultOptions)
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
     * Get IIIF tilesource for an Asset
     * @param assetId string Asset or object ID
     */
    public getImageSource(assetId: string, collectionId?: number) {
        if (!collectionId) {
            collectionId = this.getRegionCollection()
        }

        return this.http
            .get( this._auth.getUrl() + '/imagefpx/' + assetId + '/' + collectionId + '/5', this.defaultOptions)
            .map(data => {
                // This call returns an array-- maybe it supports querying multiple ids?
                // For now let's just grab the first item in the array
                if (data.json() && data.json().length > 0) {
                    return(data.json()[0]);
                } else {
                    return(data.json() || {});
                }
            });
    }

    /**
     * Gets array of thumbnails associated to objectId
     * @param objectId Object Id for which to retrieve image results
     * @param colId Collection Id in which the Object resides
     */
    private loadAssociatedAssets(objectId: string, colId: string) {
        let startIndex = ((this.urlParams.currentPage - 1) * this.urlParams.pageSize) + 1;
        this.getAssociated(objectId, colId, startIndex, this.urlParams.pageSize)
            .then((data) => {
                if (!data) {
                    throw new Error("No data in image group thumbnails response");
                }
                this.updateLocalResults(data);
            })
            .catch((error) => {
                console.log(error);
            });
    }

    /**
     * Gets array of thumbnails and sets equal to results
     * @param igId Image group id for which to retrieve thumbnails
     */
    private loadIgAssets(igId: string) {
        // Reset No IG observable
        this.noIGSource.next(false);

        // Create a request option
        let startIndex = ((this.urlParams.currentPage - 1) * this.urlParams.pageSize) + 1;

        let requestString: string = [this._auth.getUrl(), "imagegroup",igId, "thumbnails", startIndex, this.urlParams.pageSize, this.activeSort.index].join("/");

        this._groups.get(igId)
            .toPromise()
            .then((data) => { return this.extractData(data); })
            .then((data) => {
                if (!data) {
                    throw new Error("No data in image group thumbnails response");
                }
                
                data.count = data.items.length;
                let pageStart = (this.urlParams.currentPage - 1)*this.urlParams.pageSize;
                let pageEnd = this.urlParams.currentPage*this.urlParams.pageSize;
                let idsAsTerm: string =  data.items.slice(pageStart,pageEnd).join('&object_id=');

                let options = new RequestOptions({ withCredentials: true });
                
                this.http.get(this._auth.getHostname() + '/api/v1/items?object_id=' + idsAsTerm, options)
                    .subscribe(
                        (res) => {
                            let results = res.json();
                            data.thumbnails = results.items;
                            // Set the allResults object
                            this.updateLocalResults(data);
                    }, (error) => {
                        // Pass portion of the data we have
                        this.updateLocalResults(data);
                        // Pass error down to allResults listeners
                        this.allResultsSource.error(error); // .throw(error);
                    });
                
            })
            .catch((error) => {
                console.error(error);
                if((error.status === 404) || (error.status === 403)){
                    this.noIGSource.next(true);
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

        // set up the string for calling search
        ig.count = ig.items.length
        let pageStart = (this.urlParams.currentPage - 1)*this.urlParams.pageSize
        let pageEnd = this.urlParams.currentPage*this.urlParams.pageSize
        let idsAsTerm: string =  ig.items.slice(pageStart,pageEnd).join('&object_id=')

        let options = new RequestOptions({ withCredentials: true })
        
        this.http.get(this._auth.getHostname() + '/api/v1/items?object_id=' + idsAsTerm, options)
            .subscribe(
                (res) => {
                    let results = res.json()
                    ig.thumbnails = results.items
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
        return new Promise( (resolve, reject) => {
            let allThumbnails = [];
            let options = new RequestOptions({ withCredentials: true });
            
            let loadBatch = (i) => {
                let idsAsTerm: string =  igIds.slice(i,i+100).join('&object_id=');
                this.http.get(this._auth.getHostname() + '/api/v1/items?object_id=' + idsAsTerm, options)
                        .toPromise()
                        .then(
                            (res) => {
                                let results = res.json();
                                allThumbnails = allThumbnails.concat(results.items);
                                if (i + 100 >= igIds.length) {
                                    resolve(allThumbnails);
                                } else {
                                    loadBatch(i + 101)
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
        let options = new RequestOptions({withCredentials: true});
        let imageSize = 0;
        let startIndex = ((this.urlParams.currentPage - 1) * this.urlParams.pageSize) + 1;

        let requestString = [this._auth.getUrl(), 'collections', colId, 'thumbnails', startIndex, this.urlParams.pageSize, this.activeSort.index].join('/');

        return this.http
            .get(requestString, options)
            .toPromise()
            .then(this.extractData)
            .then((data) => {
                this.updateLocalResults(data);
            })
            .catch(error => {
                console.log(error);
            });
    }

    /** 
     *  Loads thumbnails for a Category/Subcategory to this.AllResults
     *  @param catId Category ID
     */
    private loadCategory(catId: string): Promise<any> {
        let imageSize = 0;
        let startIndex = ((this.urlParams.currentPage - 1) * this.urlParams.pageSize) + 1;
        if (catId.startsWith('103')) {
            catId = this.getRegionCollection(parseInt(catId)).toString()
        }
        let requestString = [this._auth.getUrl(), 'categories', catId, 'thumbnails', startIndex, this.urlParams.pageSize, this.activeSort.index].join('/');

        return this.http
            .get(requestString, this.defaultOptions)
            .toPromise()
            .then(this.extractData)
            .then((data) => {
                this.updateLocalResults(data);
            })
            .catch(error => {
                console.log(error);
            });
    }

    private loadCluster(objectId: string){
        this.currentLoadedParams = Object.assign(Object.assign({}, this.defaultUrlParams), this.urlParams);
        
        let options = new RequestOptions({ withCredentials: true });
        let startIndex = ((this.urlParams.currentPage - 1) * this.urlParams.pageSize) + 1;

        let requestString = [this._auth.getUrl(), "cluster", objectId, "thumbnails", startIndex, this.urlParams.pageSize].join("/");

        this.http
            .get(requestString, options)
            .toPromise()
            .then(this.extractData)
            .then((res) => {
                if (res.thumbnails) {
                    // Set the allResults object
                    this.updateLocalResults(res);
                } else {
                    throw new Error("There are no thumbnails. Server responsed with status " + res.status);
                }
                
            })
            .catch(function(err) {
                console.log(err);
            });
    }

    // Used by Browse page
    public pccollection(){
        let options = new RequestOptions({ withCredentials: true });

        return this.http
            .get(this._auth.getUrl() + '/pccollection', options)
            .toPromise()
            .then(this.extractData);
    }

    public category(catId: string) {
        let options = new RequestOptions({ withCredentials: true });

        return this.http
            .get(this._auth.getUrl() + '/collections/' + catId + '/categoryroot', options)
            .toPromise()
            .then(this.extractData);
    }

    subcategories(id) {
        let options = new RequestOptions({ withCredentials: true });

        return this.http
            .get(this._auth.getUrl() + '/categories/' + id + '/subcategories', options)
            .toPromise()
            .then(this.extractData);
    }

    nodeDesc(descId, widgetId){
        let options = new RequestOptions({ withCredentials: true });

        return this.http
            .get(this._auth.getUrl() + '/categorydesc/' + descId + '/' + widgetId, options)
            .toPromise()
            .then(this.extractData);
    }

    /**
     * Get Collection
     * @param colId id of collection to fetch
     * @returns thumbnails of assets for a collection, and collection information
     */
    private getCollectionThumbs(colId: string, pageNo?: number, pageSize?: number) {
        let options = new RequestOptions({withCredentials: true});
        let imageSize = 0;
        
        if (!pageNo) { pageNo = 1; }
        if (!pageSize) { pageSize = 72; }

        let requestString = [this._auth.getUrl(), 'collections', colId, 'thumbnails', pageNo, pageSize, imageSize].join('/');

        return this.http
            .get(requestString, options)
            .toPromise()
            .then(this.extractData);
    }   

    /**
     * Executes search and sets relevant asset-grid parameters
     * @param term Search term for which a search should be executed
     */
    private loadSearch(term: string): void {
        // Don't wait for previous subscription anymore
        if (this.searchSubscription && this.searchSubscription.hasOwnProperty('unsubscribe')) {
            this.searchSubscription.unsubscribe();
        }

        // Subscribe to most recent search
        this.searchSubscription = this.search(term, this.activeSort.index)
            .subscribe(
                (res) => {
                    let data = res.json();
                    if (data && data.collTypeFacets) {
                        this._filters.generateColTypeFacets( data.collTypeFacets );
                        this._filters.generateGeoFilters( data.geographyFacets );
                        this._filters.generateDateFacets( data.dateFacets );
                        this._filters.setAvailable('classification', data.classificationFacets);
                    }
                    // Transform data from SOLR queries
                    if (data.results) {
                        data.thumbnails = data.results;
                    }
                    // Set the allResults object
                    this.updateLocalResults(data);
            }, (error) => {
                // as far as I can tell, the ADL services never respond with proper errors
                // so all errors will be routed through the success channel above
                // so if there's an error, we can be sure it's not from the services
                // which is great because Fastly throws errors when searches take longer than 20 seconds
                // which is common
                // so here's the flow chart for the fix:
                // <--------FLOW CHART-------->
                //  search something -> it takes too long ->
                //  Fastly throws error and disconnects (w/ 900 status and no Access-Control-Allow-Origin headers,
                //  so we can't actually tell that we're getting a 900 status, we're mostly guessing) ->
                //  the search will complete soon and will be cached -> rerun the search and it will work
                // <-------------------------->
                // we just recursively call this function until search results load
                // so, the user never sees an error (woohoo) also, if they refresh it will likely work anyway
                // ok i'm done

                if (error.status == 0 && this.searchErrorCount < 3) {
                    this.searchErrorCount++
                    setTimeout(this.loadSearch(term), 7000)
                } else {
                    this.searchErrorCount = 0
                    console.error(error)
                    this.allResultsSource.error(error); // .throw(error);
                }
                
                // Pass error down to allResults listeners
                // console.error(error, error.status)
            });
    }

    /**
     * Search assets service
     * @param term          String to search for.
     * @param filters       Array of filter objects (with filterGroup and filterValue properties)
     * @param sortIndex     An integer representing a type of sort.
     * @param dateFacet     Object with the dateFacet values
     * @returns       Returns an object with the properties: thumbnails, count, altKey, classificationFacets, geographyFacets, minDate, maxDate, collTypeFacets, dateFacets
     */
    private search(term: string, sortIndex) {
        let keyword = encodeURIComponent(term);
        let options = new RequestOptions({ withCredentials: true });
        let startIndex = ((this.urlParams.currentPage - 1) * this.urlParams.pageSize) + 1;
        let thumbSize = 1;
        let categoryId = this.urlParams['categoryId'];
        let type = categoryId ? 2 : 6;
        let colTypeIds = '';
        let collIds = categoryId ? encodeURIComponent(categoryId) : encodeURIComponent(this.urlParams['coll']);
        let classificationIds = '';
        let geographyIds = '';

        let earliestDate = '';
        let latestDate = '';

        let filters = this._filters.getApplied(); 
        // To-do: break dateObj out of available filters
        let dateFacet = this._filters.getAvailable()['dateObj'];
        
        if(dateFacet.modified){
            earliestDate = dateFacet.earliest.date;
            earliestDate = ( dateFacet.earliest.era == 'BCE' ) ? ( parseInt(earliestDate) * -1 ).toString() : earliestDate;

            latestDate = dateFacet.latest.date;
            latestDate = ( dateFacet.latest.era == 'BCE' ) ? ( parseInt(latestDate) * -1 ).toString() : latestDate;
        }

        for(var i = 0; i < filters.length; i++){ // Applied filters
            if(filters[i].filterGroup === 'collTypes'){ // Collection Types
                colTypeIds = filters[i].filterValue;
            }
            if(filters[i].filterGroup === 'classification'){ // Classification
                if(classificationIds != ''){
                    classificationIds += ',';
                }
                classificationIds += filters[i].filterValue;
            }
            if(filters[i].filterGroup === 'geography'){ // Geography
                if(geographyIds != ''){
                    geographyIds += ',';
                }
                geographyIds += filters[i].filterValue;
            }
        }
        
        if (this.newSearch === false) {
            return this.http
                .get(this._auth.getUrl() + '/search/' + type + '/' + startIndex + '/' + this.urlParams.pageSize + '/' + sortIndex + '?' + 'type=' + type + '&kw=' + keyword + '&origKW=' + keyword + '&geoIds=' + geographyIds + '&clsIds=' + classificationIds + '&collTypes=' + colTypeIds + '&id=' + (collIds.length > 0 ? collIds : 'all') + '&name=All%20Collections&bDate=' + earliestDate + '&eDate=' + latestDate + '&dExact=&order=0&isHistory=false&prGeoId=&tn=1', options);
        } else {
            let query = {
                "limit" : this.urlParams.pageSize,
                "content_types" : [
                    "art"
                ],
                "query" : "arttitle:" + keyword
            };

            return this.http.post('//search-service.apps.test.cirrostratus.org/browse/', query, options);
        }
        
    }

    /**
     * Wrapper function for HTTP call to get Image Groups. Used by browse component
     * @returns Chainable promise containing Image Groups data
     */
    public getIgs(){
        let options = new RequestOptions({ withCredentials: true });

        return this.http
            .get(this._auth.getUrl() + '/folders/110', options)
            .toPromise()
            .then(this.extractData)
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
        let options = new RequestOptions({ withCredentials: true });

        return this.http
            .get(this._auth.getUrl() + '/folders/' + id + '/imagegroups?studWkFldrs=true&parentWritable=true', options)
            .toPromise()
            .then(this.extractData);
    }

    /**
     * Wrapper function for HTTP call to get collections. Used by home component
     * @param type Can either be 'ssc' or 'institution'
     * @returns Chainable promise containing collection data
     */
    public getCollections(type: string) {
        let options = new RequestOptions({ withCredentials: true });
        // Returns all of the collections names
        return this.http
            .get(this._auth.getUrl() + '/institutions/', options)
            .toPromise()
            .then(this.extractData)
            .then((data) => {
                this._storage.set('institution', data);
                data && this._auth.setInstitution(data);

                let returnCollections: any[] = [];
                let addToArr: boolean;

                // this loop is for data cleaning/alteration
                // there are collections named "Browse by ..." which need to be filtered out
                // array also needs to be filtered by collection type
                for (let i = data.Collections.length - 1; i >= 0; i--) {
                    // assume addToArr is true until logical tests prove false
                    addToArr = true;
                    let collection: any = data.Collections[i];

                    // remove collections that start with "Browse"
                    if (collection.collectionname && collection.collectionname.substring(0, 6).toLowerCase() === "browse") {
                        addToArr = false;
                    }

                    // if institution collections requested, remove any SSC collections
                    //  otherwise, remove institution collections
                    if (
                        (type === 'institution' && collection.collectionType !== AssetService.institutionCollectionType)
                        ||
                        (type === 'ssc' && collection.collectionType === AssetService.institutionCollectionType)
                    ) { addToArr = false; }

                    if (addToArr) {
                        // add default depth for use in folder operations
                        collection.depth = 0;
                        returnCollections.unshift(collection);
                    }
                }
                data.Collections = returnCollections;
                return data;
            });
    }

    public getFolders() {
        let options = new RequestOptions({ withCredentials: true });

        let requestString = [this._auth.getUrl(), "folders"].join("/");

        return this.http
            .get(requestString)
            .toPromise()
            .then(this.extractData);
    }

    /**
     * Get associated images
     * @param objectId The id of the object for which you want associated items
     * @param colId The id of the collection from which the asset came
     * @param pageNum Value for pagination
     * @param pageSize How many thumbnails per page
     */
    private getAssociated(objectId: string, colId: string, currentPage: number, pageSize: number) {
        let header = new Headers({ 'Content-Type': 'application/json' }); // ... Set content type to JSON
        let options = new RequestOptions({ headers: header, withCredentials: true }); // Create a request option
        let requestString: string = [this._auth.getUrl(), "collaboratoryfiltering", objectId, "thumbnails", currentPage, pageSize].join("/") + "?collectionId=" + colId;

        return this.http
            .get(requestString, options)
            .toPromise()
            .then((data) => { return this.extractData(data); });
    }

    /**
     * Expected to return an object with a imageUrl at all costs
     * eg. http://kts.stage.artstor.org/service/get_player/?entry_id=1:0_s6agwcv9
     */
    public getFpxInfo(objectId: string, objectTypeId: number): Promise<any> {
        // http://library.artstor.org/library/secure/imagefpx/SS7730295_7730295_8847273/24
        let requestUrl = this._auth.getImageFpxUrl() + '/' + objectId + '/' + objectTypeId;
        
        return this.http
            .get(requestUrl, this.defaultOptions)
            .toPromise()
            .then((data) => { 
                return data.json() || {}; 
            });
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

    /**
     * Term List Service
     * @returns Returns the Terms list Object for Advance Search
     */
    public loadTermList(){
        let options = new RequestOptions({ withCredentials: true });
        
        return this.http
            .get(this._auth.getUrl() + '/termslist/', options)
            .toPromise()
            .then(this.extractData);
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
            .then(this.extractData);
    }

    /**
     * Call to API which returns an asset, given an encrypted_id
     * @param token The encrypted token that you want to know the asset id for
     */
    public decryptToken(token: string): Observable<any> {
        return this.http.get(this._auth.getHostname() + "/api/v1/items/resolve?encrypted_id=" + token)
        .map((res) => {
            let jsonRes = res.json() || {}
            if (jsonRes && jsonRes.success && jsonRes.item) { return jsonRes.item }
            else { throw new Error("No success or item found on response object") }
        })
  }
}