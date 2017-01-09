import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

import { AssetService, ImageGroup } from './../../shared';

@Component({
  selector: 'ang-ig-download-modal',
  templateUrl: 'ig-download-modal.component.html',
  styles: [`
    .modal {
      display: block;
    }
  `]
})
export class PptModalComponent implements OnInit {
  /** Meant only to trigger display of modal */
  @Output()
  private closeModal: EventEmitter<any> = new EventEmitter();
  @Input()
  private downloadLink: string;
  @Input()
  private ig: ImageGroup;

  private isLoading: boolean = false;

  constructor(private _assets: AssetService) { }

  ngOnInit() { }

  private downloadImageGroup() {
    this.isLoading = true;
    // make call to get number of allowed downloads
    // not sure which service to call yet - contacted Will about it
    this._assets.downloadPpt(this.ig).take(1).subscribe(
      (data) => { console.log(data); this.isLoading = false; },
      (error) => { console.log(error); this.isLoading = false; }
    )
  }
}