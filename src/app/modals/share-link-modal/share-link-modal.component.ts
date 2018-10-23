import { Component, OnInit, Input, Output, EventEmitter, AfterViewInit } from '@angular/core';

// Project Dependencies
import { AssetService, AssetSearchService } from '../../shared';
import { Asset } from '../../asset-page/asset';

@Component({
  selector: 'ang-share-link-modal',
  templateUrl: './share-link-modal.component.pug',
  styleUrls: ['./share-link-modal.component.scss']
})
export class ShareLinkModal implements OnInit, AfterViewInit {

  @Input() public asset: any;
  @Output() public closeModal: EventEmitter<any> = new EventEmitter();
  private shareLink: string = '';
  private genImgMode: string = 'half';

  private imgURLCopied: boolean = false;
  private copyURLStatusMsg: string = '';
  private copyHTMLStatusMsg: string = '';

  constructor(private _assets: AssetService, private _search: AssetSearchService) { }

  ngOnInit() {
    if (this.asset) {
      this.shareLink = this._assets.getShareLink(this.asset.objectId ? this.asset.objectId : this.asset.artstorid);
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
    let modalStartFocus = document.getElementById('share-img-link-title')
    modalStartFocus.focus()
  }

  /**
   * Copies innerText of an element to the clipboard
   * @param id of the field whose innerText is to be copied to the clipboard
   */
  private copyTexttoClipBoard(id: string): void{
    let textArea = document.createElement('textarea');

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

    let element = document.getElementById(id);
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

    document.body.removeChild(textArea);
  }

  public showHelp(): void{
    window.open('http://support.artstor.org/?article=creating-links', 'Artstor Support', 'width=600,height=500');
  }

}
