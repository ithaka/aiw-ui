import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

import { ImageGroup } from './../../shared';

@Component({
  moduleId: module.id,
  selector: 'ang-share-ig-link',
  templateUrl: 'share-ig-link.component.html',
  styleUrls: ['./share-ig-link.component.scss']
})
export class ShareIgLinkModal implements OnInit {
  @Output()
  private closeModal: EventEmitter<any> = new EventEmitter();

  @Input()
  private ig: ImageGroup;

  private document = document;

  private shareLink: string = "test"; // this is the url which will be copied to the user's clipboard

  constructor() { }

  ngOnInit() {
    console.log(this.ig);
  }
}