import { Component, OnInit, Output, Input, EventEmitter } from '@angular/core'

import { AuthService } from './../../shared/auth.service'
import { Asset } from './../asset'

@Component({
  selector: 'ang-agree-modal',
  templateUrl: 'agree-modal.component.pug',
  styleUrls: [ './agree-modal.component.scss' ]
})
export class AgreeModalComponent implements OnInit {

  /** Causes modal to be hidden */
  @Output()
  closeModal = new EventEmitter()
  /** Tells asset-page to download the asset */
  @Output()
  downloadAsset = new EventEmitter()
  /** Asset.acceptedTerms */
  @Output()
  acceptedTerms = new EventEmitter(true)

  @Input()
  downloadUrl: string
  /** The value of the download attribute for Download View **/
  @Input()
  downloadName: string
  /** Is this MS IE or Edge? */
  @Input()
  isMSAgent: boolean
  /** Asset.setDownloadView */
  @Input()
  setDownloadView: () => void

  constructor(private _auth: AuthService) { }

  ngOnInit() {
    // Set focus to the modal to make the links in the modal first thing to tab for accessibility
    let htmlelement: HTMLElement = document.getElementById('modal')
    htmlelement.focus()
  }

  /**
   * Authorizes download and closes modal
   */
  private agree(): void {
    this._auth.authorizeDownload()
    this.acceptedTerms.emit()
    this.closeModal.emit()
  }

}
