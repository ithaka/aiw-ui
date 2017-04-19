import { Router } from '@angular/router';
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'ang-confirm-modal',
  templateUrl: 'confirm-modal.component.html'
})
export class ConfirmModal implements OnInit {
  @Output()
  closeModal: EventEmitter<any> = new EventEmitter();

  @Input()
  title: string = 'Confirm';

  @Input()
  description: string = 'Are you sure you would like to proceed?';

  constructor(
      private _router: Router
      ) { }

  ngOnInit() {
    
  }
}
