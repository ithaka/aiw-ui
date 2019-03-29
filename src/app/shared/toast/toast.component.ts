import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core'

import { Toast, ToastService } from 'app/_services';
import { Router, RouterLink } from '@angular/router';
import { Angulartics2 } from 'angulartics2';

@Component({
  selector: 'ang-toast',
  templateUrl: 'toast.component.pug',
  styleUrls: [ './toast.component.scss' ]
})
export class ToastComponent implements OnInit, OnDestroy {
  
  @Input() public toast: Toast

  // Dismiss: Watch for changes to dismiss property
  @Input() set dismiss(dismiss: boolean) {
    if (dismiss) {
      this.animateDismiss()
    }
  }

  public stringHTML: string
  public type: string
  public hideToast: boolean
  public links: { routerLink: string[], label: string }[] = []

  constructor(
    private _angulartics: Angulartics2,
    public _toasts: ToastService,
    private router: Router
  ) {}

  ngOnInit() {
    // Assign vars used in template
    this.stringHTML = this.toast.stringHTML
    this.type = this.toast.type
    this.links = this.toast.links
  }

  triggerDismiss() {
    this._toasts.dismissToast(this.toast.id)
  }

  animateDismiss() {
    this.hideToast = true
    setTimeout(() => {
      this._toasts.dismissToast(this.toast.id, true)
    }, 500)
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

  ngOnDestroy() {
  }
}
