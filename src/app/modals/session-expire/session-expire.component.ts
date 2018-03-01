import { Locker } from 'angular2-locker';
import { Component, OnInit, Output, EventEmitter } from '@angular/core'
import { Router } from '@angular/router'

@Component({
  selector: 'ang-session-expire-modal',
  templateUrl: 'session-expire.component.pug'
})
export class SessionExpireModal implements OnInit {
  @Output()
  closeModal: EventEmitter<any> = new EventEmitter();

  constructor(
    private _router: Router,
    private _storage: Locker
  ) { }

  ngOnInit() {
  }

  /**
   * Set aside our current/intended path so the user can return
   */
  stashThenRoute(routeValue: string) {
    this._storage.set("stashedRoute", "/" + window.location.hash)
    this._router.navigate([routeValue]); 
  }

  goToHome(): void {
    this.closeModal.emit()
    this._router.navigate(['/home'])
  }
}
