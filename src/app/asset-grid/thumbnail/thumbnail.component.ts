import { Router } from '@angular/router';
import { Component, OnInit, Input } from '@angular/core';

import { Thumbnail } from './../../shared'
import { AssetService } from './../../shared';

@Component({
  selector: 'ang-thumbnail',
  templateUrl: 'thumbnail.component.pug',
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
  private thumbnail: Thumbnail

  @Input()
  private largeThmbView: boolean

  @Input()
  private reorderMode: boolean

  @Input()
  private editMode: boolean

  private constraints: any = {}
  private collectionType: number = 0

  private collectionTypeMap: any = {
    0: { name: '', alt: '' },
    1: { name: "artstor-asset", alt: "Artstor Digital Library" },
    2: { name: "institution-asset", alt: "Institution Collections" },
    3: { name: "personal-asset", alt: "Private Collections" },
    4: { name: "institution-asset", alt: "Institution Collections" },
    5: { name: "ssc-asset", alt: "Shared Shelf Commons" },
    6: { name: "personal-asset", alt: "Private Collections" }
  }

  constructor(
    private _assets: AssetService,
    private router: Router
  ) {
   }

  ngOnInit() {
    // Clean search data
    if (this.thumbnail['media']) {
      let media = JSON.parse(this.thumbnail['media'])
      this.thumbnail['thumbnailImgUrl'] = media['thumbnailSizeOnePath']
      this.thumbnail['objectTypeId'] = media['adlObjectType']
    }
    // Set collection type for assets from Solr
    if (this.thumbnail['collectiontypes']) {
      this.collectionType = this.thumbnail['collectiontypes'][0]
    }

    this.thumbnail.iapFlag = this.determineIAP(this.thumbnail['artstorid'] ? this.thumbnail['artstorid'] : this.thumbnail['objectId'])
  }

  openLink(event: Event, urlParams: any[]) {
    // Prevent the parent anchor tag from firing
    event.preventDefault()
    event.stopPropagation()

    this.router.navigate(urlParams)
  }

  /**
   * Determine if asset is IAP
   * @param assetId this should be the asset's id, but if it's undefined, return false
   */
  determineIAP (assetId: string) {
    if (!assetId) {
      return 0
    } else {
       // matches on IAP String, return 1 for true, 0 for false
      return assetId.match(/IAP/) ? 1 : 0
    }
  }

  /**
   * Returns collection name and alt text based on Collection Type number
   * - Does so in safe manner, avoiding template errors
   */
  getCollectionType(): any {
    let mapResult = this.collectionTypeMap[this.collectionType ? this.collectionType : this.thumbnail.collectionType]
    return mapResult ? mapResult : { name: '', alt: ''}
  }
}
