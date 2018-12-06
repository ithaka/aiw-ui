/** This service is to wrap any usage of document with a check of if is a browser-based client
 * for the success of server side rendering
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

  public utilElementById(id: string) : Element {
    if (this.isBrowser) {
      return document.getElementById(id);
    }
  }

  public utilElementsByTagName(tagName: string) : NodeListOf<Element> {
    if (this.isBrowser) {
      return document.getElementsByTagName(tagName);
    }
  }

  public utilElementsByClassName(className: string) : NodeListOf<Element> {
    if (this.isBrowser) {
      return document.getElementsByClassName(className);
    }
  }

}
