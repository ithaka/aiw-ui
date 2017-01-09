import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription }   from 'rxjs/Subscription';

// Internal Dependencies
import { ImageGroupService } from './image-group.service';
import { AssetService } from './../shared/assets.service';

import { ImageGroup } from './../shared';

@Component({
  selector: 'ang-image-group', 
  providers: [ImageGroupService],
  styleUrls: [ './image-group-page.component.scss' ],
  templateUrl: './image-group-page.component.html'
})

export class ImageGroupPage implements OnInit, OnDestroy {
  private ig: ImageGroup;

  private subscriptions: Subscription[] = [];

  /** controls when PPT agreement modal is or is not shown */
  private showPptModal: boolean = false;

  constructor(private _igService: ImageGroupService, private _router: Router, private _assets: AssetService, private route: ActivatedRoute) {
  }

  ngOnInit() {
    // Subscribe to ID in params
    this.subscriptions.push(
      this.route.params.subscribe((routeParams) => {
        let id = routeParams["igId"];
        if (id) {
          this._assets.queryAll(routeParams);
        }
      })
    );

    this.subscriptions.push(
      this._assets.allResults.subscribe((results: ImageGroup) => {
        this.ig = results;
        if (this.ig && this.ig.igId) {
          this._igService.getGroupDescription(this.ig.igId).take(1)
            .subscribe((desc: string) => { this.ig.description = desc; });
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }

  private downloadImageGroup() {
    // make call to get number of allowed downloads
    // not sure which service to call yet - contacted Will about it
    this._assets.downloadPpt(this.ig).take(1).subscribe(
      (data) => { console.log(data); },
      (error) => { console.log(error); }
    )
  }
}