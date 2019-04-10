import { Component, OnInit, Input, Output, EventEmitter, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Angulartics2 } from 'angulartics2';

import { AssetService, AuthService, ImageGroup, DomUtilityService, ScriptService } from './../../shared';
import { SlidesService } from './../../_services'
import { ArtstorStorageService } from '../../../../projects/artstor-storage/src/public_api';

@Component({
  selector: 'ang-google-auth',
  templateUrl: './google-auth.component.pug',
  styleUrls: ["./google-auth.component.scss"]
})
export class GoogleAuthComponent implements OnInit, AfterViewInit {

  @Output()
  public closeModal: EventEmitter<any> = new EventEmitter();

  @Output()
  public isSignedIn: boolean = false

  public gapiLoaded: boolean = false

  constructor(
    public _slides: SlidesService,
    private _script: ScriptService,
    private _angulartics: Angulartics2,
    private _dom: DomUtilityService,
    private _storage: ArtstorStorageService
  ) {}

  ngOnInit() {
    // Load gapi script. On complete, initialize as an API client.
    this._script.load('gapi').then(() => {
      this._slides.loadClientInit()
      this.gapiLoaded = true
    })
  }

  ngAfterViewInit() {
    this.startModalFocus()
  }
  public startModalFocus() {
    let htmlelement: HTMLElement = <HTMLElement>this._dom.bySelector('.auth-btn .btn')
    htmlelement.focus()
  }
  public focusLastElement() {
    let htmlelement: HTMLElement = <HTMLElement>this._dom.bySelector('.close')
    htmlelement.focus()
  }

  public signIn() {
    this._slides.gAuthSignIn()
  }

}
