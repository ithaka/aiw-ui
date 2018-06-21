import { Router } from '@angular/router'
import { Component, OnInit, EventEmitter, Input, Output } from '@angular/core'
import { Location } from '@angular/common'

// Project Dependencies
import { AuthService } from '../../shared'

@Component({
  selector: 'ang-access-denied-modal',
  templateUrl: 'access-denied.component.pug'
})
export class AccessDeniedModal implements OnInit {
  @Input() private showSkipAsset: boolean
  @Output() skipAsset: EventEmitter<any> = new EventEmitter()
  @Output() exitFullScreen: EventEmitter<any> = new EventEmitter()

  @Output() closeModal: EventEmitter<any> = new EventEmitter()

  private isLoggedIn: boolean
  private promptCopy: string = ""

  constructor(
    private _auth: AuthService,
    private _router: Router,
    private location: Location
  ) { }

  ngOnInit() {
    // Set focus to the modal to make the links in the modal first thing to tab for accessibility
    let htmlelement:HTMLElement = document.getElementById("modal");
    htmlelement.focus()

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
          console.error("Failed to load Institution information", err)
        }
      )
  }

  /**
   * Set aside our current/intended path so the user can return
   */
  stashThenRoute(routeValue: string) {
    this._auth.store("stashedRoute", this.location.path(false))
    this._router.navigate([routeValue]); 
  }
}
