import { Title } from '@angular/platform-browser';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription }   from 'rxjs/Subscription';

// Internal Dependencies
// import { CollectionService } from './collection.service';
import { AnalyticsService } from '../analytics.service';
import { AssetService } from './../shared/assets.service';
import { AuthService } from './../shared/auth.service';

@Component({
  selector: 'ang-collection-page', 
  providers: [],
  styleUrls: [ './collection-page.component.scss' ],
  templateUrl: './collection-page.component.html'
})

export class CollectionPage implements OnInit, OnDestroy {

  private header = new Headers({ 'Content-Type': 'application/json' }); // ... Set content type to JSON
  private options = new RequestOptions({ headers: this.header, withCredentials: true }); // Create a request option

  private colId: string = '';
  private colName: string = '';
  private colDescription: string = '';
  private colThumbnail: string = '';
  private assetCount: number;
  private descCollapsed: boolean = true;
  private showaccessDeniedModal: boolean = false;
  
  private subscriptions: Subscription[] = [];

  // private searchInResults: boolean = false;


  constructor(
    private _assets: AssetService,
    private _auth: AuthService,
    private _router: Router,
    private route: ActivatedRoute,
    private http: Http,
    private _analytics: AnalyticsService,
    private _title: Title
  ) {}

  ngOnInit() {
    this.subscriptions.push(
      this.route.params.subscribe((routeParams) => {
        this.colId = routeParams["colId"];
        // Old links pass a name into the ID, just use that as a search term instead
        if (!/^[0-9]+$/.test(this.colId)) {
          this._router.navigate(['/search', this.colId.replace('_', ' ')])
        }

        if (this.colId) {
          this._assets.clearAssets();
          this.getCollectionInfo(this.colId)
            .then((data) => {
              this._assets.queryAll(routeParams, true);

              if (!data) {
                throw new Error("No data!");
              }

              this.assetCount = data.objCount;
              this.colName = data.collectionname;
              this.colDescription = data.blurburl;
              this.colThumbnail = data.leadImageURL;

              // Set page title
              this._title.setTitle("Artstor | " + this.colName)
            })
            .catch((error) => { 
              console.error(error); 
              if(error.status === 401){
                this.showaccessDeniedModal = true;
              }
            });
        }
      })
    );// End push to subscription
    this._analytics.setPageValues('collection', this.colId)
  } // OnInit

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }

  /**
  * Get metadata about a collection
  * @param colId The collection ID
  */
  private getCollectionInfo(colId: string) {
      let options = new RequestOptions({ withCredentials: true });

      return this.http
          .get(this._auth.getUrl() + '/collections/' + colId, options)
          .toPromise()
          .then(this._auth.extractData);
  }


  private resourceAccessDenied(): void{
    this.showaccessDeniedModal = false;
     this._router.navigate(['/home']);
  }

  // private updateSearchInRes(value: boolean): void{
  //  this.searchInResults = value; 
  // }
}