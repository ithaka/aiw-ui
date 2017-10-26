import { Component, OnInit, OnDestroy } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Router, ActivatedRoute, UrlSegment } from '@angular/router';
import { Subscription }   from 'rxjs/Subscription';

// Internal Dependencies
import { AnalyticsService } from '../analytics.service';
import { AssetService } from './../shared/assets.service';
import { AuthService } from './../shared/auth.service';
import { TitleService } from '../shared/title.service';

@Component({
  selector: 'ang-category-page',
  providers: [],
  styleUrls: [ './category-page.component.scss' ],
  templateUrl: './category-page.component.pug'
})

export class CategoryPage implements OnInit, OnDestroy {

  private header = new Headers({ 'Content-Type': 'application/json' }); // ... Set content type to JSON
  private options = new RequestOptions({ headers: this.header, withCredentials: true }); // Create a request option

  private catId: string;
  private catName: string;
  private catDescription: string;
  private catThumbnail: string;
  private assetCount: number;
  private allowSearchInRes: boolean = true;

  // Anomalies
  private isSubCategory: boolean = false;

  private subscriptions: Subscription[] = [];

  // private searchInResults: boolean = false;


  constructor(
    private _assets: AssetService,
    private _auth: AuthService,
    private _router: Router,
    private route: ActivatedRoute,
    private http: Http,
    private _analytics: AnalyticsService,
    private _title: TitleService
  ) {}

  ngOnInit() {
    this.subscriptions.push(
      this.route.params.subscribe((routeParams) => {
        this.catId = routeParams['catId'];

        this.allowSearchInRes = routeParams.browseType && !routeParams.browseType.match(/260|250|103/)

        let params = Object.assign({}, routeParams);
        // If a page number isn't set, reset to page 1!
        if (!params['page']){
          params['page'] = 1;
        }

        if (this.catId) {
          // Tell AssetService to load thumbnails (Asset Grid will get them)
          this._assets.queryAll(params);

          // Get Category metadata
          this.getCategoryInfo(this.catId)
            .then((data) => {

              if (data) {
                this.catDescription = data.blurbUrl;
                this.catThumbnail = data.imageUrl;
              } else {
                // Some categories don't have descriptions
              }

            })
            .catch((error) => {
              console.error(error);
            });

          // Get Category data
          this.getCategoryData(this.catId)
          .then((data) => {

            if (data) {
              this.catName = data.categoryName;
              this.assetCount = data.objCount;
              // Set page title
              this._title.setSubtitle(this.catName);
            } else {
              // no data
            }

          })
          .catch((error) => {
            console.error(error);
          });
        }
      })
    );// End push to subscription

    this.subscriptions.push(
       this.route.url
        .subscribe((url: UrlSegment[]) => {
          this.isSubCategory = url[0].path === 'subcategory';
        })
    );

    this._analytics.setPageValues('category', this.catId)
  } // OnInit


  /**
  * Get metadata about a Category
  * @param catId The Category ID
  */
  private getCategoryInfo(catId: string) {
      let options = new RequestOptions({ withCredentials: true });

      // Can be removed once region specific ids are no longer used
      if (catId.indexOf('103') == 1) {
        catId = catId.slice(1)
      }

      return this.http
          .get(this._auth.getUrl() + '/categorydesc/' + catId, options)
          .toPromise()
          .then(this._auth.extractData);
  }

  /**
  * Get title for a Category
  * @param catId The Category ID
  */
  private getCategoryData(catId: string) {
    let options = new RequestOptions({ withCredentials: true });

    // Can be removed once region specific ids are no longer used
    if (catId.indexOf('103') == 1) {
      catId = catId.slice(1)
    }

    return this.http
        .get(this._auth.getUrl() + '/categories/' + catId, options)
        .toPromise()
        .then(this._auth.extractData);
}

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }

  // private updateSearchInRes(value: boolean): void{
  //  this.searchInResults = value;
  // }
}
