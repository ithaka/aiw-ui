import { Component, OnInit, Output, EventEmitter } from '@angular/core'
import { Router } from '@angular/router'
import { Location } from '@angular/common'

// Project Dependencies
import { AuthService } from '_services'

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
