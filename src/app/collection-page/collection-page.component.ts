import { Component, OnInit, OnDestroy } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription }   from 'rxjs/Subscription';

// Internal Dependencies
import { CollectionService } from './collection.service';
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

  private colId: string;
  private colName: string;
  private colDescription: string;
  private colThumbnail: string;
  private assetCount: number;
  
  private subscriptions: Subscription[] = [];


  constructor(
    private _assets: AssetService,
    private _auth: AuthService,
    private _router: Router,
    private route: ActivatedRoute,
    private http: Http
  ) {}

  ngOnInit() {
    this.subscriptions.push(
      this.route.params.subscribe((routeParams) => {
        this.colId = routeParams["colId"];
        if (this.colId) {
          this.getCollectionInfo(this.colId)
            .then((data) => {
              this._assets.queryAll(routeParams);

              if (!data) {
                throw new Error("No data!");
              }

              this.assetCount = data.objCount;
              this.colName = data.collectionname;
              this.colDescription = data.blurburl;
              this.colThumbnail = data.bigimageurl;
            })
            .catch((error) => { 
              console.error(error); 
            });
        }
      })
    )// End push to subscription
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

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }
}