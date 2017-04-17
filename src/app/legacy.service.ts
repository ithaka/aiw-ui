import { Injectable } from '@angular/core'
import { Router, Resolve, RouterStateSnapshot, ActivatedRouteSnapshot } from '@angular/router'

@Injectable()
export class LegacyRouteResolver implements Resolve<boolean> {
  constructor( private _router: Router ) { }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    console.log(route, state)
    let urlArr = state.url.split("/")
    urlArr.splice(0,2)

    if (urlArr[0] === "secure") {

    } else {
      let routeNum = urlArr[0].substr(0, 2)

      urlArr.forEach((value, index) => {
        urlArr[index] = decodeURIComponent(value)
      })

      console.log(urlArr)

      let pipeArr = urlArr[0].split("|")
      console.log(pipeArr)

      switch (routeNum) {
        case "#2": // handles all of the #2 routes
          console.log("i got #2")
          this._router.navigate(["/browse", "library", { viewId: pipeArr[1] }])
          break
        case "#3": // handles all of the #3 routes
          console.log("i got #3")
          // #3 routes are usually an array split by the pipe symbol, and the key is the second value in that array (index 1)

          if (pipeArr && pipeArr.length > 0) {
            switch (pipeArr[1]) {
              case "collections":
                console.log("routing to collections")
                this._router.navigate(["/collection", pipeArr[2]]) // the 3rd item in the array is the collection id
                break
              default:
                console.log("got the default case")
            }
          }

          break
        default:
          console.log(urlArr[0].substr(0, 2))
      }
    }

    return true
  }
}