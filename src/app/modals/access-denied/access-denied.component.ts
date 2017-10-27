import { Component, OnInit, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'ang-access-denied-modal',
  templateUrl: 'access-denied.component.pug'
})
export class AccessDeniedModal implements OnInit {
  @Output() closeModal: EventEmitter<any> = new EventEmitter();

  constructor(
  ) { }

  ngOnInit() { }
}
