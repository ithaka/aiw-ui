import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Rx';
import { Locker } from 'angular2-locker';

import 'rxjs/add/operator/toPromise';
 
@Injectable()
export class AssetService {

    public _storage;

    constructor(private _router: Router, private http: Http, locker: Locker ){
        this._storage = locker;  
    }
    
    // Use header rewrite proxy for local development
    private proxyUrl = 'http://rocky-cliffs-9470.herokuapp.com/api?url=';
     // private instance var for base url
    private baseUrl = this.proxyUrl + 'http://library.artstor.org/library/secure';
    
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

    getCollections() {
        let options = new RequestOptions({ withCredentials: true });
        // Returns all of the collections names
        return this.http
            .get(this.baseUrl + '/institutions/', options)
            .toPromise()
            .then(this.extractData);
    }
    
    // login(user: User) {
    //     var header = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded' }); // ... Set content type to JSON
    //     let options = new RequestOptions({ headers: header, withCredentials: true }); // Create a request option
    //     var data = this.formEncode({ 
    //             'j_username': user.username, 
    //             'j_password': user.password 
    //         });

    //     return this.http
    //         .post(this.baseUrl + '/login', data, options)
    //         .toPromise()
    //         .then(this.extractData)
    //         .catch(function() {
    //             // error handling
    //         });

    // }
 
 
}