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
                console.log(this.splitParams(pipeArr[7]))
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

  private splitParams(params: string): {
    geography?: string,
    classification?: string,
    coll?: string,
    startDate?: string,
    endDate?: string
  } {

    let searchParams: {
      geography?: string,
      classification?: string,
      coll?: string,
      startDate?: string,
      endDate?: string
    } = {}

    // thought about wrapping all of these sections into a single generic function, but thought it would be less readable
    // so the pattern is pretty much the same between all of these different regex matching sections, except some end with arrays
    //  and some end with a regular string. Any way about it, the function returns an object full of strings to use in a url

    // handle the keyword(s) & conditions
    let kwRe = /kw3D(.*?(?=26))/
    let kwMatch = kwRe.exec(params)
    if (kwMatch && kwMatch[1]) {
      let keywords: string = this.parseKeywords(kwMatch[1])
      console.log(keywords)
    }

    // for handling geography ids
    let geoRe = /geoIds3D(.*?(?=26))/
    let geoMatch = geoRe.exec(params)
    if (geoMatch && geoMatch[1]) {
      let geoIds: string[] = this.hydrateUrlArr(geoMatch[1].split("2C"))
      if (geoIds && geoIds.length > 0) { searchParams.geography = geoIds.join(",") }
      // console.log("Geo", geoIds)
    }
    
    // for handling classifications
    let clsRe = /clsIds3D(.*?(?=26))/
    let clsMatch = clsRe.exec(params)
    if (clsMatch && clsMatch[1]) {
      let clsIds: string[] = this.hydrateUrlArr(clsMatch[1].split("2C"))
      if (clsIds && clsIds.length > 0) { searchParams.classification = clsIds.join(",") }
      // console.log("Class", clsIds)
    }

    // for handling collection ids
    let colRe = /id3D(.*?(?=26))/
    let colMatch = colRe.exec(params)
    if (colMatch && colMatch[1]) {
      let colIds: string[] = this.hydrateUrlArr(colMatch[1].split("2C"))
      if (colIds && colIds.length > 0) { searchParams.coll = colIds.join(",") }
      // console.log("Collection", colIds)
    }

    // handles beginning date
    let bDateRe = /bDate3D(.*?(?=26))/
    let bDateMatch = bDateRe.exec(params)
    if (bDateMatch && bDateMatch[1]) {
      let bDate: string = this.hydrateUrlString(bDateMatch[1])
      if (bDate && bDate.length > 0) { searchParams.startDate = bDate }
      // console.log("bDate", bDate)
    }

    // handles end date
    let eDateRe = /eDate3D(.*?(?=26))/
    let eDateMatch = eDateRe.exec(params)
    if (eDateMatch && eDateMatch[1]) {
      let eDate: string = this.hydrateUrlString(eDateMatch[1])
      if (eDate && eDate.length) { searchParams.endDate = eDate }
      // console.log("eDate", eDate)
    }

    return searchParams

  }

  /**
   * This function should be given a url encoded string with the % signs removed. It will put them back in and decode the string
   * @param url The dehydrated url you wish to be turned into a real string
   * @returns String that has been url decoded
   */
  private hydrateUrlString(url: string): string {
    // make sure the string really exists and is not empty
    if (url && url.length && url[0] != "") {
      // split string into array
      let strArray: string[] = url.split("")
      // cycle backward through the array
      for(let i = strArray.length - 1; i >= 0; i--) {
        // if there should be a percent sign there, put one there (that should be every 3rd character)
        if (i % 2 == 0) {
          strArray.splice(i, 0, "%")
        }
      }

      try {
        return decodeURIComponent(strArray.join(""))
      } catch (err) {
        // we know we'll get some error here about decodeURIComponent not working - we'll go ahead and ignore that
        // this happens when non-urlencoded info comes through, "allArt" for example
        return url
      }

    } else { return }
  }

  /**
   * Give this function an array of strings to run hydrateUrlString on. Returns empty array if passed an empty string
   * @param urls Array of dehydrated strings
   * @returns Array of strings that have been urldecoded
   */
  private hydrateUrlArr(urls: string[]): string[] {
    // make sure the first item in the array is a non-empty string
    if (urls && urls.length && urls[0] != "") {
      // the array we'll return
      let hydrated: string[] = []
      // cycle through urls and use hydrateUrlString to convert the string individually
      urls.forEach((url) => {
        hydrated.push(this.hydrateUrlString(url))
      })
      return hydrated
    } else { return [] }
  }

  private parseKeywords(keywordStr: string) {
    console.log(keywordStr)
    return keywordStr
  }
}