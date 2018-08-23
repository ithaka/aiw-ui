import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription }   from 'rxjs/Subscription';
import 'rxjs/add/operator/toPromise';

import { AuthService } from './../shared/auth.service';
import { AssetService } from './../shared/assets.service';
import { MetadataService } from '../shared';

@Component({
  selector: 'ang-associated-page',
  providers: [],
  styles: [ '' ],
  templateUrl: './associated-page.component.pug'
})

export class AssociatedPage implements OnInit, OnDestroy {
  // array of all subscriptions, which is destroyed OnDestroy
  private subscriptions: Subscription[] = [];
  // the object id for which to retrieve related assets (retrieved from matrix param)
  private objectId: string;
  // the colection which the associated asset comes from
  private colId: string;
  // gets assigned with the asset's title
  private assetTitle: string;

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
      this.route.params.subscribe((routeParams) => {
        this.objectId = routeParams['objectId'];
        this.colId = routeParams['colId'];
        let params = Object.assign({}, routeParams);
        // If a page number isn't set, reset to page 1!
        if (!params['page']){
          params['page'] = 1;
        }
        if (this.objectId && this.colId) {
          this._assets.queryAll(params);
          this._metadata.getMetadata(this.objectId)
            .take(1)
            .subscribe((res) => {
              if (res.metadata && res.metadata.length > 0 && res.metadata[0].title) {
                this.assetTitle = res.metadata[0].title
              }
            }, (err) => {
              console.error(err)
            })
        }
      })
    );
  } // OnInit

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }
}
