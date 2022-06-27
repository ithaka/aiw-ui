import { Component, OnInit, Output, EventEmitter } from '@angular/core'
import { AuthService } from '_services'


@Component({
  selector: 'ang-aji-intercept-modal',
  templateUrl: 'aji.component.pug',
  styleUrls: [ 'aji.component.scss' ]
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
