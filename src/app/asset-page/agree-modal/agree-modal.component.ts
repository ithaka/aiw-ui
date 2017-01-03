import { Component, OnInit, Output, EventEmitter } from '@angular/core';

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

  constructor() { }

  ngOnInit() { }

  private acceptTerms() {
    this.closeModal.emit();
  }
}