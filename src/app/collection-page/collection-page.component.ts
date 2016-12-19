import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription }   from 'rxjs/Subscription';

// Internal Dependencies
import { CollectionService } from './collection.service';
import { AssetService } from './../shared/assets.service';

@Component({
  selector: 'ang-collection-page', 
  providers: [CollectionService],
  styleUrls: [ './collection-page.component.scss' ],
  templateUrl: './collection-page.component.html'
})

export class CollectionPage implements OnInit, OnDestroy {

  private colId: string;
  private colName: string;
  private colDescription: string;
  private colThumbnail: string;
  
  private subscriptions: Subscription[] = [];


  constructor(private _collection: CollectionService, private _assets: AssetService, private _router: Router, private route: ActivatedRoute) {
    _collection
  }

  ngOnInit() {
    this.subscriptions.push(
      this.route.params.subscribe((routeParams) => {
        this.colId = routeParams["colId"];
        if (this.colId) {
          this._collection.getCollectionInfo(this.colId)
            .then((data) => {
              this._assets.queryAll(routeParams);

              if (!data) {
                throw new Error("No data!");
              }
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

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }
}