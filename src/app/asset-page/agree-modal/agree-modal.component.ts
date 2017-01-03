import { Component, OnInit, Output, Input, EventEmitter } from '@angular/core';
import { Asset } from './../asset';

@Component({
  selector: 'ang-agree-modal',
  templateUrl: 'agree-modal.component.html',
  styleUrls: [ './agree-modal.component.scss' ]
})
export class AgreeModalComponent implements OnInit {
  /** Causes modal to be hidden */
  @Output()
  closeModal = new EventEmitter();
  /** Tells asset-page to download the asset */
  @Output()
  downloadAsset = new EventEmitter();
  @Input()
  asset: Asset;

  constructor() { }

  ngOnInit() { }

  private agree() {
    this.closeModal.emit();
  }
}