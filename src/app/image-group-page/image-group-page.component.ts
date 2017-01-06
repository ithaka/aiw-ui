import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription }   from 'rxjs/Subscription';

// Internal Dependencies
import { ImageGroupService } from './image-group.service';
import { AssetService } from './../shared/assets.service';

@Component({
  selector: 'ang-image-group', 
  providers: [ImageGroupService],
  styleUrls: [ './image-group-page.component.scss' ],
  templateUrl: './image-group-page.component.html'
})

export class ImageGroupPage implements OnInit, OnDestroy {
  private igDesc: string;
  private igId: string;
  private subscriptions: Subscription[] = [];

  /** controls when PPT agreement modal is or is not shown */
  private showPptModal: boolean = false;

  constructor(private _igService: ImageGroupService, private _router: Router, private _assets: AssetService, private route: ActivatedRoute) {
  }

  ngOnInit() {
    // Subscribe to ID in params
    this.subscriptions.push(
      this.route.params.subscribe((routeParams) => {
        this.igId = routeParams["igId"];
        if (this.igId) {
          this._assets.queryAll(routeParams);

          this._igService.getGroupDescription(this.igId)
            .then((data) => {
              if (!data) {
                throw new Error("No data in image group description response");
              }
              this.igDesc = data.igNotes;
            })
            .catch((error) => { console.error(error); });
        }
        
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }

  private getAllowedDownloads() {
    // make call to get number of allowed downloads
    // not sure which service to call yet - contacted Will about it
  }
}