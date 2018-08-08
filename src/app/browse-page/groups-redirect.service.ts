import { Injectable } from '@angular/core'
import { Router, Resolve, RouterStateSnapshot, ActivatedRouteSnapshot } from '@angular/router'

@Injectable()
export class GroupsRouteResolver implements Resolve<boolean> {

  constructor(
    private _router: Router,
  ) {

  }

  /**
   * By implimenting Resolve, we have to have this function. The router is responsible for calling it on specified routes.
   * Top-level function for parsing out old browse group urls
   */
  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    let browseGroupQueryParams: any = Object.assign({}, route.queryParams);
    if(!browseGroupQueryParams.level && route.params['level']){
        browseGroupQueryParams['level'] = route.params['level']
    }
    this._router.navigate(['/browse/groups'], { queryParams: browseGroupQueryParams })
    return true
  }
    
}

