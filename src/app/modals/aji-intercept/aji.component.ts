import { Component, OnInit, Output, EventEmitter } from '@angular/core'
import { AuthService } from '_services'
import {animate, style, transition, trigger} from "@angular/animations";


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
    private _auth: AuthService,
  ) { }

  ngOnInit() { }

  public dismissModal(): void {
    this._auth.store('AJIInterceptClosed', true);
    this.closeModal.emit()
  }

  public tryItNow(): void {
    window.location.href = "https://www.jstor.org/artstor"
  }
}
