import { Injectable, EventEmitter } from '@angular/core'
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { Router } from '@angular/router'

import { Observable, BehaviorSubject } from 'rxjs'

import { AuthService, AssetService, ImageGroup } from './../shared'
import { ImageGroupDescription } from './../shared'

/**
 *
 * OLD SERVICE FOR GROUPS
 *
 * THIS SERVICE IS DEPRECATED
 *
 */

@Injectable()
export class ImageGroupService {
  private proxyUrl = '';
  private baseUrl: string;

  private header = new HttpHeaders().set('Content-Type', 'application/json'); // ... Set content type to JSON
  private options = { headers: this.header, withCredentials: true};

  private assetsValue: any[] = [];
  // BehaviorSubjects push last value on subscribe
  private assetsSource = new BehaviorSubject<any>(this.assetsValue);
  public assets = this.assetsSource.asObservable();

  public igDownloadTrigger: EventEmitter<string> = new EventEmitter();


  public editGroupObservableSource: BehaviorSubject<boolean>;
  public editGroupObservable: Observable<boolean>;

  constructor(private _router: Router, private http: HttpClient, private _auth: AuthService, private _assets: AssetService ){
    this.baseUrl = this._auth.getUrl();
    
    this.editGroupObservableSource = new BehaviorSubject(false)
    this.editGroupObservable = this.editGroupObservableSource.asObservable()
  }

  /**
   * Get image group description from image group id
   * @param groupId Id of desired image group
   * @returns JS Object with parameters: count, igId, igName, igNotes and more if it is a folder
   */
  getGroupDescription(groupId: string): Observable<ImageGroupDescription> {
    let requestUrl = [this.baseUrl, 'imagegroup', groupId].join('/') + '?_method=igdescription';

    return this.http
      .get<ImageGroupDescription>(requestUrl, this.options)
  }

  /**
   * Load image group assets
   * @param igId Image group id for which to retrieve assets
   * @param startIndex Starting index for the image group assets
   */
  loadIgAssets(igId: string, startIndex: number): void {
      let requestString: string = [this._auth.getUrl(), 'imagegroup', igId, 'thumbnails', startIndex, 72, 0].join('/');
      this.http
          .get(requestString, this.options)
          .toPromise()
          .then(
            (res) => {
                this.assetsSource.next(res);
          });
  }

  public triggerIgDownload(): void {
    this.igDownloadTrigger.emit();
  }

  public triggerPPTExport(): void {
    this.igDownloadTrigger.emit('PPT');
  }

  public triggerZIPExport(): void {
    this.igDownloadTrigger.emit('ZIP');
  }

  public triggerGoogleSlides(): void {
    this.igDownloadTrigger.emit('GoogleSlides');
  }

  /** Gets the link at which the resource can be downloaded. Will be set to the "accept" button's download property */
  public getDownloadLink(group: ImageGroup, zip ?: boolean): Promise<any> {
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
