import { Injectable, EventEmitter } from '@angular/core'
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { Router } from '@angular/router'
import { Observable, BehaviorSubject } from 'rxjs'
import 'rxjs/add/operator/timeout';

// Project Dependencies
import { AuthService } from './auth.service'
import { AssetService } from './assets.service'
import { ImageGroup, ImageGroupDescription } from './../shared/datatypes/image-group.interface'
import { SupportedExportTypes } from "../modals/loading-state/loading-state.component";

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

  public triggerPPTExport(): void {
    this.igDownloadTrigger.emit(SupportedExportTypes.PPTX);
  }

  public triggerZIPExport(): void {
    this.igDownloadTrigger.emit(SupportedExportTypes.ZIP);
  }

  public triggerGoogleSlides(): void {
    this.igDownloadTrigger.emit(SupportedExportTypes.GOOGLE_SLIDES);
  }

  /**
   * Given the image group determine the ids that are to be download given the user's access.
   */
  public getImageIdsToDownload(group: ImageGroup) {

    /**
     * We're using this as an auth check - instead of simply using all of the group.items strings and calling for downloads,
     *  which was allowing restricted assets to be downloaded, we first ask for each assets' thumbnail, which will ensure
     *  that only assets which the user has access to are returned
     */

    return this._assets.getAllThumbnails({ itemObjs: group.items }, group.id)
      .then((thumbnails) => {
        return thumbnails.filter((thumbnail) => thumbnail.status === "available")
          .map((thumbnail) => thumbnail.id)
      })
  }

  /**
   * Gets the link at which the resource can be downloaded. Will be set to the "accept" button's download property.
   * @param group - The image group to download images from
   * @param imageIdsToDownload - A list of image ids to be downloaded from the group. This can be a
   *        subset of the images found in group.items because either access issues or download limit.
   * @param format - The format for the export
   */
  public getDownloadLink(group: ImageGroup, imageIdsToDownload: string[], format : SupportedExportTypes): Promise<any> {
    let header = new HttpHeaders().set('content-type', 'application/x-www-form-urlencoded')
    let options = { headers: header, withCredentials: true }
    let useLegacyMetadata: boolean = true
    let url = this._auth.getHostname() + '/api/group/export'
    let data: any

    const imageDownloadStrings = imageIdsToDownload.map((imageId, index) => {
      return `${index+1}:${imageId}:1024x1024`
    })

    data = {
      igName: group.name,
      images: imageDownloadStrings.join(',')
    }

    let groupExportUrl = url + '/' + format + '/' + group.id + '/' + useLegacyMetadata + '?springBoot=true'

    // Return request that provides file URL
    return this.http
      .post(groupExportUrl, this._auth.formEncode(data), options)
      .timeout(20000) // Timeout after 20s
      .toPromise()
      .then((res) => {
        // Make authorization call to increment download count after successful response is received
        this.http
          .get(url + '/auth/' + group.id + '/true', options)

        return res
      })
  }

  /** Checks for the export status of the specified group */
  public checkExportStatus(groupId: string): Observable<any> {
    let requestUrl = this.baseUrl + '/v2/group/export/check/' + groupId;

    return this.http
      .get(requestUrl, this.options)
  }

}
