import { Component, OnInit, AfterViewInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core'
import { Router, RouterLink } from '@angular/router'
import { Angulartics2 } from 'angulartics2'

// Project Dependencies
import { DomUtilityService, Toast, ToastService } from '_services'
@Component({
  selector: 'ang-toast',
  templateUrl: 'toast.component.pug',
  styleUrls: [ './toast.component.scss' ]
})
export class ToastComponent implements OnInit, OnDestroy, AfterViewInit {

  @Input() public toast: Toast

  // Dismiss: Watch for changes to dismiss property
  @Input() set dismiss(dismiss: boolean) {
    if (dismiss) {
      this.animateDismiss()
    }
  }

  public stringHTML: string
  public plainText: string
  public type: string
  public hideToast: boolean
  public links: { routerLink: string[], label: string }[] = []
  public toastLiveRegion: HTMLElement

  constructor(
    private _angulartics: Angulartics2,
    public _toasts: ToastService,
    private _dom: DomUtilityService,
    private router: Router
  ) {}

  ngOnInit() {
    // Assign vars used in template
    this.stringHTML = this.toast.stringHTML
    this.type = this.toast.type
    this.links = this.toast.links
    this.plainText = this.stringHTML.replace(/<(?:.|\n)*?>/gm, '')

    // Assign text content for live region
    this.toastLiveRegion = <HTMLElement>(this._dom.byId('toast-live-region'))
    this.toastLiveRegion.textContent = 'Notification: ' + this.plainText + ' Enter control + g to go to the group or control + x to dismiss.'

    // Assign keyboard shortcut
    this.onKeydown = this.onKeydown.bind(this)
    window.addEventListener('keydown', this.onKeydown, true)  
  }

  ngAfterViewInit() {
    // Focus on the toast text when the toast appear on the page to keep it from disappearing
    let toastLinkEl = <HTMLElement>(this._dom.byId('toast-text'))
    toastLinkEl.focus()
  }	

  onKeydown(e: any) {
    // If user hits Ctrl + x, dismiss the toast
    if (e.key === 'x' && e.ctrlKey) {
      this.triggerDismiss()
    }
    // If user hits Ctrl + g, go to the first link
    else if (e.key === 'g' && e.ctrlKey) {
      this.triggerDismiss()
      this.router.navigate(this.links[0].routerLink)
    }
  }

  triggerDismiss() {
    // Remove the live region when the toast is gone
    this.toastLiveRegion.textContent = ''
    this.hideToast = true
    this._toasts.dismissToast(this.toast.id)
  }

  animateDismiss() {
    // Wait for 7 seconds before removing the toast
    setTimeout(() => {
      this.triggerDismiss()
    }, 7000)
  }

  /**
   * Google Analytics for clicking "Go to group" link from toast
   * @param routerLink property used to navigate for link being tracked
   */
  trackGoToLink(routerLink: RouterLink) {
    let fromWhich: string
    let toWhich: string
    // Identify if user is adding image from asset page or browse page
    if (this.router.url.indexOf('/asset/') > -1) {
      fromWhich = 'asset'
    } else {
      fromWhich = 'browse'
    }
    // Specific event tracking
    if (routerLink[0].indexOf('/group') >= 0) {
      // Track group events
      // Identify if user is saving image to existing group or creating a new one
      if (this.toast.id === 'addToGroup') {
        toWhich = 'existing group'
      } else {
        toWhich = 'new group'
      }
      this._angulartics.eventTrack.next({ properties: { event: 'goToGroupToast', category: 'groups', label: [fromWhich, toWhich] }})
    } else {
      // Generic link event handling
      toWhich = routerLink[0]
      this._angulartics.eventTrack.next({ properties: { event: 'goToLinkToast', category: 'browse', label: [fromWhich, toWhich] }})
    }
  }

  pauseTimer() {
    this._toasts.cancelToastTimer(this.toast.id)
  }

  resumeTimer() {
    // Set timeout so that the correct element receives focus before we make the check
    setTimeout(() => {
      if (document.activeElement.id === 'toast-link' || document.activeElement.id === 'close-toast')
        return
      // Set focus to Add to Group button
      if (this._dom.byId("addToGroupDropdown"))
        this._dom.byId("addToGroupDropdown").focus()

      // Time and disappear
      this.animateDismiss()
    }, 10)
  }

  ngOnDestroy() {
    // Remove keyboard short cut when the toast is gone
    window.removeEventListener("keydown", this.onKeydown, true)

    // Set focus to Add to Group button
    if (this._dom.byId("addToGroupDropdown"))
      this._dom.byId("addToGroupDropdown").focus()
  }
}
