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

  constructor(private _router:Router, locker:Locker) {
    this._storage = locker;
    this._router = _router;
  }

  //check user authentication
  isAuthenticated(){
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