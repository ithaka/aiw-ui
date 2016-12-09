import { Injectable } from '@angular/core';
import { Locker } from 'angular2-locker';
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
  // private instance var for base url
  private baseUrl = this.proxyUrl + 'http://library.artstor.org/library/secure';
  

  constructor(private _router:Router, locker:Locker) {
    this._storage = locker;
    this._router = _router;
  }
  

  //check user authentication
  isAuthenticated(): boolean {
    if (this._storage.get('user') === null || this._storage.get('user') === {}) {
      return false;
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

  //TODO build in observable for authentication state
}