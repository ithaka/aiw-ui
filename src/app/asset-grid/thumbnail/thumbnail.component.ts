import { Router } from '@angular/router';
import { Component, OnInit, Input } from '@angular/core';

import { Thumbnail, AssetService, CollectionTypeHandler } from './../../shared'

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
  private collectionTypeHandler: CollectionTypeHandler = new CollectionTypeHandler()

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

  // wrapper function for getting the collection type
  getCollectionType(): { name: string, alt: string } {
    // Some endpoints give us the collectionType info in 'collectionType: number', where as others give the same info in 'collectiontypes: Array<number>'
    return this.collectionTypeHandler.getCollectionType( this.thumbnail['collectionType'] ? [ this.thumbnail['collectionType'] ] : this.thumbnail['collectiontypes'], this.thumbnail['contributinginstitutionid'])
  }
}
