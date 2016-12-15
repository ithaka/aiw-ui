import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription }   from 'rxjs/Subscription';

// Internal Dependencies
import { ImageGroupService } from './image-group.service';
import { AssetService } from './../home/assets.service';

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

  constructor(private _igService: ImageGroupService, private _router: Router, private route: ActivatedRoute) {
  }

  ngOnInit() {
    // This is a test: not really sure why we are running this? But this is the only place we do it
    this.route.snapshot.params["igId"];
    
    // Subscribe to ID in params
    this.subscriptions.push(
      this.route.params.subscribe((matrixParams) => {
        this.igId = matrixParams["igId"];
        if (this.igId) {
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



    // // test for getFromFolderId
    // this._igService.getFromFolderId("683295")
    //   .then((data) => {
    //     if (!data) {
    //       throw new Error("No data in image group description response");
    //     }
    //     data = data.pop();

    //     console.log("Good data: ");
    //     console.log(data);
    //     this.igDesc = data.igDesc;
    //   })
    //   .catch((error) => { console.error(error); });

    // // test for getFromCatId
    // this._igService.getFromCatId("1034568975")
    //   .then((data) => {
    //     if (!data) {
    //       throw new Error("No data in image group description response");
    //     }
        
    //     console.log("Description response data: ");
    //     console.log(data);
    //     // this.title = data.title;
    //   })
    //   .catch((error) => { console.error(error) });
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }
}