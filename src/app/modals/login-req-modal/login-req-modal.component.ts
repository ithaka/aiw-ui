import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs/Observable';

import { AuthService, ToolboxService } from './../../shared';

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

  constructor(private _router: Router, private _auth: AuthService, private route: ActivatedRoute, private _tool: ToolboxService) { }

  ngOnInit() {
  }

  goToLogin() {
    // could utilize RouteReuseStrategy here

    this._auth.store("stashedRoute", this._tool.urlToString(this.route.snapshot));

    this._router.navigate(['/login']);
  }

  test() {
    this._router.navigateByUrl(this._auth.getFromStorage("stashedRoute"));
  }

}