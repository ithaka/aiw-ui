import { Component, OnInit, OnDestroy } from '@angular/core'
import { Router, ActivatedRoute, Params } from '@angular/router'
import { Subscription }   from 'rxjs'
import { map } from 'rxjs/operators'

import { AssetService } from './../shared/assets.service'
@Component({
  selector: 'ang-cluster-page',
  providers: [],
  styles: [ '' ],
  templateUrl: './cluster-page.component.pug'
})

export class ClusterPage implements OnInit, OnDestroy {
  // Cluster Asset Title
  public clusterObjTitle: string;
  private subscriptions: Subscription[] = [];
  private clusterId: string;

  // TypeScript public modifiers
  constructor(
    private route: ActivatedRoute,
    private _assets: AssetService,
  ) {}

  ngOnInit() {
    this.subscriptions.push(
      this.route.params.pipe(
        map((routeParams: Params) => {
          this.clusterId = routeParams['clusterId'];
          let params = Object.assign({}, routeParams);
          // If a page number isn't set, reset to page 1!
          if (!params['page']){
            params['page'] = 1;
          }
          if (this.clusterId) {
            this._assets.queryAll(params);
          }
          if (routeParams['objTitle']) {
            this.clusterObjTitle = routeParams['objTitle'];
          }
        })).subscribe()
    );

  } // OnInit

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }

}
