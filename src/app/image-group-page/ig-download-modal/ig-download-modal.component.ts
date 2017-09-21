import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { Angulartics2 } from 'angulartics2';

import { AssetService, AuthService, ImageGroup } from './../../shared';

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
  private ig: ImageGroup;

  private isLoading: boolean = false;
  private zipLoading: boolean = false;
  private downloadLink: string = '';
  private zipDownloadLink: string = '';
  private downloadTitle: string = 'Image Group';
  private allowedDownloads: number = 0;
  private imgCount: number = 0;

  private header = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded' }); 
  private defaultOptions = new RequestOptions({ withCredentials: true});
  // private defaultOptions = new RequestOptions({ headers: this.header, withCredentials: true});

  constructor(private _assets: AssetService, private _auth: AuthService, private _angulartics: Angulartics2, private http: Http) { }

  ngOnInit() {
    
  }
  
  private getPPT() {
    this.isLoading = true;
    // Setup PPT Download
    this.getDownloadLink(this.ig)
      .take(1)
      .subscribe(
        (data) => { 
          this.isLoading = false; 
          // Goal: A downlink that looks like:
          // http://mdxdv.artstor.org/thumb/imgstor/...
          if (data.path) {
            this.downloadLink = this._auth.getThumbUrl() + data.path.replace('/nas/','/thumb/');
          }
        },
        (error) => { console.error(error); this.isLoading = false; }
      );
    
  }

  private getZip() {
    this.zipLoading = true;
    // Setup Zip download
    this.getDownloadLink(this.ig, true)
      .take(1)
      .subscribe(
        (data) => { 
          this.zipLoading = false;
          // Goal: A downlink that looks like:
          // http://mdxdv.artstor.org/thumb/imgstor/...
          if (data.path) {
            this.zipDownloadLink = this._auth.getThumbUrl() + data.path.replace('/nas/','/thumb/');
          }
        },
        (error) => { console.error(error); this.zipLoading = false; }
      );
  }

  /** Gets the link at which the resource can be downloaded. Will be set to the "accept" button's download property */
  private getDownloadLink(group: ImageGroup, zip ?: boolean): Observable<any> {
    let header = new Headers({ 'content-type': 'application/x-www-form-urlencoded' }); 
    let options = new RequestOptions({ headers: header, withCredentials: true});
    let imgStr: string = "";
    let useLegacyMetadata: boolean = true
    let url = this._auth.getHostname() + '/api/group/export' 
    let format: string
    let data: any

    if (!zip) {
      format = 'pptx'
    } else {
      format = 'zip'
    }

    group.items.forEach((item, index, items) => {
        imgStr += [(index + 1), item, "1024x1024"].join(":")
        if (index !== items.length - 1) {
            imgStr += ","
        }
    })

    data = {
        igName: group.name,
        images: imgStr
    }

    // Make authorization call to increment download count
    this.http
      .get(url + '/auth/' + group.id + '/true', options)
      .map(data => {
        return data.json() || {};
      })
      .toPromise()

    // Return request that provides file URL
    return this.http
      .post(url + '/' + format + '/' + group.id + '/' + useLegacyMetadata, this._auth.formEncode(data), options)
      .map(data => {
        return data.json() || {};
      });
  }

  trackDownload(downloadType: string) : void {
        this._angulartics.eventTrack.next({ action: "downloadGroup" + downloadType, properties: { category: "group", label: this.ig.id }});
  }

}