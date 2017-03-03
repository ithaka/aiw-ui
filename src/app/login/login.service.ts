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

    constructor(private _router: Router, private _auth: AuthService, private http: Http, locker: Locker ){
    }

    /**
     * Logs out and redirects the user to the login component
     */
    logout() {
        let options = new RequestOptions({ withCredentials: true });
        // this.user = {};
        this._auth.clearStorage();
        this._router.navigate(['login']);
        return this.http
            .post(this._auth.getUrl() + '/logout', {}, options)
            .toPromise()
            .catch(function() {
                // error handling
            });
    }
    
    /**
     * Logs user in
     * @param user User must have username (which is an email address) and password to be passed in the request
     */
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
        let url = 'http://' + this._auth.getSubdomain() + '.artstor.org/library/institutions/?_method=shibbolethOnly';
        
        return this.http
            .get(url, options)
            .toPromise()
            .then(this._auth.extractData);
    }

    pwdReset(email: string) {
        let options = new RequestOptions({ withCredentials: true });
        
        return this.http
            .get('http://' + this._auth.getSubdomain() + '.artstor.org/library/lostpw/123?email=' + email + '&portal=ARTstor', options)
            .toPromise()
            .then(this._auth.extractData);
    }

  /** 
   * This is the same call we use in canActivate to determine if the user is IP Auth'd
   * @returns json which should have 
   */
  public getIpAuth(): Observable<any> {
    let options = new RequestOptions({ withCredentials: true });
    return this.http.get(this._auth.getUrl() + "/userinfo", options)
        .map((res) => {
            return res.json() || {};
        });
  }
}