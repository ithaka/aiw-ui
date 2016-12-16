import { Component } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Subscription }   from 'rxjs/Subscription';

@Component({
  selector: 'ang-cluster-page', 
  providers: [],
  styles: [ '' ],
  templateUrl: './cluster-page.component.html'
})

export class ClusterPage {
  private subscriptions: Subscription[] = [];
  // Cluster Asset Title
  private clusterObjTitle: string;

  // TypeScript public modifiers
  constructor(
    private route: ActivatedRoute
  ) {   
  } 

  ngOnInit() {
    this.subscriptions.push(
      this.route.params
      .subscribe((params: Params) => { 
        console.log(params);
        if(params['objTitle']){
          this.clusterObjTitle = params['objTitle'];
        }
      })
    );
  }

}