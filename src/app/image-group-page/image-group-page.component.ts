import { Component, OnInit } from '@angular/core';

import { ImageGroupService } from './image-group.service';

@Component({
  selector: 'ang-image-group', 
  providers: [ImageGroupService],
  styles: [ './image-group-page.component.scss' ],
  templateUrl: './image-group-page.component.html'
})

export class ImageGroupPage implements OnInit {
  private igDesc: string;

  constructor(private igService: ImageGroupService) {
  }

  ngOnInit() {
    // test for getFromFolderId
    // this.igService.getFromFolderId("683295")
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

    // test for getFromCatId
    this.igService.getFromCatId("1034568975")
      .then((data) => {
        if (!data) {
          throw new Error("No data in image group description response");
        }
        
        console.log("Description response data: ");
        console.log(data);
        // this.title = data.title;
      })
      .catch((error) => { console.error(error) });
  }
}