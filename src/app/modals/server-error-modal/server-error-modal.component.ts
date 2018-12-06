import { DomUtilityService } from 'app/shared';
import { Router } from '@angular/router'
import { Component, OnInit, EventEmitter, Input, Output } from '@angular/core'

// Project Dependencies
import { AuthService } from '../../shared'
import { ArtstorStorageService } from '../../../../projects/artstor-storage/src/public_api';
@Component({
  selector: 'ang-server-error-modal',
  templateUrl: 'server-error-modal.component.pug'
})
export class ServerErrorModal implements OnInit {
  @Output() exitFullScreen: EventEmitter<any> = new EventEmitter()
  @Output() closeModal: EventEmitter<any> = new EventEmitter()

  constructor(
    private _storage: ArtstorStorageService,
    private _router: Router,
    private _dom: DomUtilityService
  ) { }

  ngOnInit() {
    // Set focus to the modal to make the links in the modal first thing to tab for accessibility
    let htmlelement: HTMLElement = <HTMLElement>this._dom.utilElementById('modal');
    htmlelement.focus()
  }

  /**
   * Set aside our current/intended path so the user can return
   */
  stashThenRoute(routeValue: string) {
    console.log(window.location.pathname)
    this._storage.setLocal('stashedRoute', window.location.pathname)
    this._router.navigate([routeValue]);
  }
}
