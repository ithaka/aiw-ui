import { Component, OnInit } from '@angular/core'

import { FileUploader, FileSelectDirective, FileLikeObject } from 'ng2-file-upload'

const UPLOAD_URL: string = 'https://evening-anchorage-3159.herokuapp.com/api/' //TODO: NEEDS CHANGING - JUST AND EXPERIMENT

@Component({
  selector: 'ang-uploader',
  templateUrl: 'uploader.component.pug',
  styleUrls: ['./uploader.component.scss']
})

export class UploaderComponent implements OnInit {
  private uploader: FileUploader = new FileUploader({ url: UPLOAD_URL, allowedMimeType:["image/JPEG", "image/JPG", "image/jpeg", "image/jpg"] })

  // controls display of drop zone while there is a file over it
  private fileOverDropZone: boolean = false

  private invalidFiles: FileLikeObject[] = []

  constructor() { }

  ngOnInit() {
    this.uploader.onWhenAddingFileFailed = (item, filter, options) => {
      // this.uploader.clearQueue()

      // console.log(item, filter, options)
      this.invalidFiles.push(item)
      console.log(this.invalidFiles)
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
  private fileDropped(files: RawFile[]): void {
    // this.droppedFiles.concat(files)
  }
}

interface RawFile {
  lastModified: number
  name: string
  size: number
  type: string
}