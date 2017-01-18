import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';

import { AuthService } from './../../shared';

@Component({
  selector: 'ang-login-req-modal',
  templateUrl: 'login-req-modal.component.html',
  styles: [`
    .modal {
      display: block;
    }
  `]
})
export class LoginReqModal implements OnInit {
  /** Meant only to trigger display of modal */
  @Output()
  private closeModal: EventEmitter<any> = new EventEmitter();

  constructor(private _router: Router, private _auth: AuthService) { }

  ngOnInit() {
  }

  goToLogin() {
    // save user info here
    

    this._router.navigate(['/login']);
  }

}