import { Component, OnInit, OnDestroy } from '@angular/core'
import { Meta } from '@angular/platform-browser'
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { Router, ActivatedRoute, UrlSegment } from '@angular/router'
import { Subscription } from 'rxjs'
import { map } from 'rxjs/operators'

// Internal Dependencies
import { AssetService } from './../shared/assets.service'
import { AuthService } from './../shared/auth.service'
import { TitleService } from '../shared/title.service'

@Component({
  selector: 'ang-category-page',
  providers: [],
  styleUrls: [ './category-page.component.scss' ],
  templateUrl: './category-page.component.pug'
})

export class CategoryPage implements OnInit, OnDestroy {
  public catName: string;
  public catDescription: string;
  public catThumbnail: string;
  public showAccessDeniedModal: boolean = false

  private header = new HttpHeaders().set('Content-Type', 'application/json'); // ... Set content type to JSON
  private options = { headers: this.header, withCredentials: true }; // Create a request option

  private user: any = this._auth.getUser();

  private catId: string;

  private subscriptions: Subscription[] = [];

  // private searchInResults: boolean = false;
  private unaffiliatedUser: boolean = false

  constructor(
    private _assets: AssetService,
    private _auth: AuthService,
    private _router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
    private _title: TitleService,
    private meta: Meta
  ) {
    this.unaffiliatedUser = this._auth.isPublicOnly() ? true : false
  }

  ngOnInit() {
    // Subscribe User object updates
    this.subscriptions.push(
      this._auth.currentUser.pipe(
        map(userObj => {
          this.user = userObj;
        },
        (err) => {
          console.error('Failed to load user information', err)
        }
      )).subscribe()
    )

    this.subscriptions.push(
      this.route.params.pipe(
        map(routeParams => {
          this.catId = routeParams['catId'];
          let params = Object.assign({}, routeParams);
          // If a page number isn't set, reset to page 1!
          if (!params['page']){
            params['page'] = 1;
          }

          if (this.catId) {
            // If the _auth.isPublicOnly()  doesn't match the component's "unaffiliatedUser" flag then refresh search results
            let refreshSearch = this.unaffiliatedUser && this._auth.isPublicOnly() ? false : true

            // Tell AssetService to load thumbnails (Asset Grid will get them)
            this._assets.queryAll(params, refreshSearch);

            // Get Category metadata
            this.getCategoryInfo(this.catId)
              .then((data) => {

                if (data) {
                  this.catDescription = data['blurbUrl']
                  this.catThumbnail = data['imageUrl']
                } else {
                  // Some categories don't have descriptions
                }

              })
              .catch((error) => {
                console.error(error);
                if (error.status === 401) {
                  // Categories are ADL collections only, so we can make this assumption
                  this.unaffiliatedUser = true
                  this.showAccessDeniedModal = true
                }
              });

            // Get Category data
            this.getCategoryData(this.catId)
            .then((data) => {
              if (data) {
                this.catName = data['categoryName'];
                // Set page title
                this._title.setSubtitle(this.catName);

                // Update OGP meta tags
                this.meta.updateTag({ property: "og:title", content: this.catName }, 'property="og:title"')
                this.catDescription && this.meta.updateTag({ property: "og:description", content: this.catDescription }, 'property="og:description"')
                this.meta.updateTag({ property: "og:url", content: window.document.location.href }, 'property="og:url"')
                this.meta.updateTag({ property: "og:image", content: this.catThumbnail }, 'property="og:image"')
              }
            })
            .catch((error) => {
              console.error(error);
              if (error.status === 401) {
                // Categories are ADL collections only, so we can make this assumption
                this.unaffiliatedUser = true
                this.showAccessDeniedModal = true
              }
            });
          }
        }
      )).subscribe()

    ) // End push to subscription

  } // OnInit

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }


  /**
  * Get metadata about a Category
  * @param catId The Category ID
  */
  private getCategoryInfo(catId: string) {
      let options = { withCredentials: true };

      // Can be removed once region specific ids are no longer used
      // if (catId.indexOf('103') == 1) {
      //   catId = catId.slice(1)
      // }

      return this.http
          .get(this._auth.getUrl() + '/categorydesc/' + catId, options)
          .toPromise();
  }

  /**
  * Get title for a Category
  * @param catId The Category ID
  */
  private getCategoryData(catId: string) {
    let options = { withCredentials: true };

    // Can be removed once region specific ids are no longer used
    // if (catId.indexOf('103') == 1) {
    //   catId = catId.slice(1)
    // }

    return this.http
        .get(this._auth.getUrl() + '/categories/' + catId, options)
        .toPromise();
}

  // private updateSearchInRes(value: boolean): void{
  //  this.searchInResults = value;
  // }
}
