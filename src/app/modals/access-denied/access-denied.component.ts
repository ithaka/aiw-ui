import { Component, OnInit, EventEmitter, Input, Output } from '@angular/core'

// Project Dependencies
import { AuthService } from '../../shared'

@Component({
  selector: 'ang-access-denied-modal',
  templateUrl: 'access-denied.component.pug'
})
export class AccessDeniedModal implements OnInit {
  @Input() private showSkipAsset: boolean
  @Output() skipAsset: EventEmitter<any> = new EventEmitter()

  @Output() closeModal: EventEmitter<any> = new EventEmitter()

  private isLoggedIn: boolean
  private promptCopy: string = ""

  constructor(
    private _auth: AuthService
  ) { }

  ngOnInit() {
      this._auth.currentUser.take(1).subscribe(
        (user) => {
          this.isLoggedIn = user.isLoggedIn

          if (this.isLoggedIn) {
            // Logged In
            this.promptCopy = "ACCESS_DENIED_MODAL.USER_AUTH.PROMPT"
          } else if (user.status) {
            // IP Auth
            this.promptCopy = "ACCESS_DENIED_MODAL.IP_AUTH.PROMPT"
          } else {
            this.promptCopy = "ACCESS_DENIED_MODAL.NO_AUTH.PROMPT"
          }
        },
        (err) => {
          console.log("Nav failed to load Institution information", err)
        }
      )
  }
}
