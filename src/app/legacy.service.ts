import { Injectable } from '@angular/core'
import { Router, Resolve, RouterStateSnapshot, ActivatedRouteSnapshot } from '@angular/router'

@Injectable()
export class LegacyRouteResolver implements Resolve<boolean> {
  constructor( private _router: Router ) { }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    console.log(route, state)
    let urlArr = state.url.split("/")
    urlArr.splice(0,2)
    console.log(urlArr)

    if (urlArr[0] === "secure") {

    } else {
      switch (urlArr[0].substr(0, 2)) {
        case "#2": // handles all of the #2 routes
          console.log("i got #2")
          break
        case "#3": // handles all of the #3 routes
          console.log("i got #3")
          break
        default:
          console.log(urlArr[0].substr(0, 2))
      }
    }

    return true
  }
}