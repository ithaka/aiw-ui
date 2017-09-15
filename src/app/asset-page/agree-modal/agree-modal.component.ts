import { Component, OnInit, Output, Input, EventEmitter } from '@angular/core';

import { AuthService } from './../../shared/auth.service';
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
  assetUrl: string;

  constructor(private _auth: AuthService) { }

  ngOnInit() { }

  /**
   * Authorizes download and closes modal
   */
  private agree(): void {
    this._auth.authorizeDownload();
    this.closeModal.emit();
  }
}