import { Router } from '@angular/router';
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'ang-register-jstor-modal',
  templateUrl: 'register-jstor-modal.component.pug'
})
export class RegisterJstorModal implements OnInit {
  /** Causes modal to be hidden */
  @Output()
  closeModal = new EventEmitter();

  constructor() { }

  ngOnInit() { }

}
