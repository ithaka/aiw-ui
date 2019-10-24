import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'ang-login-help-modal',
  templateUrl: './login-help-modal.component.pug',
  styles: [`
    .modal {
      display: block;
    }
  `]
})
export class LoginHelpModal {

  @Output()
  public closeModal: EventEmitter<any> = new EventEmitter();

  constructor() { }

}
