import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate } from "@angular/router";

@Injectable()
export class JSTORRedirect implements CanActivate {
  canActivate(route: ActivatedRouteSnapshot) {
    console.log('JSTORRedirect');
    console.log(route);
    return true;
  }
}