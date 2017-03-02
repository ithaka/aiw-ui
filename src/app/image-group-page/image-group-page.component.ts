import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription }   from 'rxjs/Subscription';

// Internal Dependencies
import { ImageGroupService } from './image-group.service';
import { AssetService, AuthService } from './../shared';

import { ImageGroup, ImageGroupDescription, IgDownloadInfo } from './../shared';

@Component({
  selector: 'ang-image-group', 
  providers: [ImageGroupService],
  styleUrls: [ './image-group-page.component.scss' ],
  templateUrl: './image-group-page.component.html'
})

export class ImageGroupPage implements OnInit, OnDestroy {
  private ig: ImageGroup = <ImageGroup>{};
  private user: any;
  private showLoginModal: boolean = false;

  private subscriptions: Subscription[] = [];

  /** controls when PPT agreement modal is or is not shown */
  private showPptModal: boolean = false;

  constructor(
    private _igService: ImageGroupService,
    private _router: Router,
    private _assets: AssetService,
    private _auth: AuthService,
    private route: ActivatedRoute
  ) {
  }

  ngOnInit() {
    this.user = this._auth.getUser();

    // Subscribe to ID in params
    this.subscriptions.push(
      this.route.params.subscribe((routeParams) => {
        let id = routeParams["igId"];
        let params = Object.assign({}, routeParams);
        // If a page number isn't set, reset to page 1!
        if (!params['currentPage']){
          params['currentPage'] = 1;
        } 
        if (id) {
          this._assets.queryAll(params);
        }
      })
    );

    this.subscriptions.push(
      this._assets.allResults.subscribe((results: ImageGroup) => {

        if (results.igId) {
          // Set ig properties from results
          this.ig.igId = results.igId;
          this.ig.count = results.count;
          this.ig.igName = results.igName;

          // Get IG description, since we can rely on it from 
          this._igService.getGroupDescription(results.igId).take(1)
            .subscribe((desc: ImageGroupDescription) => { 
              this.ig.description = desc;
            });

          // get the user's download count
          this._igService.getDownloadCount(this.ig.igId)
            .take(1)
            .subscribe((res: IgDownloadInfo) => {
              this.ig.igDownloadInfo = res;
            }, (err) => {
              console.error(err);
            });
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }
}