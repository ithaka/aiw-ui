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
  `]
})
export class ThumbnailComponent implements OnInit {
  @Input()
  private thumbnail: Thumbnail;

  private collectionTypeMap: any = {
    1: "artstor-asset",
    2: "institution-asset",
    3: "personal-asset",
    4: "institution-asset",
    5: "ssc-asset",
    6: "personal-asset"
  }

  constructor(
    private _assets: AssetService
  ) { }

  ngOnInit() { 
  }
}