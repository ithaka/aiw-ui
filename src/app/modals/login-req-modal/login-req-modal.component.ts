import { DomUtilityService } from 'app/shared';
import { Component, OnInit, Input, Output, EventEmitter, ElementRef, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';

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
export class LoginReqModal {
  /** Meant only to trigger display of modal */
  @Output()
  public closeModal: EventEmitter<any> = new EventEmitter();

  @ViewChild("modal", {read: ElementRef}) modalElement: ElementRef;

  constructor(
    private _router: Router,
    public _auth: AuthService,
    private route: ActivatedRoute,
    private _tool: ToolboxService,
    private _dom: DomUtilityService,
    private location: Location
  ) { }

  ngOnInit() {
    // Set focus to the modal to make the links in the modal first thing to tab for accessibility
    // let htmlelement: HTMLElement = <HTMLElement>this._dom.byId('modal');
    // htmlelement.focus();
    if (this.modalElement && this.modalElement.nativeElement){
      this.modalElement.nativeElement.focus()
    }
  }

  goToLogin() {
    // could utilize RouteReuseStrategy here

    this._auth.store('stashedRoute', this.location.path(false));

    this._router.navigate(['/login']);
  }

  test() {
    this._router.navigateByUrl(this._auth.getFromStorage('stashedRoute'));
  }

}
