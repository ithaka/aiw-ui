/**
 * Assets service
 */
import { Injectable, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Observable, BehaviorSubject } from 'rxjs/Rx';
import { Locker } from 'angular2-locker';

import 'rxjs/add/operator/toPromise';
import { Subscription }   from 'rxjs/Subscription';
 
import { AuthService } from './auth.service';
import { AssetFiltersService } from './../asset-filters/asset-filters.service';
import { ToolboxService } from './toolbox.service';

import { ImageGroup } from '.';

@Injectable()
export class AssetService {

    /** Constant that defines which collectionType belongs to institutions */
    static readonly institutionCollectionType: number = 2;

    //set up thumbnail observables
    private allResultsValue: any[] = [];
    // BehaviorSubjects push last value on subscribe
    private allResultsSource = new BehaviorSubject<any>(this.allResultsValue);
    public allResults = this.allResultsSource.asObservable();

    // Keep track of which params the current results are related to
    private currentLoadedParams: any = {};

    // For loading the assets in the next page - Asset Page
    public lastSearchParams: any = {};
    public searchPageSize: number = 24;

    /**
     * urlParams is used as an enum for special parameters
     */
    private urlParams: any;
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

    constructor(
        private _filters: AssetFiltersService,
        private _router: Router,
        private route: ActivatedRoute,
        private http: Http,
        locker: Locker,
        private _auth: AuthService,
        private _toolbox: ToolboxService
    ) {
        this._storage = locker.useDriver(Locker.DRIVERS.LOCAL);
        this.urlParams = {
            term: "",
            pageSize: 24,
            currentPage: 1,
            startDate: 0,
            endDate: 0,
            igId: "",
            objectId: "",
            colId: "",
            catId: "",
            collTypes: ""
        };
    }

    private updateLocalResults(results: any[]) {
        this.allResultsValue = results;
        this.allResultsSource.next(results);
    } 

