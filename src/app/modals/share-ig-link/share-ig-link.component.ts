import { Component, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  moduleId: module.id,
  selector: 'ang-share-ig-link',
  templateUrl: 'share-ig-link.component.html',
  styleUrls: ['./share-ig-link.component.scss']
})
export class ShareIgLinkModal implements OnInit {
  @Output()
  private closeModal: EventEmitter<any> = new EventEmitter();

  private document = document;

  private shareLink: string = "test"; // this is the url which will be copied to the user's clipboard
  private shareHyperlink: string = "this is another test"; // this is the hyperlink which will be copied to the user's clipboard

  constructor() { }

  ngOnInit() { }
}