import { Router } from '@angular/router'
import { Component, OnInit, OnChanges, Input, SimpleChanges } from '@angular/core'
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

import { AssetThumbnail } from 'datatypes'
import { Angulartics2 } from 'angulartics2'
import { AssetService, AssetSearchService, ThumbnailService } from 'app/_services'

@Component({
  selector: 'ang-thumbnail',
  templateUrl: 'thumbnail.component.pug',
  styles: [`
    .card-icon-group {
        height: 19px;
        margin-top: 4px;
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
  public thumbnail: AssetThumbnail

  @Input() // allResults index for reorder
  public itemIndex: number

  @Input()
  public arrowReorderMode: boolean

  @Input()
  private largeThmbView: boolean

  @Input()
  private reorderMode: boolean

  @Input()
  public editMode: boolean

  public src: SafeUrl
  // Keeps the track of multiViewItems count associated with the current asset
  public multiviewItemCount: number = 0
  public isMultiView: boolean = false
  public isDowngradedMedia: boolean = false
  public isDetailView: boolean = false

  private constraints: any = {}
  // The alt message for a thumbnail, combined with thumbnail title and creator name
  private thumbnailAlt: string = ''

  // Flag that controls the class for detail view icon / hover state
  private mouseOverDetailIcon: boolean = false
  private mouseOverMedia: boolean = false
  private mouseOverNoMedia: boolean = false
  private mouseOverDowngradedMedia: boolean = false
  public mouseOverMultiview: boolean = false

  constructor(
    private angulartics: Angulartics2,
    private _assets: AssetService,
    private _search: AssetSearchService,
    private router: Router,
    private _thumbnail: ThumbnailService,
    private sanitizer: DomSanitizer
  ) {
   }

  ngOnInit() {
    this.isDetailView = this.thumbnail.isDetailView
    this.isMultiView = this.thumbnail.isMultiView
    this.isDowngradedMedia = this.thumbnail.isDowngradedMedia
    this.multiviewItemCount = this.thumbnail.multiviewItemCount
    this.thumbnailAlt = this.thumbnail.thumbnailAlt
    // Init image src
    this.evaluateImageSrc()
  }

  // Fires when the component input(s) (i.e largeThmbView) changes - Updates the thumbnailSize based on largeThmbView current value
  ngOnChanges(changes: SimpleChanges) {
    if (changes.largeThmbView){
      this.thumbnail.size = changes.largeThmbView.currentValue ? 2 : 1
      this.thumbnail.img = this._thumbnail.getThumbnailImg(this.thumbnail)
      this.evaluateImageSrc()
    }
  }

  openLink(event: Event, urlParams: any[]) {
    // Prevent the parent anchor tag from firing
    event.preventDefault()
    event.stopPropagation()

    if (urlParams[0] === '/associated') {
      this.angulartics.eventTrack.next({ properties: { event: 'view associated images', label: this.thumbnail.id } })
    }
    if (urlParams[0] === '/cluster') {
      this.angulartics.eventTrack.next({ properties: { event: 'view cluster', label: this.thumbnail.id } })
    }
    this.router.navigate(urlParams)
  }

  /**
   * Allows image blobs, such as detailed views, to load directly
   */
  assumeSafe(imageUrl) : SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(imageUrl)
  }

  /**
   * re-evaluate src for Thumbnail <img>
   */
  evaluateImageSrc(): void {
    if (this.thumbnail.img.indexOf('/iiif/') > -1) {
      this._thumbnail.getImageSecurely(this.thumbnail.img)
        .then(img => {
          this.src = this.assumeSafe(img)
        })
        .catch(err => {
          // Error handling
        })
    } else {
      this.src = this.assumeSafe(this.thumbnail.img)
    }
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

  // If large thumbnail image fails to load, fallback to smaller thumbnail image
  thumbnailError(): void{
    console.log("Thumbnail error!", this.thumbnail.size)
    if (this.thumbnail.size > 0) {
      this.thumbnail.size--
      this.thumbnail.img = this._thumbnail.getThumbnailImg(this.thumbnail)
      this.evaluateImageSrc()
    }
  }

}
