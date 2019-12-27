import { Component, AfterViewInit, Output, Input, EventEmitter, ElementRef, ViewChild } from '@angular/core';

// Project Dependencies
import { AuthService, DomUtilityService } from '_services'
import { Asset } from './../asset'

@Component({
  selector: 'ang-agree-modal',
  templateUrl: 'agree-modal.component.pug',
  styleUrls: [ './agree-modal.component.scss' ]
})
export class AgreeModalComponent implements AfterViewInit {

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

  @ViewChild("agreeModalTitle", {read: ElementRef}) modalTitleElement: ElementRef;

  constructor(
    private _auth: AuthService,
    private _dom: DomUtilityService
  ) { }

  ngAfterViewInit() {
    this.startModalFocus()
  }

  // Set initial focus on the modal Title h4
  public startModalFocus() {
    if (this.modalTitleElement && this.modalTitleElement.nativeElement){
      this.modalTitleElement.nativeElement.focus()
    }
  }

  /**
   * Authorizes download and closes modal
   */
  public agree(): void {
    this._auth.authorizeDownload()
    this.acceptedTerms.emit()
    this.closeModal.emit()
  }

}
