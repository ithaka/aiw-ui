import { Component, OnInit } from '@angular/core'

import { FileUploader, FileSelectDirective, FileLikeObject } from 'ng2-file-upload'
import { AuthService } from '../shared'

// const UPLOAD_URL: string = 'https://evening-anchorage-3159.herokuapp.com/api/' //TODO: NEEDS CHANGING - JUST AND EXPERIMENT

@Component({
  selector: 'ang-uploader',
  templateUrl: 'uploader.component.pug',
  styleUrls: ['./uploader.component.scss']
})

export class UploaderComponent implements OnInit {
  private uploader: FileUploader
  private UPLOAD_URL: string

  // controls display of drop zone while there is a file over it
  private fileOverDropZone: boolean = false

  private invalidFiles: FileLikeObject[] = []

  constructor(private _auth: AuthService) {
    this.UPLOAD_URL = [this._auth.getUrl(), 'v1', 'pcollection', 'image'].join('/')

    this.uploader = new FileUploader({
      url: this.UPLOAD_URL,
      allowedMimeType:["image/JPEG", "image/JPG", "image/jpeg", "image/jpg"],
      autoUpload: true
    })
  }

  ngOnInit() {
    this.uploader.onWhenAddingFileFailed = (item, filter, options) => {
      this.invalidFiles.push(item)
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
  }
}

interface RawFile {
  lastModified: number
  name: string
  size: number
  type: string
}