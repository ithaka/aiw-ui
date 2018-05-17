import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { Angulartics2 } from 'angulartics2';

import { AssetService, AuthService, ImageGroup } from './../../shared';
import { AnalyticsService } from '../../analytics.service'

@Component({
  selector: 'ang-ig-download-modal',
  templateUrl: 'ig-download-modal.component.pug',
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
  private ig: ImageGroup;

  private isLoading: boolean = false;
  private zipLoading: boolean = false;
  private downloadLink: string = '';
  private zipDownloadLink: string = '';
  private downloadTitle: string = 'Image Group';
  private allowedDownloads: number = 0;
  private imgCount: number = 0;

  private header = new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded');
  private defaultOptions = { withCredentials: true};
  // private defaultOptions = new RequestOptions({ headers: this.header, withCredentials: true});

  constructor(
    private _assets: AssetService,
    private _auth: AuthService,
    private _angulartics: Angulartics2,
    private http: HttpClient,
    private _analytics: AnalyticsService
  ) { }

  ngOnInit() {

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
        this.downloadLink = this._auth.getThumbUrl() + data.path.replace('/nas/','/thumb/')
      }
    })
    .catch((err) => {
      console.error(err)
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
        this.zipDownloadLink = this._auth.getThumbUrl() + data.path.replace('/nas/','/thumb/');
      }
    })
    .catch((err) => {
      console.error(err)
      this.zipLoading = false
    })
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
    return this._assets.getAllThumbnails(group.items)
    .then((thumbnails) => {
      let imgDownloadStrings: string[] = []

      thumbnails.forEach((thumbnail, index) => {
        let imgStr: string = [(index + 1), thumbnail.objectId, "1024x1024"].join(":")
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

  trackDownload(downloadType: string) : void {
    this._analytics.directCall('request' + downloadType)
    this._angulartics.eventTrack.next({ action: "downloadGroup" + downloadType, properties: { category: "group", label: this.ig.id }})
  }

}
