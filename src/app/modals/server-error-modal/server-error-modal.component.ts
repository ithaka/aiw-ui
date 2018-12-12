import { Router } from '@angular/router'
import { Component, OnInit, EventEmitter, Input, Output, ElementRef, ViewChild } from '@angular/core'
import { Location } from '@angular/common'

// Project Dependencies
import { DomUtilityService } from 'app/shared'
import { ArtstorStorageService } from '../../../../projects/artstor-storage/src/public_api';
@Component({
  selector: 'ang-server-error-modal',
  templateUrl: 'server-error-modal.component.pug'
})
export class ServerErrorModal implements OnInit {
  @Output() exitFullScreen: EventEmitter<any> = new EventEmitter()
  @Output() closeModal: EventEmitter<any> = new EventEmitter()
  @ViewChild("modal", {read: ElementRef}) modalElement: ElementRef

  constructor(
    private _storage: ArtstorStorageService,
    private _router: Router,
    private _dom: DomUtilityService,
    private location: Location
  ) { }

  ngOnInit() {
    // Set focus to the modal to make the links in the modal first thing to tab for accessibility
    // let htmlelement: HTMLElement = <HTMLElement>this._dom.byId('modal');
    // htmlelement.focus()
    if (this.modalElement && this.modalElement.nativeElement){
      this.modalElement.nativeElement.focus()
    }
  }

  /**
   * Set aside our current/intended path so the user can return
   */
  stashThenRoute(routeValue: string) {
    console.log(this.location.path())
    this._storage.setLocal('stashedRoute', this.location.path())
    this._router.navigate([routeValue]);
  }
}
