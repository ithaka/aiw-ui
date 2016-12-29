import { Component, OnInit, OnDestroy } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Router, ActivatedRoute, UrlSegment } from '@angular/router';
import { Subscription }   from 'rxjs/Subscription';

// Internal Dependencies
import { AssetService } from './../shared/assets.service';
import { AuthService } from './../shared/auth.service';

@Component({
  selector: 'ang-category-page', 
  providers: [],
  styleUrls: [ './category-page.component.scss' ],
  templateUrl: './category-page.component.html'
})

export class CategoryPage implements OnInit, OnDestroy {

  private header = new Headers({ 'Content-Type': 'application/json' }); // ... Set content type to JSON
  private options = new RequestOptions({ headers: this.header, withCredentials: true }); // Create a request option

  private catId: string;
  private catName: string;
  private catDescription: string;
  private catThumbnail: string;
  private assetCount: number;

  // Anomalies
  private isSubCategory: boolean = false;
  
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
        this.catId = routeParams['catId'];
        this.catName = routeParams['name'];
        
        if (this.catId) {
          this.getCategoryInfo(this.catId)
            .then((data) => {
              this._assets.queryAll(routeParams);

              if (!data) {
                throw new Error("No data!");
              }

              this.catDescription = data.blurbUrl;
              this.catThumbnail = data.imageUrl;
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

  }

  /**
  * Get metadata about a Category
  * @param catId The Category ID
  */
  private getCategoryInfo(catId: string) {
      let options = new RequestOptions({ withCredentials: true });

      return this.http
          .get(this._auth.getUrl() + '/categorydesc/' + catId, options)
          .toPromise()
          .then(this._auth.extractData);
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }
}