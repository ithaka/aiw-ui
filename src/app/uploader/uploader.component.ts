import { Component, OnInit, EventEmitter, Input, Output } from '@angular/core'
import { FileUploader, FileSelectDirective, FileLikeObject, FileItem } from 'ng2-file-upload'

// Project Dependencies
import { AuthService, PostPersonalCollectionResponse } from '_services'

@Component({
  selector: 'ang-uploader',
  templateUrl: 'uploader.component.pug',
  styleUrls: ['./uploader.component.scss']
})

export class UploaderComponent implements OnInit {
  @Output() fileUploaded: EventEmitter<PostPersonalCollectionResponse> = new EventEmitter()
  @Output() focusOnFirstElement: EventEmitter<boolean> = new EventEmitter()

  @Input() public colAssetsCount: number

  public uploader: FileUploader
  private UPLOAD_URL: string

  // controls display of drop zone while there is a file over it
  public fileOverDropZone: boolean = false
  // keep an array of files which were of invalid type
  public invalidFiles: FileLikeObject[] = []

  constructor(private _auth: AuthService) {
    this.UPLOAD_URL = [this._auth.getUrl(), 'v1', 'pcollection', 'image'].join('/')

    this.uploader = new FileUploader({
      url: this.UPLOAD_URL,
      allowedMimeType: ['image/JPEG', 'image/JPG', 'image/jpeg', 'image/jpg'],
      autoUpload: true
    })
  }

  ngOnInit() {
    this.uploader.onWhenAddingFileFailed = (item, filter, options) => {
      this.invalidFiles.push(item)
    }

    this.uploader.onCompleteItem = (item, response, status, headers) => {
      if (item.isSuccess) {
        // this.uploader.removeFromQueue(item)

        let resJson = response && JSON.parse(response)
        resJson.src = item._file['local-src']
        resJson && this.fileUploaded.emit(resJson)
      }
    }

    /**
     * Grabs the file source for each file added
     */
    this.uploader.onAfterAddingFile = (file) => {
      this.getFileSource(file['some']) // this component is stupid and adds the file under the 'some' property but doesn't include it in the interface
    }
  }

  helpTabKeyDown(event: any): void{
    if(this.colAssetsCount === 0) {
      event.stopPropagation()
      event.preventDefault()
      this.focusOnFirstElement.emit(true)
    }
  }
  /**
   * Triggered by the fileOver event from ng2-file-upload
   * @param fileOver boolean indicates whether or not a file is over the drop area
   */
  public fileOverBase(fileOver: boolean): void {
    this.fileOverDropZone = fileOver;
  }

  /**
   * Takes a file and loads its source, then assigns that back to a custom property on the file to be read later
   * @param file the file for which we'd like to get the blob loaded from local files
   */
  private getFileSource(file: File): void {
    let reader  = new FileReader()
    reader.addEventListener('load', () => {
      file['local-src'] = reader.result // assigning this property to pass-through to the _file object on onCompleteItem
    })

    reader.readAsDataURL(file)
  }
}

interface RawFile {
  lastModified: number
  name: string
  size: number
  type: string
}
