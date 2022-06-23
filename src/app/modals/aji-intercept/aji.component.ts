import { Component, OnInit, Output, EventEmitter } from '@angular/core'


@Component({
  selector: 'ang-aji-intercept-modal',
  templateUrl: 'aji.component.pug',
  styleUrls: [ 'aji.component.scss' ]
})
export class AJIInterceptModal implements OnInit {
  @Output()
  closeModal: EventEmitter<number> = new EventEmitter();

  constructor(
  ) { }

  ngOnInit() { }

  public dismissModal(): void {
    this.closeModal.emit()
  }
}
