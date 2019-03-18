import { Component, OnInit, Input, Output, EventEmitter, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Angulartics2 } from 'angulartics2';

import { AssetService, AuthService, ImageGroup, DomUtilityService } from './../../shared';
import { ArtstorStorageService } from '../../../../projects/artstor-storage/src/public_api';

@Component({
  selector: 'ang-google-auth',
  templateUrl: './google-auth.component.pug',
  styleUrls: ["./google-auth.component.scss"]
})
export class GoogleAuthComponent implements OnInit, AfterViewInit {

  @Output()
  public closeModal: EventEmitter<any> = new EventEmitter();


  constructor(
    private _angulartics: Angulartics2,
    private _dom: DomUtilityService,
    private _storage: ArtstorStorageService
  ) {}

  ngOnInit() {}

  ngAfterViewInit() {
    this.startModalFocus()
  }
  public startModalFocus() {
    let htmlelement: HTMLElement = <HTMLElement>this._dom.bySelector('.illustration img')
    htmlelement.focus()
  }
  public focusLastElement() {
    let htmlelement: HTMLElement = <HTMLElement>this._dom.bySelector('.close')
    htmlelement.focus()
  }

}
