import { Router } from '@angular/router';
import { Component, OnInit, OnChanges, Input, SimpleChanges } from '@angular/core';

import { Thumbnail, AssetService, CollectionTypeHandler, AssetSearchService, CollectionTypeInfo } from './../../shared'

@Component({
  selector: 'ang-thumbnail',
  templateUrl: 'thumbnail.component.pug',
  styles: [`
    .card-icon-group {
        height: 19px;
    }
    .metadata-wrap {
      min-height: 42px;
    }
    .disablePointerEvents{
        pointer-events: none;
    }
    .icon {
      margin-top: 3px;
    }
  `]
})
export class ThumbnailComponent implements OnInit, OnChanges {
  @Input()
  private thumbnail: Thumbnail

  @Input()
  private largeThmbView: boolean

  @Input()
  private reorderMode: boolean

  @Input()
  private editMode: boolean

  private constraints: any = {}

  // Variable that determines the thumbnail image size based on largeThmbView and available size for the asset. Defaults to 1 (Small thumbnail view)
  private thumbnailSize: number = 1

  // The alt message for a thumbnail, combined with thumbnail title and creator name
  private thumbnailAlt: string = ''

  constructor(
    private _assets: AssetService,
    private _search: AssetSearchService,
    private router: Router
  ) {
   }

  ngOnInit() {
    if (this.thumbnail['media']) {
      this.thumbnail.thumbnailImgUrl = this.thumbnail.media.thumbnailSizeOnePath
    }

    this.thumbnailAlt = this.thumbnail['name'] ? 'Thumbnail of ' + this.thumbnail['name'] : 'Untitled'
    this.thumbnailAlt = this.thumbnail['agent'] ? this.thumbnailAlt + ' by ' + this.thumbnail['agent'] : this.thumbnailAlt + ' by Unknown'
  }

  // Fires when the component input(s) (i.e largeThmbView) changes - Updates the thumbnailSize based on largeThmbView current value
  ngOnChanges(changes: SimpleChanges) {
    if (changes.largeThmbView){
      this.thumbnailSize = changes.largeThmbView.currentValue ? 2 : 1
    }
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
  getCollectionType(): CollectionTypeInfo {
    // Some endpoints give us the collectionType info in 'collectionType: number', where as others give the same info in 'collectiontypes: Array<number>'
    return CollectionTypeHandler.getCollectionType( this.thumbnail['collectionType'] ? [ this.thumbnail['collectionType'] ] : this.thumbnail['collectiontypes'], this.thumbnail['contributinginstitutionid'])
  }

  // If large thumbnail image fails to load, fallback to smaller thumbnail image
  thumbnailError(): void{
    if (this.thumbnailSize > 1){
      this.thumbnailSize--
    }
  }
}
