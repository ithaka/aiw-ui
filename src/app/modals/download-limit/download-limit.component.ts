import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

import { ImageGroup } from './../../shared';

@Component({
  selector: 'ang-download-limit-modal',
  templateUrl: 'download-limit.component.pug'
})
export class DownloadLimitModal implements OnInit {
  @Output()
  closeModal: EventEmitter<any> = new EventEmitter();

  @Input()
  ig: ImageGroup;

  constructor() { }

  ngOnInit() {

  }
}
