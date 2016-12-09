import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
// import { HttpModule } from '@angular/http';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Rx';
// import { LocalStorage, SessionStorage } from "angular2-localstorage/WebStorage";
import 'rxjs/add/operator/toPromise';

import { Locker } from 'angular2-locker';
// import { CoolLocalStorage } from 'angular2-cool-storage';

export class User {
  constructor(
    public username: string,
    public password: string) { }
}
 
@Injectable()
export class LoginService {

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

    public saveUser(user: any) {
        this._storage.set('user', user); 
    }

    public getUser() : any {
        return this._storage.get('user');
    }

    logout() {
        // this.user = {};
        this._storage.remove('user');
        this._router.navigate(['Login']);
        return this.http
            .post(this.baseUrl + '/logout', {})
            .toPromise()
            .catch(function() {
                // error handling
            });
    }
    
    login(user: User) {
        let header = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded' }); // ... Set content type to JSON
        let options = new RequestOptions({ headers: header, withCredentials: true }); // Create a request option
        let data = this.formEncode({ 
                'j_username': user.username, 
                'j_password': user.password 
            });

        return this.http
            .post(this.baseUrl + '/login', data, options)
            .toPromise()
            .then(this.extractData);
    }

    getLoginError(user: User) {
        let header = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded' }); // ... Set content type to JSON
        let options = new RequestOptions({ headers: header, withCredentials: true }); // Create a request option

        return this.http
            .get(this.baseUrl + '/login?j_username=' + encodeURIComponent(user.username) + '&j_password=' + encodeURIComponent(user.password) )
            .toPromise()
            .then(this.extractData);
    }

    getInstitutions() {
        // http://library.artstor.org/library/institutions/?_method=shibbolethOnly&dojo.preventCache=1479750011351
        let header = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded' }); // ... Set content type to JSON
        let options = new RequestOptions({ headers: header, withCredentials: true });
        let url = this.proxyUrl + 'http://library.artstor.org/library/institutions/?_method=shibbolethOnly';
        
        return this.http
            .get(url)
            .toPromise()
            .then(this.extractData);
    }

    pwdReset(email: string) {
        let options = new RequestOptions({ withCredentials: true });
        
        return this.http
            // .get(this.baseUrl + '/lostpw/123?email=' + email + '&portal=ARTstor', options)
            .get('http://rocky-cliffs-9470.herokuapp.com/api?url=http://library.artstor.org/library/lostpw/123?email=' + email + '&portal=ARTstor', options)
            .toPromise()
            .then(this.extractData);
    }
}