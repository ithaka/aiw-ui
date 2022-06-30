import { Component, OnInit, Output, EventEmitter } from '@angular/core'
import { AuthService } from '_services'
import {animate, state, style, transition, trigger} from "@angular/animations";


@Component({
  selector: 'ang-aji-intercept-modal',
  templateUrl: 'aji.component.pug',
  styleUrls: [ 'aji.component.scss' ],
  animations: [
    trigger('fade', [
      state('void', style({opacity: 0})),
      transition(':enter, :leave', [
        animate(2000)
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
