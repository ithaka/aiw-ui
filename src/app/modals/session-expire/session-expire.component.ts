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
    private _router: Router
  ) { }

  ngOnInit() {
  }

  goToLogin(): void {
    this.closeModal.emit()
    this._router.navigate(['/login'])
  }

  goToHome(): void {
    this.closeModal.emit()
    this._router.navigate(['/home'])
  }
}
