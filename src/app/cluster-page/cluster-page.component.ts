import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Subscription }   from 'rxjs/Subscription';

import { AssetService } from './../shared/assets.service';
@Component({
  selector: 'ang-cluster-page',
  providers: [],
  styles: [ '' ],
  templateUrl: './cluster-page.component.pug'
})

export class ClusterPage implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  // Cluster Asset Title
  private clusterObjTitle: string;
  private clusterId: string;

  // TypeScript public modifiers
  constructor(
    private route: ActivatedRoute,
    private _assets: AssetService,
  ) {}

  ngOnInit() {
    this.subscriptions.push(
      this.route.params
        .subscribe((routeParams: Params) => {
          this.clusterId = routeParams["clusterId"];
          let params = Object.assign({}, routeParams);
          // If a page number isn't set, reset to page 1!
          if (!params['page']){
            params['page'] = 1;
          }
          if (this.clusterId) {
            this._assets.queryAll(params);
          }
          if(routeParams['objTitle']) {
            this.clusterObjTitle = routeParams['objTitle'];
          }
        })
    );

  } // OnInit

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }

}
