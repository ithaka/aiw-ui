import { Router } from '@angular/router'
import { Component, OnInit, EventEmitter, Input, Output, ElementRef, ViewChild } from '@angular/core'
import { Location } from '@angular/common'
import { map, take } from 'rxjs/operators'

// Project Dependencies
import { AuthService, DomUtilityService } from '_services'

@Component({
  selector: 'ang-access-denied-modal',
  templateUrl: 'access-denied.component.pug'
})
export class AccessDeniedModal implements OnInit {
  @Input() public showSkipAsset: boolean
  @Output() skipAsset: EventEmitter<any> = new EventEmitter()
  @Output() exitFullScreen: EventEmitter<any> = new EventEmitter()

  @Output() closeModal: EventEmitter<any> = new EventEmitter()

  @ViewChild("modal", {read: ElementRef}) modalElement: ElementRef;

  public isLoggedIn: boolean
  public promptCopy: string = ''

  constructor(
    private _auth: AuthService,
    private _dom: DomUtilityService,
    private _router: Router,
    private location: Location
  ) { }

  ngOnInit() {
    // Set focus to the modal to make the links in the modal first thing to tab for accessibility
    // let htmlelement: HTMLElement = <HTMLElement>this._dom.byId('modal');
    // htmlelement.focus()
    if (this.modalElement && this.modalElement.nativeElement){
      this.modalElement.nativeElement.focus()
    }

      this._auth.currentUser.pipe(
      take(1),
      map(user => {
        this.isLoggedIn = user.isLoggedIn

        if (this.isLoggedIn) {
          // Logged In
          this.promptCopy = 'ACCESS_DENIED_MODAL.USER_AUTH.PROMPT'
        } else if (user.status) {
          // IP Auth
          this.promptCopy = 'ACCESS_DENIED_MODAL.IP_AUTH.PROMPT'
        } else {
          this.promptCopy = 'ACCESS_DENIED_MODAL.NO_AUTH.PROMPT'
        }
      },
      (err) => {
        console.error('Failed to load Institution information', err)
      }
    )).subscribe()
  }

  /**
   * Set aside our current/intended path so the user can return
   */
  stashThenRoute(routeValue: string) {
    this._auth.store('stashedRoute', this.location.path(false))
    this._router.navigate([routeValue]);
  }
}
