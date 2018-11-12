import { Injectable } from '@angular/core'
import { Router, Resolve, RouterStateSnapshot, ActivatedRouteSnapshot } from '@angular/router'
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs'

import { AuthService } from './shared'

declare var initPath: string

@Injectable()
export class LegacyRouteResolver implements Resolve<boolean> {

  constructor(
    private _router: Router,
    private _auth: AuthService,
    private http: HttpClient
  ) {

  }

  /**
   * By implimenting Resolve, we have to have this function. The router is responsible for calling it on specified routes.
   * This is the top-level function for parsing out legacy urls (a router of sorts)
   */
  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    let url = state.url

    // Provide redirects for initPath detected in index.html from inital load
    if (initPath) {
      url = initPath
    }

    // Keep this log around: we have a lot of exceptions
    console.log('Attempting to resolve legacy url:\n', url)

    /**
     * Example URLs being handled:
     * /library/#3|search|1|Globe20Theater|Multiple20Collection20Search|||type3D3126kw3DGlobe20Theater26id3Dall26name3DAll20Collections26origKW3D (public site)
     */
    let welcomeRegExp = /(.)*welcome\.html#[0-9]$/ // If the legacy URL ends with 'welcome.html' or 'welcome.html#0'

    if (!isNaN(Number(url.substr(1, 2)))) {
      // Anchors in some old links cause some of the path to be lost
      url = '/library/welcome.html#' + url.substr(1)
    } else if (welcomeRegExp.test(url)) { 
      this._router.navigate(['/home'])
      return true
    } else if (url.indexOf('/library') == 0 || url.indexOf('/openlibrary') == 0) {
      // This is the normal expectation for old links!
    } else {
      return true
    }
    if (url.indexOf('%7C') > -1) {
      url = decodeURI(url)
    }

    let urlArr = url.split('/')
    // Paths that trail "/library" with "/" can drop the first two strings
    if (url.split('/').length > 2) {
      urlArr.splice(0, 2)
    }
    // A leading forward slash will cause an empty string on split
    if (urlArr[0].length < 1) {
      urlArr.splice(0, 1)
    }

    if (urlArr[0].substr(0, 10).toLowerCase() === 'externaliv') {
      let encryptedId = urlArr[0].split('=')[1]
      this._router.navigate(['/asset', 'external', encryptedId])

    } else if (urlArr[0] === 'secure') {
      /**
       * This breaks the query param string into an object which can be passed to the angular router
       */
      let path: string = urlArr[1]
      let queryString: string = path.substr(path.indexOf('?') + 1)
      let rawParams: string[] = queryString.split('&')
      let queryParams: { [key: string]: string } = {}
      rawParams.forEach((param) => {
        let paramArr: string[] = param.split('=')
        if (paramArr && paramArr.length > 1) {
          let key: string = paramArr[0]
          let value: string = paramArr[1]
          queryParams[key] = value
        }
      })

      let encryptedId: string = queryParams.id
      delete queryParams.id

      this._router.navigate(['/asset', 'external', encryptedId], {queryParams: queryParams})

    } else {
      let routeNum = urlArr[0].substr(0, 2)

      urlArr.forEach((value, index) => {
        urlArr[index] = decodeURIComponent(value)
      })

      let pipeArr = urlArr[0].split('|')

      // At some point, someone made pretty urls as: '/library/collection/patel'
      if (pipeArr[0] == 'collection' && urlArr[1]) {
        this._router.navigate(['/collection', urlArr[1]])
      }

      // Handling for '/library/welcome.html'
      if (pipeArr[0] == 'welcome.html') {
        this._router.navigate(['/home'])
      }

      if (pipeArr[0].indexOf('#') > 0) {
        routeNum = pipeArr[0].substr(pipeArr[0].indexOf('#'), 2)
      }
      switch (routeNum) {
        case '#2': // handles all of the #2 routes
          this._router.navigate(['/browse', 'library', { viewId: pipeArr[1] }])
          break
        case '#3': // handles all of the #3 routes
          // #3 routes are usually an array split by the pipe symbol, and the key is the second value in that array (index 1)
          if (pipeArr && pipeArr.length > 0) {
            switch (pipeArr[1]) {
              case 'categories':
                this._router.navigate(['/category', pipeArr[2]]) // the 3rd item in the array is the category id
                break
              case 'collections':
                this._router.navigate(['/collection', pipeArr[2]]) // the 3rd item in the array is the collection id
                break
              case 'imagegroup':
                this._router.navigate(['group', pipeArr[2]])
                break
              case 'search':
                let params = this.splitParams(pipeArr[7])
                // break out the term separately, just to clean up the url a little
                let term = params.term
                delete params.term
                this._router.navigate(['/search', term, params])
                break
              default:
                // we might want to provide some feedback to the user here
                console.error("we didn't find a match!")
            }
          }

          break
        default:
          console.error("we didn't find a match!")
      }
    }

