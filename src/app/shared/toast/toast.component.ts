import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core'

import { Toast, ToastService } from 'app/_services';
import { Router } from '@angular/router';
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
   * Google Analytics for clicking "Go to group" lin from toast
   */
  TrackGotoGroupToast() {
    let fromWhich: string
    let toWhich: string

    // Identify if user is adding image from asset page or browse page
    if (this.router.url.indexOf('/asset/') > -1) {
      fromWhich = 'asset'
    } else {
      fromWhich = 'browse'
    }

    // Identify if user is saving image to existing group or creating a new one
    if (this.toast.id === 'addToGroup') {
      toWhich = 'existing group'
    } else {
      toWhich = 'new group'
    }
    
    this._angulartics.eventTrack.next({ properties: { event: 'gotogroupToast', category: 'groups', label: [fromWhich, toWhich] }})

  }

  ngOnDestroy() {
  }
}
