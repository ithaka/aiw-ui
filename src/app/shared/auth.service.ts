import { Injectable } from '@angular/core';
import { Locker } from 'angular2-locker';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import {
  CanActivate,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot
} from '@angular/router';

@Injectable()
export class AuthService implements CanActivate {
  private _storage;
  
  // Use header rewrite proxy for local development
  private proxyUrl = 'http://rocky-cliffs-9470.herokuapp.com/api?url=';
  private baseUrl = this.proxyUrl + 'http://library.artstor.org/library/secure';

  constructor(private _router:Router, locker:Locker, private http: Http) {
    this._storage = locker;
    this._router = _router;
  }

  public formEncode(obj: Object): string {
      var encodedString = '';
      for (var key in obj) {
          if (encodedString.length !== 0) {
              encodedString += '&';
          }
          encodedString += key + '=' + encodeURIComponent(obj[key]);
      }
      return encodedString.replace(/%20/g, '+');
  }

  public extractData(res: Response): Object {
      let body = res.json();
      return body || { };
  }

  public getProxyUrl(): string {
    return this.proxyUrl;
  }
  
  public getUrl(): string {
    return this.baseUrl;
  }

  public saveUser(user: any) {
        this._storage.set('user', user); 
  }

  public getUser() : any {
      return this._storage.get('user');
  }

  // Check user authentication
  isAuthenticated(): boolean {
    if (this.getUser() === null || this.getUser() === {}) {
      this.getUserInfo()
        .then(
          data  => function(data) {
            console.log(data);
          },
          error =>  function(error) {

          }
        ).catch(function(err) {
          // 
        });

    } else {
      return true;
    }
    return true;
  }

  //route guard
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    let authenticated: boolean  = this.isAuthenticated();
    if (!authenticated) {
      this._router.navigate(["login"]);
    }

    return authenticated;
  }

  getUserInfo() {
    let options = new RequestOptions({ withCredentials: true });
    return this.http
      .get(this.getUrl() + '/userinfo', options)
      .toPromise()
      .then(this.extractData);
  }
}