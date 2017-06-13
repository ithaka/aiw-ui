import { Component, OnInit, Input } from '@angular/core';

import { Thumbnail } from './../../shared'
import { AssetService } from './../../shared';

@Component({
  selector: 'ang-thumbnail',
  templateUrl: 'thumbnail.component.html',
  styles: [`
    .card-icon-group {
        height: 19px;
    }
    .disablePointerEvents{
        pointer-events: none;
    }
  `]
})
export class ThumbnailComponent implements OnInit {
  @Input()
  private thumbnail: Thumbnail;

  @Input()
  private reorderMode: boolean;

  @Input()
  private editMode: boolean;

  private collectionTypeMap: any = {
    1: { name: "artstor-asset", alt: "Artstor Digital Library" },
    2: { name: "institution-asset", alt: "Institution Collections" },
    3: { name: "personal-asset", alt: "Private Collections" },
    4: { name: "institution-asset", alt: "Institution Collections" },
    5: { name: "ssc-asset", alt: "Shared Shelf Commons" },
    6: { name: "personal-asset", alt: "Private Collections" }
  }

  constructor(
    private _assets: AssetService
  ) {
   }

  ngOnInit() { 
    // Clean search data
    if (this.thumbnail['media']) {
      let media = JSON.parse(this.thumbnail['media'])
      this.thumbnail['thumbnailImgUrl'] = media['thumbnailSizeOnePath']
    }
  }
}