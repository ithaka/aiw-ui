import { Component, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'ang-change-password-modal',
  templateUrl: 'change-password.component.pug'
})

export class ChangePasswordModal implements OnInit {

  @Output() closeModal: EventEmitter<any> = new EventEmitter()

  constructor() { }

  ngOnInit() { }

  submit() {
    
  }
}