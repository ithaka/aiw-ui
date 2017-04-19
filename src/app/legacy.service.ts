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
              case "imagegroup":
                console.log("routing to image group")
                this._router.navigate(["group", pipeArr[2]])
                break
              case "search":
                console.log("searching...")
                // console.log(pipeArr)
                this.splitParams(pipeArr[7])
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

  private splitParams(params: string) {

    // for handling geography ids
    let geoRe = /geoIds3D(.*?(?=26))/
    let geoIds = geoRe.exec(params)[1].split("2C")
    console.log("Geo", geoIds)

    // for handling classifications
    let clsRe = /clsIds3D(.*?(?=26))/
    let clsIds = clsRe.exec(params)[1].split("2C")
    console.log("Class", clsIds)
    // this.unUrlIds(clsIds)
    // console.log(match[1].split("2C"))
  }
}