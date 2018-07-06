import { Component, OnInit, Output, EventEmitter } from '@angular/core'
import { Router } from '@angular/router'
import { Location } from '@angular/common'

import { AuthService } from './../../shared/auth.service'

@Component({
  selector: 'ang-session-expire-modal',
  templateUrl: 'session-expire.component.pug'
})
export class SessionExpireModal implements OnInit {
  @Output()
  closeModal: EventEmitter<any> = new EventEmitter()

  constructor(
    private _router: Router,
    private _auth: AuthService,
    private location: Location
  ) { }

  ngOnInit() {
    document.cookie = "featureflag=; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
  }

  /**
   * Set aside our current/intended path so the user can return
   */
  stashThenRoute(routeValue: string) {
    this._auth.store("stashedRoute", this.location.path(false))
    this._router.navigate([routeValue])
  }

  goToHome(): void {
    this.closeModal.emit()
    this._router.navigate(['/home'])
  }
}
