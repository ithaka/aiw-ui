import { Component, OnInit, Output, Input, EventEmitter, ElementRef, ViewChild } from '@angular/core';

// Project Dependencies
import { AuthService, DomUtilityService } from '_services'
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

  @ViewChild("modal", {read: ElementRef}) modalElement: ElementRef;

  constructor(
    private _auth: AuthService,
    private _dom: DomUtilityService
  ) { }

  ngOnInit() {
    // Set focus to the modal to make the links in the modal first thing to tab for accessibility
    // TO-DO: Only reference document client-side
    // let htmlelement: HTMLElement = <HTMLElement>this._dom.byId('modal');
    // htmlelement.focus()
    if (this.modalElement && this.modalElement.nativeElement){
      this.modalElement.nativeElement.focus()
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
