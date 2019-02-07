/** This service is to wrap any usage of document with a check of if is a browser-based client
 * for the success of server side rendering
 * - This should only be used as a last resort, preferring these Angular helpers first:
 *   ElementRef - https://angular.io/api/core/ElementRef
 *   ViewChild - https://angular.io/api/core/ViewChild
 *   Renderer - https://angular.io/api/core/Renderer2
 */
import { Injectable, Inject, PLATFORM_ID } from '@angular/core'
import { isPlatformBrowser } from '@angular/common'

@Injectable({
  providedIn: 'root'
})
export class DomUtilityService {

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  // Is this code being interpretted by a browser-based client?
  private isBrowser: boolean = isPlatformBrowser(this.platformId)

  /**
   * byId
   * @param id - string
   * @returns an Element object representing the element
   * whose id property matches the specified string
   *
   */
  public byId(id: string): HTMLElement {
    if (this.isBrowser) {
      return document.getElementById(id);
    }
  }

  /**
   * byTagName
   * @param tagName - string
   * @returns HTMLCollection (array) of elements with the given tag name
   *
   */
  public byTagName(tagName: string) {
    if (this.isBrowser) {
      return document.querySelector(tagName);
    }
  }

  /**
   * byClassName
   * @param className - string
   * Can be called on any element, not only on the document.
   * The element on which it is called will be used as the root of the search.
   * @returns an array-like object of all child elements which have all of the given class names
   *
   */
  public byClassName(className: string) {
    if (this.isBrowser) {
      return document.getElementsByClassName(className);
    }
  }

  /**
   * bySelector
   * @param selectorName string
   * @returns the first Element within the document that matches the specified selector,
   * If no matches are found, null is returned.
   */

  public bySelector(selectorName: string) {
    if (this.isBrowser) {
      return document.querySelector(selectorName)
    }
  }

  /**
   * bySelectorAll
   * @param selectorName string
   * @returns NodeList (array) containing one Element object for each element that matches
   * at least one of the specified selectors or an empty NodeList in case of no matches.
   */
  public bySelectorAll(selectorName) {
    if (this.isBrowser) {
      return document.querySelectorAll(selectorName)
    }
  }

  public append(parent, child) {
    if (parent && parent.hasOwnProperty('appendChild')) {
      return parent.appendChild(parent, child)
    }
    else {
      console.log('Unable to append ', child, ' to element ', parent)
    }

  }

  public create(type) {
    return document.createElement(type)
  }

  public setCookie(value) {
    return document.cookie = value
  }

}