    /**
     * Sets urlParams based on matching keys with the url params that are passed in
     * @param passedParams The current url parameters; must be passed in b/c only components have access to url parameters
     */
    private readUrlParams(passedParams: any) {
        // Creates filters and list of relevant url parameters for use by search
        for (let param in passedParams) {
            // test if param is a special parameter
            if (this.urlParams.hasOwnProperty(param)) {
                // param is a special parameter - assign the value
                if((param == 'currentPage') || (param == 'pageSize')){
                    this.urlParams[param] = parseInt(passedParams[param]);
                }
                else{
                    this.urlParams[param] = passedParams[param];
                }
                
            } else {
                // Any other filters are managed by Asset Filters
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
        let currentParamsObj: Params = Object.assign({}, this.lastSearchParams);
        
        if(this.lastSearchParams.currentPage){
            currentParamsObj['currentPage']--;
        }

        this.queryAll(currentParamsObj);
    }
    
    public loadNextAssetPage(): void{
        let currentParamsObj: Params = Object.assign({}, this.lastSearchParams);
        
        if(this.lastSearchParams.currentPage){
            currentParamsObj['currentPage']++;
        }
        else{
            currentParamsObj['currentPage'] = 2;
        }
        this.queryAll(currentParamsObj);
    }

    /**
     * Determines which service to call based on which route parameters exist
     * @param params Object conaining all route params
     */
    public queryAll(params: any) {
        // Reset allResults
        if (this._toolbox.compareObjects(this.currentLoadedParams, params) === false) {
            // Params are different, clear the assets!
            this.allResultsSource.next([]);
        }

        this.currentLoadedParams = params;

        this.lastSearchParams = params;
        this.searchPageSize = this.urlParams.pageSize;

        this.readUrlParams(params);
        this.setFiltersFromURLParams(params);


        if (params.hasOwnProperty("objectId") && params.hasOwnProperty("colId")) {
            //gets associated images thumbnails
            this.loadAssociatedAssets(params.objectId, params.colId);
        } else if (params.hasOwnProperty("igId")) {
            //get image group thumbnails
            this.loadIgAssets(params.igId);
        } else if (params.hasOwnProperty("objectId")) {
            //get clustered images thumbnails
            this.loadCluster(params.objectId);
        } else if (params.hasOwnProperty("catId")) {
            //get collection thumbnails
            this.loadCategory(params.catId);
        }  else if (params.hasOwnProperty("colId")) {
            //get collection thumbnails
            this.loadCollection(params.colId);
        } else if (params.hasOwnProperty("term")) {
            this.loadSearch(params.term);
        } else {
            console.log("don't know what to query!");
        } 
    }

    /**
     * Set the filters using filter service from URL params
     * @param params Object conaining all route params
     */
    private setFiltersFromURLParams(params: any): void{
        var thisObj = this;
        Object.keys(params).forEach(function(key) {
            // console.log(params[key]);
            var filter = {};
            if((key == 'collTypes') || (key == 'classification') || (key == 'geography')){
                filter = {
                    filterGroup : key,
                    filterValue : params[key] 
                };
                
                if(!thisObj._filters.isApplied(filter)){ // Add Filter
                    thisObj._filters.apply(filter);
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
     * Generates Image URL
     * @param assetId: string Asset or object ID
     */
    public genrateImageURL(assetId: string) {

        return this.http
            .get(this._auth.getUrl() + '/encrypt/'+ assetId + '?_method=encrypt', this.defaultOptions)
            .toPromise()
            .then(this.extractData);
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

    /**
     * Get IIIF tilesource for an Asset
     * @param assetId string Asset or object ID
     */
    public getImageSource(assetId: string) {
        let collectionId = 103;
        
        return this.http
            .get( this._auth.getUrl() + '/imagefpx/' + assetId + '/' + collectionId + '/5', this.defaultOptions)
            .map(data => {
                // This call returns an array-- maybe it supports querying multiple ids?
                // For now let's just grab the first item in the array
                return(data.json()[0]);
            });
    }

    /**
     * Gets array of thumbnails associated to objectId
     * @param objectId Object Id for which to retrieve image results
     * @param colId Collection Id in which the Object resides
     */
    private loadAssociatedAssets(objectId: string, colId: string) {
        // this.getAssociated(objectId, colId, this.pagination.currentPage, this.pagination.pageSize)
        this.getAssociated(objectId, colId, this.urlParams.currentPage, this.urlParams.pageSize)
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

        let header = new Headers({ 'Content-Type': 'application/json' }); // ... Set content type to JSON
        let options = new RequestOptions({ headers: header, withCredentials: true }); // Create a request option

        let requestString: string = [this._auth.getUrl(), "imagegroup",igId, "thumbnails", this.urlParams.currentPage, this.urlParams.pageSize, this.activeSort.index].join("/");

        this.http
            .get(requestString, options)
            .toPromise()
            .then((data) => { return this.extractData(data); })
            .then((data) => {
                if (!data) {
                throw new Error("No data in image group thumbnails response");
                }
                //notify allResults observers
                this.updateLocalResults(data);
            })
            .catch((error) => {
                console.log(error);
            });
    }

    /**
     * Loads thumbnails from a collectionType
     * @param colId Collection Id for which to fetch results
     */
    private loadCollection(colId: string) {
        let options = new RequestOptions({withCredentials: true});
        let imageSize = 0;

        let requestString = [this._auth.getUrl(), 'collections', colId, 'thumbnails', this.urlParams.currentPage, this.urlParams.pageSize, imageSize].join('/');

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
        let requestString = [this._auth.getUrl(), 'categories', catId, 'thumbnails',this.urlParams.currentPage, this.urlParams.pageSize, imageSize].join('/');

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
        let options = new RequestOptions({ withCredentials: true });
        let startIndex = ((this.urlParams.currentPage - 1) * this.urlParams.pageSize) + 1;

        let requestString = [this._auth.getUrl(), "cluster", objectId, "thumbnails", startIndex, this.urlParams.pageSize].join("/");

        this.http
            .get(requestString, options)
            .toPromise()
            .then(this.extractData)
            .then((res) => {
                if (res.thumbnails) {
                    this.allResultsSource.next(res);
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
    private loadSearch(term: string) {
        this.search(term, this.activeSort.index)
            .then(
                (res) => {
                this._filters.generateColTypeFacets( res.collTypeFacets );
                this._filters.generateGeoFilters( res.geographyFacets );
                this._filters.generateDateFacets( res.dateFacets );
                this._filters.setAvailable('classification', res.classificationFacets);
                this.allResultsSource.next(res);
            })
            .catch(function(err) {
                console.error(err);
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
        let thumbSize = 0;
        let type = 6;
        let colTypeIds = '';
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
        // /search/1/{start_idx}/{page_size}/0?type= 1&kw={keyword}&origKW=&id={collection_ids}&name=All Collections&order={order}&tn={thumbnail_size}
        
        return this.http
            .get(this._auth.getUrl() + '/search/' + type + '/' + startIndex + '/' + this.urlParams.pageSize + '/' + sortIndex + '?' + 'type=' + type + '&kw=' + keyword + '&origKW=&geoIds=' + geographyIds + '&clsIds=' + classificationIds + '&collTypes=' + colTypeIds + '&id=all&name=All%20Collections&bDate=' + earliestDate + '&eDate=' + latestDate + '&dExact=&order=0&isHistory=false&prGeoId=&tn=1', options)
            .toPromise()
            .then(this.extractData);
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
        let requestUrl = this._auth.getUrl() + '/imagefpx/' + objectId + '/' + objectTypeId;
        
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
        if (size) {
            imagePath = imagePath.replace(/(size)[0-4]/g, 'size' + size);
        }
        return this._auth.getThumbUrl() + imagePath;
    }
}