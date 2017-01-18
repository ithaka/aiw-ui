import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
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

  constructor(private _router: Router, private _auth: AuthService, private route: ActivatedRoute) { }

  ngOnInit() {
  }

  goToLogin() {
    // save user info here
    let newUrl = this.route.snapshot;
    // let newUrl = [this.route.snapshot.params]

    let stringUrl: string;
    let urlArr: string[] = [];
    this.route.snapshot.url.forEach((segment) => {
      urlArr.push(segment.path);
    });
    stringUrl = "/" + urlArr.join("/");

    // console.log(stringUrl);

    // console.log(this._router.routerState.snapshot);
    this._auth.store("stashedRoute", stringUrl);

    this._router.navigate(['/login']);
  }

  test() {
    this._router.navigateByUrl(this._auth.getFromStorage("stashedRoute"));
  }

}