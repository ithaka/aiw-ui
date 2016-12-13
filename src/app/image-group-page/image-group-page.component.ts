import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription }   from 'rxjs/Subscription';

import { ImageGroupService } from './image-group.service';

@Component({
  selector: 'ang-image-group', 
  providers: [ImageGroupService],
  styles: [ './image-group-page.component.scss' ],
  templateUrl: './image-group-page.component.html'
})

export class ImageGroupPage implements OnInit, OnDestroy {
  private igDesc: string;
  private folderId: string;
  private subscriptions: Subscription[] = [];

  constructor(private _igService: ImageGroupService, private _router: Router, private _route: ActivatedRoute) {
  }

  ngOnInit() {
    this._route.snapshot.params["folderId"];
    this.subscriptions.push(
      this._route.params.subscribe((matrixParams) => {
        this.folderId = matrixParams["folderId"];
        this._igService.getFromFolderId(this.folderId)
          .then((data) => {
            if (!data) {
              throw new Error("No data in image group description response");
            }
            data = data.pop();

            console.log("Good data: ");
            console.log(data);
            this.igDesc = data.igDesc;
          })
          .catch((error) => { console.error(error); });
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