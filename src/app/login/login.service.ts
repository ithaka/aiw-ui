import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/toPromise';
import { Locker } from 'angular2-locker';

import { AuthService } from '../shared/auth.service';

export class User {
  constructor(
    public username: string,
    public password: string) { }
}
 
@Injectable()
export class LoginService {

    public _storage;

    constructor(private _router: Router, private _auth: AuthService, private http: Http, locker: Locker ){
        this._storage = locker;  
    }

    logout() {
        // this.user = {};
        this._storage.remove('user');
        this._router.navigate(['login']);
        return this.http
            .post(this._auth.getUrl() + '/logout', {})
            .toPromise()
            .catch(function() {
                // error handling
            });
    }
    
    login(user: User) {
        let header = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded' }); // ... Set content type to JSON
        let options = new RequestOptions({ headers: header, withCredentials: true }); // Create a request option
        let data = this._auth.formEncode({ 
                'j_username': user.username, 
                'j_password': user.password 
            });

        return this.http
            .post(this._auth.getUrl() + '/login', data, options)
            .toPromise()
            .then(this._auth.extractData);
    }

    getLoginError(user: User) {
        let header = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded' }); // ... Set content type to JSON
        let options = new RequestOptions({ headers: header, withCredentials: true }); // Create a request option

        return this.http
            .get(this._auth.getUrl() + '/login?j_username=' + encodeURIComponent(user.username) + '&j_password=' + encodeURIComponent(user.password) )
            .toPromise()
            .then(this._auth.extractData);
    }

    getInstitutions() {
        // http://library.artstor.org/library/institutions/?_method=shibbolethOnly&dojo.preventCache=1479750011351
        let header = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded' }); // ... Set content type to JSON
        let options = new RequestOptions({ headers: header, withCredentials: true });
        let url = this._auth.getProxyUrl() + 'http://library.artstor.org/library/institutions/?_method=shibbolethOnly';
        
        return this.http
            .get(url)
            .toPromise()
            .then(this._auth.extractData);
    }

    pwdReset(email: string) {
        let options = new RequestOptions({ withCredentials: true });
        
        return this.http
            .get('http://rocky-cliffs-9470.herokuapp.com/api?url=http://library.artstor.org/library/lostpw/123?email=' + email + '&portal=ARTstor', options)
            .toPromise()
            .then(this._auth.extractData);
    }
}