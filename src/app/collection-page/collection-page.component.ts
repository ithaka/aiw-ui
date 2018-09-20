import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription }   from 'rxjs/Subscription';

// Internal Dependencies
import { AssetService } from './../shared/assets.service';
import { AuthService } from './../shared/auth.service';
import { TitleService } from '../shared/title.service';
import { ScriptService } from '../shared';

@Component({
  selector: 'ang-collection-page',
  providers: [],
  styleUrls: [ './collection-page.component.scss' ],
  templateUrl: './collection-page.component.pug'
})

export class CollectionPage implements OnInit, OnDestroy {

  private header = new HttpHeaders().set('Content-Type', 'application/json'); // ... Set content type to JSON
  private options = { headers: this.header, withCredentials: true }; // Create a request option

  private colId: string = '';
  private colName: string = '';
  private colDescription: string = '';
  private colThumbnail: string = '';
  private assetCount: number;
  private descCollapsed: boolean = true;
  private unaffiliatedUser: boolean = false;
  private showAccessDeniedModal: boolean = false;

  private subscriptions: Subscription[] = [];
  private userSessionFresh: boolean = false;

  // private searchInResults: boolean = false;


  constructor(
    private _assets: AssetService,
    private _auth: AuthService,
    private _router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
    private _title: TitleService,
    private _script: ScriptService
  ) {
    this.unaffiliatedUser = this._auth.isPublicOnly() ? true : false
  }

  ngOnInit() {
    /** ETHNIO SCRIPT */
    this._script.loadScript('ethnio')
      .then( data => {
        console.log("Loaded script", data)
      })
    .catch( error => console.error(error) )
    /** ETHNIO SCRIPT */

    this.subscriptions.push(
      this._auth.currentUser.subscribe((user) => {
        // userSessionFresh: Do not attempt to call collection endpoint until we know user object is fresh
        if (!this.userSessionFresh && this._auth.userSessionFresh) {
          this.userSessionFresh = true
          this.routeParamSubscrpt()
        }
      })
    );

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
      .toPromise();
  }

  private routeParamSubscrpt(): void {
    this.route.params.subscribe((routeParams) => {
      this.colId = routeParams['colId'];
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
          this.getCollectionInfo(this.colId)
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
            })
            .catch((error) => {
              console.error(error);
              if (error.status === 401){
                this.unaffiliatedUser = true
                this.showAccessDeniedModal = true
              }
            });
        }
    })
  }

  // private updateSearchInRes(value: boolean): void{
  //  this.searchInResults = value;
  // }
}