    return true
  }

  /**
   * Takes the unmodified, "unhydrated" string of search params from the legacy search url and transforms it into an object that is
   *  useful to our router for navigation
   * @param params The params section of the legacy search url. Can come from different parts of the url for different search conditions
   * @returns SearchParams object which can be fed directly to the router for navigation
   */
  private splitParams(params: string): SearchParams {

    // If you're looking at old search urls, then you'll soon find out that they often urlencoded things
    //  that they didn't have to. Then, for some reason, they cut out all of the "%" symbols to make a dilapidated sort
    //  of url encoding. I call it "unhydrated" url encoding, and have a few functions in here that deal with the
    //  "rehydration" of said urls. You might find the following chart handy, if you ever have to deal with this. It is a
    //  list of common url encodings that they have dehydrated.

    // Handy chart of url encodings
    // Character	Hydrated	Dehydrated
    // [space]	  %20	      20
    // =	        %3D	      3D
    // ,	        %2C	      2C
    // &	        %26	      26
    // :	        %3A	      3A
    // -	        %2D	      2D
    // 1 digit #  %3#       3#


    // we init search with a term of * and only replace it if the query has a search term
    let searchParams: SearchParams = { term: '*' }

    // handle the keyword(s) & conditions
    // this is the only parameter that's not handled with the execRegExp
    let kwRe = /kw3D(.*?(?=26))/
    let kwMatch = kwRe.exec(params)
    if (kwMatch && kwMatch[1]) {
      searchParams.term = this.hydrateKeywordExpression(kwMatch[1])
    }

    // geography handler
    let geo = this.execRegExp(/geoIds3D(.*?(?=26))/, params)
    if (geo) { searchParams.geography = geo.join(',') }

    // classification handler
    let cls = this.execRegExp(/clsIds3D(.*?(?=26))/, params)
    if (cls) { searchParams.classification = cls.join(',') }

    // collection handler
    let col = this.execRegExp(/id3D(.*?(?=26))/, params)
    if (col && (col.indexOf('all') === -1)) { searchParams.coll = col.join(',') }

    // beginning date handler
    // bDate isn't ever a list, so we need to make sure it's a single parameter that comes back
    let bDate = this.execRegExp(/bDate3D(.*?(?=26))/, params)
    if (bDate && bDate.length == 1) { searchParams.startDate = bDate.join('') }

    // end date handler
    // eDate, like bDate, should never be an array with length more than one
    let eDate = this.execRegExp(/eDate3D(.*?(?=26))/, params)
    if (eDate && eDate.length == 1) { searchParams.endDate = eDate.join('') }

    return searchParams

  }

  /**
   * There used to be a regex handler like this for every parameter type
   * I abstracted them to execRegExp to make more robust code, but wanted to leave this here for readability and reference
   */
  // // for handling geography ids
  // let geoRe = /geoIds3D(.*?(?=26))/
  // let geoMatch = geoRe.exec(params)
  // if (geoMatch && geoMatch[1]) {
  //   let geoIds: string[] = this.hydrateUrlArr(geoMatch[1].split("2C"))
  //   if (geoIds && geoIds.length > 0) { searchParams.geography = geoIds.join(",") }
  // }

  /**
   * Check out the comment above. This function basically accomplishes that in a more robust way,
   * since everything is run through the same place
   * @param re A regular expression which should return the dehydrated string match in position 1 of the array
   * @param target The string of parameters from the old search
   * @returns Array of rehydrated strings, each of which were separated by "2C", or what should be "%2C", a urlencoded comma
   */
  private execRegExp(re: RegExp, target: string): string[] {
    let match = re.exec(target)
    if (match && match[1]) {
      let res: string[] = this.hydrateUrlArr(match[1].split('2C'))
      if (res && res.length > 0) {
        return res
      } else { return }
    }
  }

  /**
   * This function should be given a url encoded string with the % signs removed. It will put them back in and decode the string
   * @param url The dehydrated url you wish to be turned into a real string
   * @returns String that has been url decoded
   */
  private hydrateUrlString(url: string): string {
    // make sure the string really exists and is not empty
    if (url && url.length && url[0] != '') {
      // split string into array
      let strArray: string[] = url.split('')
      // cycle backward through the array
      for (let i = strArray.length - 1; i >= 0; i--) {
        // if there should be a percent sign there, put one there (that should be every 3rd character)
        if (i % 2 == 0) {
          strArray.splice(i, 0, '%')
        }
      }

      try {
        return decodeURIComponent(strArray.join(''))
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
    if (urls && urls.length && urls[0] != '') {
      // the array we'll return
      let hydrated: string[] = []
      // cycle through urls and use hydrateUrlString to convert the string individually
      urls.forEach((url) => {
        hydrated.push(this.hydrateUrlString(url))
      })
      return hydrated
    } else { return [] }
  }

  /**
   * Makes all the necessary replacements in the Keyword in order to url decode it, and returns the string as
   *  it should appear in the url for our search url schema
   * @param keywordStr This is the keyword string taken out of the legacy search params by regex
   */
  private hydrateKeywordExpression(keywordStr: string) {
    // the "search within" fields are specified with dehydrated ids so we have to water them
    let fieldRe = /7C([0-9]*)/g

    // we'll cycle through all of the matches for ids and give them a drink 💧
    let result

    while ((result = fieldRe.exec(keywordStr)) !== null) {
      if (result[1] && result[1].length > 0) {
        keywordStr = keywordStr.replace(result[1], this.hydrateUrlString(result[1]))
      }
    }

    // just make a bunch of specific replacements for badly urlencoded characters
    // then decode that sucker
    let decoded = decodeURIComponent(
      keywordStr.replace(/7C/g, '%7C')
        .replace(/23/g, '%23')
        .replace(/2C/g, '%2C')
        .replace(/20/g, '%20')
    )

    return decoded
  }
}

/**
 * The properties SearchParams correspond directly to properties in our URL schema for search, that way we can pass it
 *  straight to the router as route params
 */
interface SearchParams {
  term: string,
  geography?: string,
  classification?: string,
  coll?: string,
  startDate?: string,
  endDate?: string
}
