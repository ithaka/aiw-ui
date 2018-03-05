import { Component, OnInit } from '@angular/core'

import { FileUploader, FileSelectDirective, FileLikeObject } from 'ng2-file-upload'

@Component({
  selector: 'ang-uploader',
  templateUrl: 'uploader.component.pug',
  styleUrls: ['./uploader.component.scss']
})

export class UploaderComponent implements OnInit {

  private uploadURL: string = 'nothing'
  private uploader: FileUploader = new FileUploader({ url: this.uploadURL, allowedMimeType:["image/JPEG", "image/JPG", "image/jpeg", "image/jpg"] })

  // controls display of drop zone while there is a file over it
  private fileOverDropZone: boolean = false

  constructor() { }

  ngOnInit() {
    this.uploader.onWhenAddingFileFailed = (item:FileLikeObject, filter:any, options:any) => {
      // this.uploader.clearQueue();
      // this.typeValid = false;
      setTimeout(() => {
        // this.typeValid = true;
      }, 2000);
     }
  }

  /**
   * Triggered by the fileOver event from ng2-file-upload
   * @param fileOver boolean indicates whether or not a file is over the drop area
   */
  private fileOverBase(fileOver: boolean): void {
    this.fileOverDropZone = fileOver;
  }

  /**
   * Triggered by the onFileDrop event from ng2-file-upload
   * @param files 
   */
  private fileDropped(files: FileObject[]): void {
    console.log(files)
  }
}

interface FileObject {
  lastModified: number
  name: string
  size: number
  type: string
}