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

  private header = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded', 'Cache-Control': 'no-cache' }); 
  private defaultOptions = new RequestOptions({ withCredentials: true});
  // private defaultOptions = new RequestOptions({ headers: this.header, withCredentials: true});

  constructor(private _assets: AssetService, private _auth: AuthService, private http: Http) { }

  ngOnInit() {
    this.isLoading = true;
    this.getDownloadLink(this.ig)
      .take(1)
      .subscribe(
        (data) => { console.log(data); this.isLoading = false; },
        (error) => { console.log(error); this.isLoading = false; }
      );

    this.tryingAnythingHere();

    // this.downloadStatusCall().take(1).subscribe((data) => {
    // });
    
    
    
  }

  private tryingAnythingHere(): void {
    var data = "_method=createPPT&igId=836667&igName=Esto%20(5)&images=1%3AASTOLLERIG_10311329794%3A1024x1024%2C2%3AASTOLLERIG_10311329786%3A1024x1024%2C3%3AASTOLLERIG_10311329752%3A1024x1024%2C4%3AASTOLLERIG_10311329769%3A1024x1024%2C5%3AASTOLLERIG_10311329768%3A1024x1024&zoom=&zip=false";

    var xhr = new XMLHttpRequest();
    xhr.withCredentials = true;

    xhr.addEventListener("readystatechange", function () {
      if (this.readyState === 4) {
        console.log(this.responseText);
      }
    });

    xhr.open("POST", "http://library.artstor.org/library/secure/downloadpptimages");
    xhr.setRequestHeader("content-type", "application/x-www-form-urlencoded");
    xhr.setRequestHeader("cache-control", "no-cache");

    xhr.send(data);
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
  /** Gets the link at which the resource can be downloaded. Will be set to the "accept" button's download property */
  private getDownloadLink(ig: ImageGroup): Observable<any> {
    let requestUrl = [this._auth.getUrl(), 'downloadpptimages'].join("/");

    // let imgStr: string = "";
    // ig.thumbnails.forEach((thumb, index, thumbs) => {
    //     imgStr += [(index + 1), thumb.objectId, "1024x1024"].join(":");
    //     if (index !== thumbs.length - 1) {
    //         imgStr += ",";
    //     }
    // });
    // console.log(imgStr);

    // let requestData = {
    //     _method: "createPPT",
    //     igId: ig.igId,
    //     igName: ig.igName,
    //     images: imgStr,
    //     zooms: null,
    //     zip: false
    // }
    // let requestData: any = {
    //   _method:"createPPT",
    //   igId:836667,
    //   igName:"Esto (5)",
    //   images:"1:ASTOLLERIG_10311329794:1024x1024,2:ASTOLLERIG_10311329786:1024x1024,3:ASTOLLERIG_10311329752:1024x1024,4:ASTOLLERIG_10311329769:1024x1024,5:ASTOLLERIG_10311329768:1024x1024",
    //   zoom: "",
    //   zip:"false"
    // }

    // var encodedString = '';
    // for (var key in requestData) {
    //     if (encodedString.length !== 0) {
    //         encodedString += '&';
    //     }
    //     encodedString += key + '=' + requestData[key];
    // }

    // // let encodedData: string = this._auth.formEncode(requestData);
    // console.log(encodedString);

    let data = "_method=createPPT&igId=836667&igName=Esto%20(5)&images=1%3AASTOLLERIG_10311329794%3A1024x1024%2C2%3AASTOLLERIG_10311329786%3A1024x1024%2C3%3AASTOLLERIG_10311329752%3A1024x1024%2C4%3AASTOLLERIG_10311329769%3A1024x1024%2C5%3AASTOLLERIG_10311329768%3A1024x1024&zoom=&zip=false";

    // let data = "_method=createPPT&igId=836667&igName=Esto (5)&images=1:ASTOLLERIG_10311329794:1024x1024,2:ASTOLLERIG_10311329786:1024x1024,3:ASTOLLERIG_10311329752:1024x1024,4:ASTOLLERIG_10311329769:1024x1024,5:ASTOLLERIG_10311329768:1024x1024&zoom=&zip=false";

    return this.http.post(requestUrl, data, this.defaultOptions);
  }

  // private downloadStatusCall() {
  //   let statusParams: any = {
  //     // igId:877501,
  //     igId: 836667,
  //     pptExportAllowed:true,
  //     message:"PPTExportAllowed",
  //     pptDwnldDuration:120,
  //     userOrigPPTLimit:2000,
  //     userAllowedCnt:1995,
  //     userAlreadyDwnldImgCnt:5,
  //     igImgCount:5,
  //     nonPrivateImgCnt:5,
  //     pubAudioCnt:0,
  //     qtvrCnt:0,
  //     mediaCnt:0,
  //     zooms: "",
  //     canCache: "true",
  //     _method: "isExportToPPTAllowed"
  //   }

  //   // _method=isExportToPPTAllowed&igId=836667

  //   let endpoint = this._auth.getProxyUrl() +  "http://library.artstor.org/library/downloadPptImages_status.jsp?";
  //   let i = 0;
  //   for (let param in statusParams) {
  //     // if (i != Object.keys(statusParams).length) {
  //       endpoint += param + "=" + statusParams[param] + "&";
  //     // }
  //     i++;
  //   }
  //   endpoint = endpoint.substr(0, endpoint.length-1);
  //   console.log(endpoint);
  //   // return this.http.post(endpoint, "_method=isExportToPPTAllowed&igId=836667&zip=true", options);
  //   // return this.http.post(endpoint, "_method=isExportToPPTAllowed&igId=836667", this.defaultOptions);
  //   // return this.http.post(endpoint, statusParams, this.defaultOptions);
  //   return this.http.get(endpoint, this.defaultOptions);
  // }
}