import { Component, OnInit, Input, Output, EventEmitter, AfterViewInit, ElementRef, ViewChild } from '@angular/core';

// Project Dependencies
import { AssetService, DomUtilityService, ThumbnailService, LogService } from '_services';
import { Asset } from '../../asset-page/asset';
import { ArtstorStorageService } from '../../../../projects/artstor-storage/src/public_api';

@Component({
  selector: 'ang-share-link-modal',
  templateUrl: './share-link-modal.component.pug',
  styleUrls: ['./share-link-modal.component.scss']
})
export class ShareLinkModal implements OnInit, AfterViewInit {

  @Input() public asset: any;
  @Output() public closeModal: EventEmitter<any> = new EventEmitter();
  @ViewChild("shareImgLinkTitle", {read: ElementRef}) shareLinkTitleElement: ElementRef;
  private shareLink: string = '';
  private genImgMode: string = 'half';

  private imgURLCopied: boolean = false;
  private copyURLStatusMsg: string = '';
  private copyHTMLStatusMsg: string = '';

  constructor(
    private _assets: AssetService,
    private _thumbnail: ThumbnailService,
    private _dom: DomUtilityService,
    private _log: LogService,
    private _storage: ArtstorStorageService
  ) { }

  ngOnInit() {
    if (this.asset) {
      let isPublic = this.asset.collectiontypes ? this.asset.collectiontypes.indexOf(5) >= 0 : false
      // External share links are not handled by this modal, since it is only called by Nav
      this.shareLink = this._assets.getShareLink(this.asset.id, isPublic);
      // Clean Group item data
      if (this.asset['tombstone']) {
        this.asset['name'] = this.asset['tombstone'][0]
      }
    }
  }

  ngAfterViewInit() {
    this.startModalFocus()
  }

  // Set initial focus on the modal Title h1
  public startModalFocus() {
    // let modalStartFocus = this._dom.byId('share-img-link-title')
    // modalStartFocus.focus()
    if (this.shareLinkTitleElement && this.shareLinkTitleElement.nativeElement){
      this.shareLinkTitleElement.nativeElement.focus()
    }
  }

  /**
   * Copies innerText of an element to the clipboard
   * @param id of the field whose innerText is to be copied to the clipboard
   */
  private copyTexttoClipBoard(id: string): void{
    let textArea =this._dom.create('textarea');

    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';

    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';

    let element = this._dom.byId(id);
    textArea.value = element.textContent;

    document.body.appendChild(textArea);
    textArea.select();

    try {
      let successful = document.execCommand('copy');
      let msg = '';

      if (successful){
        msg = 'Successfully Copied!';
      }
      else{
        msg = 'Not able to copy!';
      }

      if (id === 'copyURL'){
        this.copyURLStatusMsg = msg;

        // Add Captain's log event: Copy image url
        let searchResults = this._storage.getLocal('results')
        let requestedid = searchResults.requestId ? searchResults.requestId : null
        this._log.log({
            eventType: 'artstor_copy_link',
            additional_fields: {
                referring_requestid: requestedid,
                item_id: this.asset.id
            }
        })

        setTimeout(() => {
          this.copyURLStatusMsg = '';
        }, 8000);
      }
      else if (id === 'copyHTML'){
        this.copyHTMLStatusMsg = msg;
        setTimeout(() => {
          this.copyHTMLStatusMsg = '';
        }, 8000);
      }
    } catch (err) {
      console.log('Unable to copy');
    }

    // TODO SSR
    document.body.removeChild(textArea);
  }

}
