import { Component, OnInit, Output, EventEmitter } from '@angular/core'
import { AccountService, AuthService } from '_services'
import {animate, style, transition, trigger} from "@angular/animations"
import { map, take } from 'rxjs/operators';
import {Angulartics2} from "angulartics2";


@Component({
  selector: 'ang-aji-intercept-modal',
  templateUrl: 'aji.component.pug',
  styleUrls: [ 'aji.component.scss' ],
  animations: [
    trigger("slideIn", [
      transition(":enter", [
        style({opacity: 0, transform: "translateY(-10%)"}), //apply default styles before animation starts
        animate(
          "1000ms ease-in-out",
          style({opacity: 1, transform: "translateY(0%)"})
        )
      ]),
      transition(":leave", [
        style({opacity: 1, transform: "translateY(0%)"}), //apply default styles before animation starts
        animate(
          "750ms ease-in-out",
          style({opacity: 0, transform: "translateY(-10%)"})
        )
      ])
    ])
  ]
})
export class AJIInterceptModal implements OnInit {
  @Output()
  closeModal: EventEmitter<number> = new EventEmitter();

  constructor(
    private _auth: AuthService, private _account: AccountService, private _angulartics: Angulartics2
  ) { }

  ngOnInit() { }

  public updateUser(updateUser) {
    this._account.update(updateUser).pipe(
      take(1),
      map(res => {
        this._auth.saveUser(updateUser)
      },
        err => {
          console.error(err)
        }
      )).subscribe()
  }

  public dismissModal(): void {
    this._auth.store('AJIInterceptClosed', true);
    this.closeModal.emit()
    let updateUser = this._auth.getUser()
    updateUser.showAJIModalOrBanner = "banner_only"
    this.updateUser(updateUser)
  }

  public remindMeLater(): void {
    this._auth.store('AJIInterceptClosed', true);
    this.closeModal.emit()
    let updateUser = this._auth.getUser()
    updateUser.showAJIModalOrBanner = "remind_later"
    this.updateUser(updateUser)
    this._angulartics.eventTrack.next({ properties: { event: 'aji modal banner', category: 'onboarding', label: "modal-remind-later-btn"} });
  }

  public tryItNow(): void {
    window.open("https://www.jstor.org/artstor", '_blank')
    this.dismissModal()
    this._angulartics.eventTrack.next({ properties: { event: 'aji modal banner', category: 'onboarding', label: "modal-search-btn"} });
  }

  public closeAji(): void {
    this.dismissModal();
    this._angulartics.eventTrack.next({ properties: { event: 'aji modal banner', category: 'onboarding', label: "modal-close-btn"} });
  }

  public copyGroups(): void {
    window.open("https://www.jstor.org/copygroups", '_blank')
    this._angulartics.eventTrack.next({ properties: { event: 'aji modal banner', category: 'onboarding', label: "modal-copy-groups-link"} });
  }
}
