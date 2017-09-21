import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

// Project Dependencies
import { GroupService, AssetService } from './../../shared';

@Component({
  selector: 'ang-no-ig-modal',
  templateUrl: 'no-ig.component.html',
  providers: [
    GroupService
  ]
})
export class NoIgModal implements OnInit {
  @Input() noAccessIg: boolean;
  @Output()
  closeModal: EventEmitter<any> = new EventEmitter();

  constructor() { }

  ngOnInit() {
    
  }

}
