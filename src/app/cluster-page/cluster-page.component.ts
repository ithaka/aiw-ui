import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Subscription }   from 'rxjs/Subscription';

import { AssetService } from './../shared/assets.service';

@Component({
  selector: 'ang-cluster-page', 
  providers: [],
  styles: [ '' ],
  templateUrl: './cluster-page.component.html'
})

export class ClusterPage implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  // Cluster Asset Title
  private clusterObjTitle: string;
  private objectId: string;

  // TypeScript public modifiers
  constructor(
    private route: ActivatedRoute,
    private _assets: AssetService
  ) {   
  } 

  ngOnInit() {
    this.subscriptions.push(
      this.route.params
        .subscribe((routeParams: Params) => {
          this.objectId = routeParams["objectId"];
          if (this.objectId) {
            this._assets.queryAll();
          }
          // console.log(routeParams);
          if(routeParams['objTitle']) {
            

            this.clusterObjTitle = routeParams['objTitle'];
          }
        })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }

}