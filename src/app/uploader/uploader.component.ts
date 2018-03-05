import { Component, OnInit } from '@angular/core'

import { FileUploader, FileSelectDirective, FileLikeObject } from 'ng2-file-upload'

@Component({
  selector: 'ang-uploader',
  templateUrl: 'uploader.component.pug',
  styleUrls: ['./uploader.component.scss']
})

export class UploaderComponent implements OnInit {

  private uploadURL: string = 'nothing'
  private uploader:FileUploader = new FileUploader({ url: this.uploadURL, allowedMimeType:["image/JPEG", "image/JPG", "image/jpeg", "image/jpg"] })

  constructor() { }

  ngOnInit() { }
}