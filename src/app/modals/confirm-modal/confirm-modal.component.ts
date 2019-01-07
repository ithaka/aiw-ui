import { Router } from '@angular/router';
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

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

  public groupDeleted: boolean = false

  constructor(
    private _router: Router
  ) { }

  ngOnInit() {
    // Set focus to the modal to make the links in the modal first thing to tab for accessibility
    let htmlelement: HTMLElement = document.getElementById('modal');
    htmlelement.focus()
  }
}
