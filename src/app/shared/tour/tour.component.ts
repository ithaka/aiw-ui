import { Component, Input, OnInit, PLATFORM_ID, Inject  } from '@angular/core'
// TO-DO: Import driver only on the clientside
// Maybe use their CDN? https://github.com/kamranahmedse/driver.js
import * as Driver from '../../../../node_modules/driver.js/dist/driver.min.js'
import { Router, NavigationStart } from '@angular/router'
import { map } from 'rxjs/operators'
import { Angulartics2 } from 'angulartics2'
import { isPlatformBrowser } from '@angular/common'

// Project Dependencies
import { AuthService } from './../auth.service'
import { DomUtilityService } from '../../shared'

@Component({
    selector: 'ang-guide-tour',
    templateUrl: 'tour.component.pug',
    styleUrls: ['./tour.component.scss']
  })
  export class GuideTourComponent {
    public startModalShow: boolean = false

    @Input() public steps: TourStep[]

    private driver: any
    private isBrowser

    constructor(
      private _auth: AuthService,
      private _dom: DomUtilityService,
      private _ga: Angulartics2,
      private router: Router,
      @Inject(PLATFORM_ID) private platformId: Object
    ){
      this.isBrowser = isPlatformBrowser(platformId)

      router.events.pipe(
      map(event => {
        // End the tour when go to another page with browser's forward and backward button
        if (event instanceof NavigationStart) {
          if (this.driver){
            this.driver.reset()
          }
        }
      })).subscribe()
    }

    // Initialize and start image group tour
    public startTour() {
      this.startModalShow = false
      this._ga.eventTrack.next({ properties: { event: 'beginTour', category: 'groups', label: 'imageGroupTour' } })

        if (this.isBrowser) {
          this.driver = new Driver({
          allowClose: false,
          closeBtnText: 'exit tour',
          nextBtnText: 'NEXT',
          prevBtnText: 'BACK',
          doneBtnText: 'GOT IT, THANKS!',
          onHighlightStarted: (Element) => {

            Element.node.scrollIntoView({block: 'center', inline: 'nearest'})

            // Change the tabIndex of the brand label and links in the login box to ensure if there is tour, the links of the tour is first to be tabbed for accessibility
              this.manipulateDom('className', 'navbar-brand', 6)
              this.manipulateDom('id', 'nav-setting', 7)
              this.manipulateDom('id', 'nav-logout', 7)
              this.manipulateDom('id', 'nav-login', 7)
              this.manipulateDom('id', 'nav-register', 7)
              this.manipulateDom('id', 'driver-popover-item', -1, true)

            // Remove the back button on the first popover
            if (Element.options.step === 1) {
              let el: HTMLElement = <HTMLElement><any>(this._dom.byClassName('driver-prev-btn')[0])
                if (el)
                  el.classList.add('hidden')
            }
            else {
              let el: HTMLElement = <HTMLElement><any>(this._dom.byClassName('driver-prev-btn')[0])
              if (el) {
                el.classList.remove('hidden')
              }
            }

          },
          onHighlighted: (Element) => {
            // Disable the Element that is being highlighed
            if (Element.node.classList[0] === 'btn') Element.node.disabled = true
            else Element.node.offsetParent.disabled = true

            // Set tabIndex and aria-label of the tour elements for accessibility
            this.manipulateDom('className', 'driver-close-btn', 5, false, 'aria-label', 'close button')
            this.manipulateDom('className', 'driver-prev-btn', 4, false, 'aria-label', 'previous button')
            this.manipulateDom('className', 'driver-next-btn', 3, false, 'aria-label', 'next button')
            this.manipulateDom('className', 'driver-popover-description', 2, false)

            // Set focus on the title of the popover, the setTimeout is necessary for the behavior to appear
            setTimeout(() =>
            {
              let el: HTMLElement = <HTMLElement><any>(this._dom.byClassName('driver-popover-title')[0])
              if (el) {
                el.tabIndex = 1
                el.focus()
              }
            }, 0);
          },
          onDeselected: (Element) => {
            // Enable the element when it is not highlighted
            if (Element.node.classList[0] === 'btn') Element.node.disabled = false
            else Element.node.offsetParent.disabled = false
          },
          onReset: (Element) => {
            // Change BACK the tabIndex of the brand label and links in the login box when the tour is over
            this.manipulateDom('className', 'navbar-brand', 1)
            this.manipulateDom('id', 'nav-setting', 2)
            this.manipulateDom('id', 'nav-logout', 2)
            this.manipulateDom('id', 'nav-login', 2)
            this.manipulateDom('id', 'nav-register', 2)
          }
      })

        this.driver.defineSteps(this.steps)
        this.driver.start()
      }
    }

    /**
     * closes the modal and saves the fact that the user dismissed it
     */
    public closeTourModal(): void {
      this.startModalShow = false
    }

    /**
     * Find the element by its id or classname, and change the tabindex, set focus, or set attribute
     * Note if you choose to find by classname, this function only manipulate the first item with this classname.
     * If I allow an array of elements, the choice of focus is meaningless.
     * @param method id or className
     * @param query the id or className of the element to be found
     * @param tabIndex change or set the tabIndex of the element
     * @param focus whether to focus on this element
     * @param attrKey the attribute key if you want to set attribute to the element
     * @param attrValue the attribute value if you want to set attribute to the element
     */
    private manipulateDom ( method: string, query: string, tabIndex?: number, focus?: boolean, attrKey?: string, attrValue?: string ): HTMLElement {
      let el: HTMLElement
      if (method === 'id') {
        el = <HTMLElement>this._dom.byId(query)
      }
      else if (method === 'className') {
        el = <HTMLElement><any>(this._dom.byClassName(query)[0])
      }
      if (!el)
        return el
      if (tabIndex)
        el.tabIndex = tabIndex
      if (focus)
        el.focus()
      if (attrKey && attrValue)
        el.setAttribute(attrKey, attrValue)
      return el
    }

  }// end of class

export interface TourStep {
    step?: number
    element: string[]
    popover: {
        position?: string,
        title: string,
        description: string
    }
    onNext?: () => void
}
