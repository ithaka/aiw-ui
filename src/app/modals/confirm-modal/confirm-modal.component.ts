import { Router } from '@angular/router';
import { Component, OnInit, Input, Output, EventEmitter, ElementRef, ViewChild } from '@angular/core';
import { DomUtilityService } from 'app/shared';

@Component({
  selector: 'ang-confirm-modal',
  templateUrl: 'confirm-modal.component.pug'
})
export class ConfirmModal implements OnInit {
  /**
   * ConfirmModal emits the following:
   * 0 for "False" or "dismiss"
   * 1 for "primary" action or "confirm"
   * 2 for "secondary" action
   * (could be extended by incrementing onward 3,4,5...)
   */
  @Output()
  closeModal: EventEmitter<number> = new EventEmitter();

  @Input() title: string = 'Confirm';

  @Input()
  description: string = 'Are you sure you would like to proceed?';

  // Option variables
  @Input() dismiss: string = 'Cancel';
  @Input() primary: string = 'Okay';
  @Input() secondary: string;

  @ViewChild("modal", {read: ElementRef}) modalElement: ElementRef;

  public groupDeleted: boolean = false

  constructor(
    private _router: Router,
    private _dom: DomUtilityService,
  ) { }

  ngOnInit() {
    // Set focus to the modal to make the links in the modal first thing to tab for accessibility
    // let htmlelement: HTMLElement = <HTMLElement>this._dom.byId('modal');
    // htmlelement.focus()
    if (this.modalElement && this.modalElement.nativeElement){
      this.modalElement.nativeElement.focus()
    }
  }
}
