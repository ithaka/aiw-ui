import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core'

import { Toast, ToastService } from 'app/_services';

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
  

  constructor(public _toasts: ToastService) {}

  ngOnInit() {
    // Assign vars used in template
    this.stringHTML = this.toast.stringHTML
    this.type = this.toast.type
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

  ngOnDestroy() {
  }
}
