import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Observable';

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
  private downloadLink: string;
  @Input()
  private ig: ImageGroup;

  private isLoading: boolean = false;

  private header = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }); 
  private defaultOptions = new RequestOptions({ headers: this.header, withCredentials: true});

  constructor(private _assets: AssetService, private _auth: AuthService, private http: Http) { }

  ngOnInit() {
    this.isLoading = true;
    this.downloadStatusCall().take(1).subscribe((data) => {
      this.getDownloadLink(this.ig);
    })
    
    
  }

  // private downloadImageGroup() {
  //   this.isLoading = true;
  //   // make call to get number of allowed downloads
  //   // not sure which service to call yet - contacted Will about it
  //   this._assets.downloadPpt(this.ig).take(1).subscribe(
  //     (data) => { console.log(data); this.isLoading = false; },
  //     (error) => { console.log(error); this.isLoading = false; }
  //   )
  // }

  private getDownloadLink(ig: ImageGroup): void {
    let requestUrl = [this._auth.getUrl(), 'downloadpptimages'].join("/");

    let imgStr: string = "";
    ig.thumbnails.forEach((thumb, index, thumbs) => {
        imgStr += [(index + 1), thumb.objectId, "1024x1024"].join(":");
        if (index !== thumbs.length - 1) {
            imgStr += ",";
        }
    });
    console.log(imgStr);

    // let requestData = {
    //     _method: "createPPT",
    //     igId: ig.igId,
    //     igName: ig.igName,
    //     images: imgStr,
    //     zooms: null,
    //     zip: false
    // }
    let requestData = {
      _method:"createPPT",
      igId:877501,
      igName:"PS Team",
      images:"1:AYALE_PEABODYIG_10313276968:1024x1024",
      zooms: "",
      zip:false
    }


    console.log("calling getDownloadLink");
    this.http.post(requestUrl, this._auth.formEncode(requestData) , this.defaultOptions)
      .take(1)
      .subscribe(
        (data) => { console.log(data); this.isLoading = false; },
        (error) => { console.log(error); this.isLoading = false; }
      )
  }

  private downloadStatusCall() {
    let statusParams: any = {
      igId:877501,
      pptExportAllowed:true,
      message:"PPTExportAllowed",
      pptDwnldDuration:120,
      userOrigPPTLimit:2000,
      userAllowedCnt:1970,
      userAlreadyDwnldImgCnt:30,
      igImgCount:1,
      nonPrivateImgCnt:1,
      pubAudioCnt:0,
      qtvrCnt:0,
      mediaCnt:0,
      zooms: "",
      canCache:true
    }

    let endpoint = "http://library.artstor.org/library/downloadPptImages_status.jsp?";
    let i = 0;
    for (let param in statusParams) {
      if (i != Object.keys(statusParams).length - 1) {
        endpoint += param + "=" + statusParams[param] + "&";
      }
      i++;
    }
    console.log(endpoint);

    let options = new RequestOptions({ withCredentials: true});
    return this.http.post(endpoint, "_method=isExportToPPTAllowed&igId=836667&zip=true", options);
  }
}