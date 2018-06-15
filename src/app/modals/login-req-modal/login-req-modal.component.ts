import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs/Observable';

import { AuthService, ToolboxService } from './../../shared';

@Component({
  selector: 'ang-login-req-modal',
  templateUrl: 'login-req-modal.component.pug',
  styles: [`
    .modal {
      display: block;
    }
  `]
})
export class LoginReqModal implements OnInit {
  private ipAuthed: boolean = false
  /** Meant only to trigger display of modal */
  @Output()
  private closeModal: EventEmitter<any> = new EventEmitter();

  constructor(private _router: Router, private _auth: AuthService, private route: ActivatedRoute, private _tool: ToolboxService, private location: Location) { }

  ngOnInit() { }

  goToLogin() {
    // could utilize RouteReuseStrategy here

    this._auth.store("stashedRoute", this.location.path(false));

    this._router.navigate(['/login']);
  }

  test() {
    this._router.navigateByUrl(this._auth.getFromStorage("stashedRoute"));
  }

}
