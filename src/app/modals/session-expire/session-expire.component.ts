import { Component, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'ang-session-expire-modal',
  templateUrl: 'session-expire.component.html'
})
export class SessionExpireModal implements OnInit {
  @Output()
  closeModal: EventEmitter<any> = new EventEmitter();

  constructor() { }

  ngOnInit() {
    
  }

}
