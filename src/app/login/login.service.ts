import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
// import { HttpModule } from '@angular/http';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Rx';
import { LocalStorage, SessionStorage } from "angular2-localstorage/WebStorage";
import 'rxjs/add/operator/toPromise';

export class User {
  constructor(
    public username: string,
    public password: string) { }
}
 
@Injectable()
export class AuthenticationService {
    
    constructor(private _router: Router, private http: Http){}
    
    // Use header rewrite proxy for local development
    private proxyUrl = 'http://rocky-cliffs-9470.herokuapp.com/api?url=';
     // private instance var for base url
    private baseUrl = this.proxyUrl + 'http://library.artstor.org/library/secure';

    @LocalStorage() public user:Object = {};
    
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

    private saveUser(res: any) {
        console.log("Save User!");
        console.log(res);
        if (res.user) {
            localStorage.setItem('user', res.user);
            this.user = res.user;
        }
        return res;
    }

    getUser() : Object {
        return localStorage.getItem('user');
    }

    logout() {
        localStorage.removeItem('user');
        this._router.navigate(['Login']);
    }
    
    login(user: User) {
        var header = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded' }); // ... Set content type to JSON
        let options = new RequestOptions({ headers: header, withCredentials: true }); // Create a request option
        var data = this.formEncode({ 
                'j_username': user.username, 
                'j_password': user.password 
            });

        return this.http
            .post(this.baseUrl + '/login', data, options)
            .toPromise()
            .then(this.extractData)
            .then(this.saveUser)
            .catch(function() {
                // error handling
            });

    }
 
   checkCredentials(){
    if (localStorage.getItem('user') === null){
        this._router.navigate(['Login']);
    }
  } 
}