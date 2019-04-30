import { Component, OnInit, OnDestroy } from '@angular/core'
import { Meta } from '@angular/platform-browser'
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { Router, ActivatedRoute } from '@angular/router'
import { Subscription }   from 'rxjs'
import { map } from 'rxjs/operators'

// Internal Dependencies
import { AssetService, AuthService, TitleService, ScriptService,  } from '../shared'
import { CollectionService } from '../_services'

@Component({
  selector: 'ang-collection-page',
  providers: [],
  styleUrls: [ './collection-page.component.scss' ],
  templateUrl: './collection-page.component.pug'
})

export class CollectionPage implements OnInit, OnDestroy {
  public colName: string = '';
  public colDescription: string = '';
  public colThumbnail: string = '';
  public assetCount: number;
  public descCollapsed: boolean = true;
  public showAccessDeniedModal: boolean = false;

  private header = new HttpHeaders().set('Content-Type', 'application/json'); // ... Set content type to JSON
  private options = { headers: this.header, withCredentials: true }; // Create a request option

  private colId: string = '';
  private unaffiliatedUser: boolean = false;

  private subscriptions: Subscription[] = [];
  private userSessionFresh: boolean = false;

  constructor(
    private _assets: AssetService,
    private _auth: AuthService,
    private _router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
    private _title: TitleService,
    private _script: ScriptService,
    private _collectionService: CollectionService,
    private meta: Meta
  ) {
    this.unaffiliatedUser = this._auth.isPublicOnly() ? true : false
  }

  ngOnInit() {

    this.subscriptions.push(
      this._auth.currentUser.pipe(
        map(user => {
        // userSessionFresh: Do not attempt to call collection endpoint until we know user object is fresh
        if (!this.userSessionFresh && this._auth.userSessionFresh) {
          this.userSessionFresh = true
          this.routeParamSubscrpt()
        }
      })).subscribe()
    );

  } // OnInit

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }

  private routeParamSubscrpt(): void {
    this.route.params.pipe(
      map(routeParams => {
        this.colId = routeParams['colId'];
        // Old links pass a name into the ID, just use that as a search term instead
        if (!/^[0-9]+$/.test(this.colId)) {
          this.http.get('/assets/collection-links.json').pipe(
            map(data => {
              let linkObj = data
              let link = linkObj[this.colId]
              if (link) {
                this._router.navigateByUrl(link)
              } else {
                this._router.navigate(['/search', this.colId.replace('_', ' ')])
              }
            }
          )).subscribe()

        } else if (this.colId) {
          this._assets.clearAssets();
            this._collectionService.getCollectionInfo(this.colId)
              .then((data) => {
                this._assets.queryAll(routeParams, true);

                if (!Object.keys(data).length) {
                  throw new Error('No data!');
                }

                this.assetCount = data['objCount'];
                this.colName = data['collectionname'];
                this.colDescription = data['blurburl'];
                this.colThumbnail = data['bigimageurl'];

                // Set page title
                this._title.setSubtitle(this.colName)


                // Update OGP meta tags
                this.meta.updateTag({ property: "og:title", content: this.colName }, 'property="og:title"')
                this.meta.updateTag({ property: "og:description", content: data['shortDescription'] }, 'property="og:description"')
                this.meta.updateTag({ property: "og:image", content: this.colThumbnail }, 'property="og:image"')
              })
              .catch((error) => {
                console.error(error);
                if (error.status === 401){
                  this.unaffiliatedUser = true
                  this.showAccessDeniedModal = true
                }
              });
        }
    })).subscribe()

  }
  // private updateSearchInRes(value: boolean): void{
  //  this.searchInResults = value;
  // }
}
