import { Component, OnInit, Input, Output, EventEmitter, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Angulartics2 } from 'angulartics2';

import { AssetService, AuthService, ImageGroup, DomUtilityService } from './../../shared';
import { map } from 'rxjs/operators';

@Component({
  selector: 'ang-ig-download-modal',
  templateUrl: 'ig-download-modal.component.pug',
  styles: [`
    .modal {
      display: block;
    }
  `]
})
export class PptModalComponent implements OnInit, AfterViewInit {
  /** Meant only to trigger display of modal */
  @Output()
  public closeModal: EventEmitter<any> = new EventEmitter();
  @Input()
  public ig: ImageGroup;

  @ViewChild("ig-download-title", {read: ElementRef}) downloadTitleElement: ElementRef;

  public isLoading: boolean = false;
  public zipLoading: boolean = false;
  public downloadLink: string = '';
  public zipDownloadLink: string = '';
  public error: boolean = false;
  private downloadTitle: string = 'Image Group';
  private allowedDownloads: number = 0;

  private header = new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded');
  private defaultOptions = { withCredentials: true};
  // private defaultOptions = new RequestOptions({ headers: this.header, withCredentials: true});

  constructor(
    private _assets: AssetService,
    private _auth: AuthService,
    private _angulartics: Angulartics2,
    private _dom: DomUtilityService,
    private http: HttpClient,
  ) {}

  ngOnInit() {}

  ngAfterViewInit() {
    this.startModalFocus()
  }
  // Set initial focus on the modal Title h4
  public startModalFocus() {
    let htmlelement: HTMLElement = <HTMLElement>this._dom.byId('ig-download-title');
    htmlelement.focus()

    if (this.downloadTitleElement && this.downloadTitleElement.nativeElement){
      this.downloadTitleElement.nativeElement.focus()
    }

  }

  trackDownload(downloadType: string): void {
    this._angulartics.eventTrack.next({ properties: { event: 'downloadGroup' + downloadType, category: 'download', label: this.ig.id }})
  }

  private getPPT() {
    this.isLoading = true
    // Setup PPT Download
    this.getDownloadLink(this.ig)
    .then((data) => {
      this.isLoading = false
      // Goal: A downlink that looks like:
      // http://mdxdv.artstor.org/thumb/imgstor/...
      if (data.path) {
        this.downloadLink = this._auth.getThumbHostname() + data.path.replace('/nas/', '/thumb/')
      }
    })
    .catch((err) => {
      console.error(err)
      this.error = true
      this.isLoading = false
    })
  }

  private getZip() {
    this.zipLoading = true;
    // Setup Zip download
    this.getDownloadLink(this.ig, true)
    .then((data) => {
      this.zipLoading = false;
      // Goal: A downlink that looks like:
      // http://mdxdv.artstor.org/thumb/imgstor/...
      if (data.path) {
        this.zipDownloadLink = this._auth.getThumbHostname() + data.path.replace('/nas/', '/thumb/');
      }
    })
    .catch((err) => {
      console.error(err)
      this.error = true
      this.zipLoading = false
    })
  }

  // Closes the IG download modal and sets focus back to initial download button
  public hideModal(event: any): void {
    this.closeModal.emit()
    setTimeout( () => {
      let downloadButtonElement: HTMLElement = document.getElementById('ig-download-btn')
      downloadButtonElement.focus()
    }, 250)
  }

  /** Gets the link at which the resource can be downloaded. Will be set to the "accept" button's download property */
  private getDownloadLink(group: ImageGroup, zip ?: boolean): Promise<any> {
    let header = new HttpHeaders().set('content-type', 'application/x-www-form-urlencoded')
    let options = { headers: header, withCredentials: true }
    let useLegacyMetadata: boolean = true
    let url = this._auth.getHostname() + '/api/group/export'
    let format: string
    let data: any

    if (!zip) {
      format = 'pptx'
    } else {
      format = 'zip'
    }

    /**
     * We're using this as an auth check - instead of simply using all of the group.items strings and calling for downloads,
     *  which was allowing restricted assets to be downloaded, we first ask for each assets' thumbnail, which will ensure
     *  that only assets which the user has access to are returned
     */
    return this._assets.getAllThumbnails(group.items, group.id)
    .then((thumbnails) => {
      let imgDownloadStrings: string[] = []
      thumbnails.forEach((thumbnail, index) => {
        let imgStr: string = [(index + 1), thumbnail.objectId, '1024x1024'].join(':')
        thumbnail.status == 'available' && imgDownloadStrings.push(imgStr)
      })

      data = {
          igName: group.name,
          images: imgDownloadStrings.join(',')
      }

      return data
    })
    .then((data) => {
      // Return request that provides file URL
      return this.http
        .post(url + '/' + format + '/' + group.id + '/' + useLegacyMetadata, this._auth.formEncode(data), options)
        .pipe(map((res) => {
          if (res === null || !res['path']) {
            /**
             * @todo: a null response is received when we should be getting a 401
             * This handling should be removed once the service is updated and returns a 401
             */
            this._auth.showUserInactiveModal.next(true)
            throw new Error("Invalid data response, assuming expired session")
          }
        }))
        .toPromise()
    })
    .then((res) => {
      // Make authorization call to increment download count after successful response is received
      this.http
      .get(url + '/auth/' + group.id + '/true', options)
      .toPromise()

      return res
    })
  }

}
