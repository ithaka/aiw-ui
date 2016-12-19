/**
 * Assets service
 */
import { Injectable, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Rx';
import { Subject } from 'rxjs/Subject';
import { Locker } from 'angular2-locker';

import 'rxjs/add/operator/toPromise';
import { Subscription }   from 'rxjs/Subscription';
 
import { AuthService } from '../shared/auth.service';
import { AssetFiltersService } from './../asset-filters/asset-filters.service';

@Injectable()
export class AssetService {

    //set up thumbnail observables
    private allResultsSource = new Subject<any[]>();
    public allResults = this.allResultsSource.asObservable();

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

    constructor(
        private _filters: AssetFiltersService,
        private _router: Router,
        private route: ActivatedRoute,
        private http: Http,
        locker: Locker,
        private _auth: AuthService
    ) {
        this._storage = locker;
        this.urlParams = {
            term: "",
            pageSize: 24,
            currentPage: 1,
            startDate: 0,
            endDate: 0,
            igId: "",
            objectId: "",
            colId: ""
        };
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
                this.urlParams[param] = passedParams[param];
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

    /**
     * Determines which service to call based on which route parameters exist
     * @param params Object conaining all route params
     */
    public queryAll(params: any) {
        this.readUrlParams(params);

        if (params.hasOwnProperty("igId") && params.hasOwnProperty("objectId")) {
            //gets associated images thumbnails
            this.loadAssociatedAssets(params.objectId, params.colId);
        } else if (params.hasOwnProperty("igId")) {
            //get image group thumbnails
            this.loadIgAssets(params.igId);
        } else if (params.hasOwnProperty("objectId")) {
            //get clustered images thumbnails
            this.loadCluster(params.objectId);
        } else if (params.hasOwnProperty("colId")) {
            //get collection thumbnails
            this.loadCollection(params.colId);
        } else if (params.hasOwnProperty("term")) {
            this.loadSearch(params.term);
        } else {
            console.log("don't know what to query!");
        } 
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
                // this.results = data.thumbnails;
                this.allResultsSource.next(data);
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
                this.allResultsSource.next(data);
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
                data.count = data.thumbnails.length;
                console.log(data);
                this.allResultsSource.next(data);
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
     * Term List Service
     * @returns Returns the Geo Tree Object used for generating the geofacets tree.
     */
    public termList(){
        let options = new RequestOptions({ withCredentials: true });
        
        return this.http
            .get(this._auth.getUrl() + '/termslist/', options)
            .toPromise()
            .then(this.extractData)
            .then((res) => {
                this.geoTree = res.geoTree;
            });
    }

    /**
     * Executes search and sets relevant asset-grid parameters
     * @param term Search term for which a search should be executed
     */
    private loadSearch(term: string) {
        this.search(term, this.activeSort.index)
            .then(
                (res) => {
                console.log(res);
                this._filters.generateColTypeFacets( res.collTypeFacets );
                this._filters.generateGeoFilters( res.geographyFacets );
                // this.generateDateFacets( res.dateFacets );
                this._filters.setAvailable('classification', res.classificationFacets);
                this.allResultsSource.next(res);
                // this.searchLoading = false;
            })
            .catch(function(err) {
                // this.searchLoading = false;
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
     * Wrapper function for HTTP call to get collections. Used by both home component and asset.service
     * @returns Chainable promise containing collection data
     */
    public getCollections() {
        let options = new RequestOptions({ withCredentials: true });
        // Returns all of the collections names
        return this.http
            .get(this._auth.getUrl() + '/institutions/', options)
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
 
 
}