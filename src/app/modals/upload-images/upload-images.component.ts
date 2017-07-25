import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { Subscription } from 'rxjs/Rx';
import { FileUploader, FileSelectDirective, FileLikeObject } from 'ng2-file-upload';

import { AssetService } from './../../shared';

@Component({
  selector: 'ang-upload-images',
  styleUrls: [ 'upload-images.component.scss' ],
  templateUrl: 'upload-images.component.html'
})
export class UploadImagesModal implements OnInit, OnDestroy {
  @Output() closeModal: EventEmitter<any> = new EventEmitter();
  private subscriptions: Subscription[] = [];

  private uploadURL: string = '';

  private uploader:FileUploader = new FileUploader({ url: this.uploadURL, allowedMimeType:["image/JPEG", "image/JPG", "image/jpeg", "image/jpg"] });
  private hasBaseDropZoneOver:boolean = false;
  private typeValid: boolean = true;

  constructor(
    private _assets: AssetService
  ) {
    
  }
  

  ngOnInit() {

    this.uploader.onAfterAddingFile = (item) => {
      if(this.uploader.queue.length > 1){
        this.uploader.queue[0].remove();
      }
    };

    this.uploader.onWhenAddingFileFailed = (item:FileLikeObject, filter:any, options:any) => {
      this.uploader.clearQueue(); 
      this.typeValid = false;
      setTimeout(() => {
        this.typeValid = true;
      }, 2000);
     }
  }

  ngOnDestroy() {
      this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }
 
  private fileOverBase(e: any): void {
    this.hasBaseDropZoneOver = e;
  }
}