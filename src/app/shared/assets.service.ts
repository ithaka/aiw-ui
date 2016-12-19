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

@Injectable()
export class AssetService {

    //set up thumbnail observables
    private allResultsSource = new Subject<any[]>();
    public allResults = this.allResultsSource.asObservable();

    /**
     * urlParams is used as an enum for special parameters
     */
    private urlParams: any = {
        term: "",
        pageSize: 24,
        totalPages: 1,
        currentPage: 1,
        startDate: "",
        endDate: "",
        igId: "",
        objectId: "",
        colId: ""
    };

    /** Keeps track of all filters available in url */
    private knownFilters: any = {};
    public _storage;

    constructor(private _router: Router, private route: ActivatedRoute, private http: Http, locker: Locker, private _auth: AuthService ){
        this._storage = locker;
    }

    private readUrlParams() {
        let params = this.route.snapshot.params;

        // Creates filters and list of relevant url parameters for use by search
        for (let param in params) {
            // test if param is a special parameter
            if (this.urlParams.hasOwnProperty(param)) {
                // param is a special parameter - assign the value
                this.urlParams[param] = params[param];
            } else {
                // param is (likely) a filter (or I messed up) - add it to knownFilters
                this.knownFilters[param] = params[param];
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

    public queryAll(queryObject: any) {
        this.readUrlParams();

        if (queryObject.hasOwnProperty("igId") && queryObject.hasOwnProperty("objectId")) {
            //gets associated images thumbnails
            this.loadAssociatedAssets(queryObject.objectId, queryObject.colId);
        } else if (queryObject.hasOwnProperty("igId")) {
            //get image group thumbnails
            this.loadIgAssets(queryObject.igId);
        } else if (queryObject.hasOwnProperty("objectId")) {
            //get clustered images thumbnails
            this.loadCluster(queryObject.objectId);
        } else if (queryObject.hasOwnProperty("colId")) {
            //get collection thumbnails
            this.loadCollection(queryObject.colId, 1, 24);
        } else {
            console.log("don't know what to query!");
        }
        
    }

    /**
     * Gets array of thumbnails associated to objectId
     * @param objectId Object Id for which to retrieve image results
     * @param colId Collection Id in which the Object resides
     */
    loadAssociatedAssets(objectId: string, colId: string) {
        // this.getAssociated(objectId, colId, this.pagination.currentPage, this.pagination.pageSize)
        this.getAssociated(objectId, colId, 1, 24)
            .then((data) => {
                if (!data) {
                throw new Error("No data in image group thumbnails response");
                }
                // this.results = data.thumbnails;
                this.allResultsSource.next(data.thumbnails);
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
        this.getFromIgId(igId)
            .then((data) => {
                if (!data) {
                throw new Error("No data in image group thumbnails response");
                }
                // this.allResultsSource = data.thumbnails;
                //notify allResults observers
                this.allResultsSource.next(data.thumbnails);
                console.log(this.allResultsSource);
            })
            .catch((error) => {
                console.log(error);
            });
    }

    /**
     * Loads thumbnails from a collectionType
     * @param colId Collection Id for which to fetch results
     */
    loadCollection(colId: string, currentPage?: number, pageSize?: number) {
        // this.getCollectionThumbs(colId, currentPage, pageSize)
        this.getCollectionThumbs(colId, currentPage, pageSize)
            .then((data) => {
                console.log(data);
                // this.results = data.thumbnails;
                this.allResultsSource.next(data.thumbnails);
                }
            )
            .catch(error => {
                console.log(error);
            });
    }

    loadCluster(objectId){
        // this.searchLoading = true;
        this.cluster(objectId, {
                index : 0,
                label : 'Relevance'
            }, {
                currentPage: 1,
                pageSize: 24
            })
            .then((res) => {
                console.log(res);
                // this.pagination.totalPages = this.setTotalPages(res.count);
                // this.results = res.thumbnails;
                // this.searchLoading = false;
                if (res.thumbnails) {
                    this.allResultsSource.next(res.thumbnails);
                } else {
                    throw new Error("There are no thumbnails. Server responsed with status " + res.status);
                }
                
            })
            .catch(function(err) {
                // this.errors['search'] = "Unable to load cluster results.";
                // this.searchLoading = false;
                console.log(err);
            });
    }

    cluster(objectId: string, sortIndex, pagination) {
        let options = new RequestOptions({ withCredentials: true });
        let startIndex = ((pagination.currentPage - 1) * pagination.pageSize) + 1;

        //sortIndex was tacked onto this before, but the call was not working
        let requestString = [this._auth.getUrl(), "cluster", objectId, "thumbnails", startIndex, pagination.pageSize].join("/");
        console.log(requestString);
        //  + '/cluster/' + objectId + '/thumbnails/' + startIndex + '/' + pagination.pageSize + '/' + sortIndex

        return this.http
            .get(requestString, options)
            .toPromise()
            .then(this.extractData);
    }

    category(id) {
        let options = new RequestOptions({ withCredentials: true });

        return this.http
            .get(this._auth.getUrl() + '/collections/' + id + '/categoryroot', options)
            .toPromise()
            .then(this.extractData);
    }

    /**
     * Get Collection
     * @param colId id of collection to fetch
     * @returns thumbnails of assets for a collection, and collection information
     */
    getCollectionThumbs(colId: string, pageNo?: number, pageSize?: number) {
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
     * Term List Service
     * @returns       Returns the Geo Tree Object used for generating the geofacets tree.
     */

    termList(){
        let options = new RequestOptions({ withCredentials: true });
        
        return this.http
            .get(this._auth.getUrl() + '/termslist/', options)
            .toPromise()
            .then(this.extractData);   
    }

    /**
     * Search assets service
     * @param term          String to search for.
     * @param filters       Array of filter objects (with filterGroup and filterValue properties)
     * @param sortIndex     An integer representing a type of sort.
     * @param pagination    Object with properties currentPage and pageSize
     * @param dateFacet     Object with the dateFacet values
     * @returns       Returns an object with the properties: thumbnails, count, altKey, classificationFacets, geographyFacets, minDate, maxDate, collTypeFacets, dateFacets
     */

    search(term, filters, sortIndex, pagination, dateFacet) {
        let keyword = encodeURIComponent(term);
        let options = new RequestOptions({ withCredentials: true });
        let startIndex = ((pagination.currentPage - 1) * pagination.pageSize) + 1;
        let thumbSize = 0;
        let type = 6;
        let colTypeIds = '';
        let classificationIds = '';
        let geographyIds = '';

        let earliestDate = '';
        let latestDate = '';

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
            .get(this._auth.getUrl() + '/search/' + type + '/' + startIndex + '/' + pagination.pageSize + '/' + sortIndex + '?' + 'type=' + type + '&kw=' + keyword + '&origKW=&geoIds=' + geographyIds + '&clsIds=' + classificationIds + '&collTypes=' + colTypeIds + '&id=all&name=All%20Collections&bDate=' + earliestDate + '&eDate=' + latestDate + '&dExact=&order=0&isHistory=false&prGeoId=&tn=1', options)
            .toPromise()
            .then(this.extractData);
    }

    getCollections() {
        let options = new RequestOptions({ withCredentials: true });
        // Returns all of the collections names
        return this.http
            .get(this._auth.getUrl() + '/institutions/', options)
            .toPromise()
            .then(this.extractData);
    }

    /**
     * Gets thumbnails from image group Id
     * @param groupId Id of desired image group
     * @returns Promise, which is resolved with thumbnail data object
     */
    getFromIgId(groupId: string) {
        let header = new Headers({ 'Content-Type': 'application/json' }); // ... Set content type to JSON
        let options = new RequestOptions({ headers: header, withCredentials: true }); // Create a request option

        return this.http
            .get(this._auth.getUrl() + "/imagegroup/" + groupId + "/thumbnails", options)
            .toPromise()
            .then((data) => { return this.extractData(data); });
    }

    /**
     * Get associated images
     * @param objectId The id of the object for which you want associated items
     * @param colId The id of the collection from which the asset came
     * @param pageNum Value for pagination
     * @param pageSize How many thumbnails per page
     */
    getAssociated(objectId: string, colId: string, pageNum: number, pageSize: number) {
        let header = new Headers({ 'Content-Type': 'application/json' }); // ... Set content type to JSON
        let options = new RequestOptions({ headers: header, withCredentials: true }); // Create a request option
        let requestRoute: string = this._auth.getUrl() + "/" + ["collaboratoryfiltering", objectId, "thumbnails", pageNum, pageSize].join("/") + "?collectionId=" + colId;
        console.log(requestRoute);

        return this.http
            .get(requestRoute, options)
            .toPromise()
            .then((data) => { return this.extractData(data); });
    }
 
 
}