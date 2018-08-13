import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription }   from 'rxjs/Subscription';

// Internal Dependencies
// import { CollectionService } from './collection.service';
import { AssetService } from './../shared/assets.service';
import { AuthService } from './../shared/auth.service';
import { TitleService } from '../shared/title.service';

@Component({
  selector: 'ang-pcollection-page',
  providers: [],
  styleUrls: [ './pcollection-page.component.scss' ],
  templateUrl: './pcollection-page.component.pug'
})

export class PCollectionPage implements OnInit, OnDestroy {

  private header = new HttpHeaders().set('Content-Type', 'application/json'); // ... Set content type to JSON
  private options = { headers: this.header, withCredentials: true }; // Create a request option

  private colId: string = ''
  private colName: string = ''
  private colDescription: string = ''
  private colThumbnail: string = ''
  private assetCount: number
  private descCollapsed: boolean = true
  private showaccessDeniedModal: boolean = false
  private showDeleteSuccessBanner: boolean = false
  private deleteBannerParams: { title?: string } = {}

  private subscriptions: Subscription[] = []

  private publishingAssets: any = {
    ssids: [],
    showPublishingMsgs: true // Flag that hides the publishing msgs untill a new PC asset is uploaded
  }
  private pub_que_count: number = 0
  private pub_failure_count: number = 0

  constructor(
    private _assets: AssetService,
    private _auth: AuthService,
    private _router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
    private _title: TitleService
  ) {}

  ngOnInit() {
    this.pollNewPCAssetsStatus()

    this.subscriptions.push(
      this.route.params.subscribe((routeParams) => {
        // Make copy of params object so we can modify it
        let params = Object.assign({}, routeParams)
        if (!params['sort']) {
          // Default to sorting by Recently Added
          params['sort'] = 4
        }
        this.colId = params['pcolId'];
        // Old links pass a name into the ID, just use that as a search term instead
        if (!/^[0-9]+$/.test(this.colId)) {
          this.http.get('/assets/collection-links.json')
            .subscribe(data => {
              let linkObj = data
              let link = linkObj[this.colId]
              if (link) {
                this._router.navigateByUrl(link)
              } else {
                this._router.navigate(['/search', this.colId.replace('_', ' ')])
              }
            })
        } else if (this.colId) {
          this._assets.clearAssets();
          /**
           * Get Collection metadata
           * - Name
           * - Description
           * - Thumbnail
           */
          this.getCollectionInfo(this.colId)
            .then((data) => {
              this._assets.queryAll(params, true);

              if (!Object.keys(data).length) {
                throw new Error('No data!');
              }

              // If Global Personal Collection, rename as "My Personal Collection"
              this.colName = this.colId == '37436' ? 'My Personal Collection' : data['collectionname'];
              this.colDescription = data['blurburl'];
              this.colThumbnail = data['leadImageURL'] ? data['leadImageURL'] : data['bigimageurl'];

              // Set page title
              this._title.setSubtitle(this.colName)
            })
            .catch((error) => {
              console.error(error);
              if (error.status === 401){
                this.showaccessDeniedModal = true;
              }
            });
        }
      })
    ); // End push to subscription

    this.subscriptions.push(this.route.queryParams.subscribe((params) => {
      console.log(params, !!params.deleteSuccess)
      this.showDeleteSuccessBanner = !!params.deleteSuccess
      console.log(this.showDeleteSuccessBanner)
      this.deleteBannerParams.title = params.deleteSuccess
    }))

  } // OnInit

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }

  /**
  * Get metadata about a collection
  * @param colId The collection ID
  */
  private getCollectionInfo(colId: string) {
      let options = { withCredentials: true };

      return this.http
          .get(this._auth.getUrl() + '/collections/' + colId, options)
          .toPromise()
  }


  private resourceAccessDenied(): void{
    this.showaccessDeniedModal = false;
     this._router.navigate(['/home']);
  }

  private pollNewPCAssetsStatus(): void{
    let publishingAssets = this._auth.getFromStorage('publishingAssets')
    if (publishingAssets){
      this.publishingAssets = publishingAssets
    }


    let statusArray: Array<any> = []
    for (let ssid of this.publishingAssets['ssids']){
      this._assets.getPCImageStatus(ssid)
        .subscribe(
          (res) => {
            let assetStatus = '' // i.e. available, publishing_que, publishing_failure
            if (res.status){
              assetStatus = 'available'
            } else if (res.error && res.error.message === 'Published & Indexed OK'){
              assetStatus = 'publishing_que'
            } else if (res.error && ( res.error.message === 'Failed to publish, trying again' || res.error.message === 'Failed to index, trying again' )){
              assetStatus = 'publishing_failure'
            }
            let statusObj = {
              ssid: ssid,
              status: assetStatus
            }
            statusArray.push(statusObj)
            if (statusArray.length === this.publishingAssets['ssids'].length){ // Was last asset in the array
              this.updateNewPCAssetStatus(statusArray)
            }
        }, (error) => {
          console.error(error)
        })
    }
  }

  private updateNewPCAssetStatus(statusArray: Array<any>): void{
    // Filter assets from publishingAssets that are available now
    statusArray = statusArray.filter((statusObj) => {
      return statusObj.status !== 'available'
    })

    let ssids: Array<string> = []
    let pub_que_count: number = 0
    let pub_failure_count: number = 0
    for (let statusObj of statusArray){
      ssids.push(statusObj.ssid)
      if (statusObj.status === 'publishing_que'){
        pub_que_count++
      } else if (statusObj.status === 'publishing_failure'){
        pub_failure_count++
      }
    }
    let publishingAssets: any = {
      ssids: ssids,
      showPublishingMsgs: this.publishingAssets['showPublishingMsgs']
    }
    this._auth.store('publishingAssets', publishingAssets)
    this.pub_que_count = pub_que_count
    this.pub_failure_count = pub_failure_count

    if (ssids.length > 0){ // If all the uploaded assets are still not available then poll for update in 2 mins
      setTimeout( () => {
        this.pollNewPCAssetsStatus()
      }, 120000)
    }
  }

  private closePublishingMsgs(): void{
    this.publishingAssets['showPublishingMsgs'] = false
    this._auth.store('publishingAssets', this.publishingAssets)
  }

  // private updateSearchInRes(value: boolean): void{
  //  this.searchInResults = value;
  // }
}
