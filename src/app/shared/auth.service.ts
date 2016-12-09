import { Injectable } from '@angular/core';
import { Locker } from 'angular2-locker';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import {
  CanActivate,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot
} from '@angular/router';

/**
 * Controls authorization through IP address and locally stored user object
 */

@Injectable()
export class AuthService implements CanActivate {
  private _storage;
  private baseUrl;
  // Use header rewrite proxy for local development
  private proxyUrl = 'http://rocky-cliffs-9470.herokuapp.com/api?url=';
  
  constructor(private _router:Router, locker:Locker, private http: Http) {
    this._storage = locker;
    this._router = _router;
    
    // Check domain
    console.log(document.location.hostname);
    if ( document.location.hostname.indexOf('test.cirrostratus.org') > -1 ) {
      this.baseUrl = '//library-debian01.test.cirrostratus.org:8080/library/secure';
    } else {
      this.baseUrl =  this.proxyUrl + 'http://library.artstor.org/library/secure';
    }
  }

  /**
   * Encodes javascript object into a URI component
   * @param obj The object to be encoded
   */
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

  /**
   * Takes a response object and turn the data into an object
   */
  public extractData(res: Response): any {
      let body = res.json();
      return body || { };
  }

  public getProxyUrl(): string {
    return this.proxyUrl;
  }
  
  public getUrl(): string {
    return this.baseUrl;
  }

  /**
   * Saves user to local storage
   * @param user The user should be an object to store in sessionstorage
   */
  public saveUser(user: any) {
    //should have session timeout, username, baseProfileId, typeId
    this._storage.set('user', user);
  }

  //TODO create deleteUser object

  /**
   * Gets user object from local storage
   */
  public getUser() : any {
      return this._storage.get('user');
  }

  /**
   * Checks to see if user is either authorized by login or IP auth'd
   * @returns indicates whether or not user is authorized
   */
  isAuthenticated(): boolean {
    if (this.getUser() === null || this.getUser() === {}) {
      this.getUserInfo()
        .then(
          (data)  => {
            if (data.status === true) {
              // User is IP auth'd!
              this.saveUser(data);
            } else {
              return false;
            }
          },
          (error) => {
            console.log(error);
            return false;
          }
        ).catch(function(err) {
          console.log(err);
          return false;
        });
    } else {
      return true;
    }
  }

  /**
   * Required by implementing CanActivate, and is called on routes which are protected by canActivate: [AuthService]
   */
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    let authenticated: boolean  = this.isAuthenticated();
    if (!authenticated) {
      this._router.navigate(["login"]);
    }

    return authenticated;
  }

  /**
   * Retrieves user info from server
   * @returns a user object or an empty object
   */
  getUserInfo() {
    let options = new RequestOptions({ withCredentials: true });
    return this.http
      .get(this.getUrl() + '/userinfo', options)
      .toPromise()
      .then(this.extractData);
  }
}