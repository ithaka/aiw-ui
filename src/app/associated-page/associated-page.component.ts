import { Component, OnInit, OnDestroy } from '@angular/core'
import { Router, ActivatedRoute } from '@angular/router'
import { Subscription }   from 'rxjs'
import { map, take } from 'rxjs/operators'

// Project Dependencies
import { AssetService, AuthService, MetadataService } from '_services'

@Component({
  selector: 'ang-associated-page',
  providers: [],
  styles: [ '' ],
  templateUrl: './associated-page.component.pug'
})

export class AssociatedPage implements OnInit, OnDestroy {
  // gets assigned with the asset's title
  public assetTitle: string;
  // array of all subscriptions, which is destroyed OnDestroy
  private subscriptions: Subscription[] = [];
  // the object id for which to retrieve related assets (retrieved from matrix param)
  private objectId: string;
  // the colection which the associated asset comes from
  private colId: string;

  constructor(
      private _router: Router,
      private _assets: AssetService,
      private _metadata: MetadataService,
      private route: ActivatedRoute,
      private _auth: AuthService
    ) {}

  /**
   * Sets up subscription to objectId matrix param, which gets assetTitle from service
   */
  ngOnInit() {
    this.subscriptions.push(
      this.route.params.pipe(
        map(routeParams => {
        this.objectId = routeParams['objectId'];
        let params = Object.assign({}, routeParams);
        // If a page number isn't set, reset to page 1!
        if (!params['page']){
          params['page'] = 1;
        }
        if (this.objectId) {
          this._assets.queryAll(params);
          this._metadata.buildAsset(this.objectId).pipe(
            take(1),
            map(asset => {
              if (asset) {
                this.assetTitle = asset.title
              }
            }, (err) => {
              console.error(err)
            })).subscribe()
        }
      })).subscribe()
    );
  } // OnInit

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }
}
