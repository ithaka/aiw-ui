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
    // fire remind me later event here => event.modal-remind-later-btn
    this._angulartics.eventTrack.next({ properties: { event: 'modal-remind-later-btn', category: 'Intercept Modal', label: "Remind Me Later Button Clicked"} });
  }

  public tryItNow(): void {
    window.open("https://www.jstor.org/artstor", '_blank')
    this.dismissModal()
    // fire try it now event here => event.modal-search-btn
    this._angulartics.eventTrack.next({ properties: { event: 'modal-search-btn', category: 'Intercept Modal', label: "Search Button Clicked"} });
  }

  public closeAji(): void {
    this.dismissModal();
    // fire modal close event here => event.modal-close-btn
    this._angulartics.eventTrack.next({ properties: { event: 'modal-close-btn', category: 'Intercept Modal', label: "AJI Modal Closed"} });
  }

  public copyGroups(): void {
    window.open("https://www.jstor.org/copygroups", '_blank')
    // copy group event here => event.modal-copy-groups-link
    this._angulartics.eventTrack.next({ properties: { event: 'modal-copy-groups-link', category: 'Intercept Modal', label: "Copy Groups Link Clicked"} });
  }
}
