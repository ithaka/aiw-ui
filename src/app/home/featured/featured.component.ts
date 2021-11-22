import { Component, OnInit, Input, Inject, PLATFORM_ID } from '@angular/core';

// Project Dependencies
import { AppConfig } from '../../app.service'
import { AuthService } from '_services'
import { FeaturedCollection } from './featured-collection'
import { isPlatformBrowser } from '@angular/common'

@Component({
  selector: 'ang-featured',
  templateUrl: 'featured.component.pug',
  styleUrls: ['./featured.component.scss']
})
export class FeaturedComponent implements OnInit {

  public siteId: string = ''

  public featured: FeaturedCollection[] = [] // Array of collection objects

  // Array index for which collection is the 'primary image'
  public primaryFeaturedIndex: number = 0

  private conf = ''
  private user: any

  // Determines which type of featured collections to display
  private featuredType: string; // 'COLLECTIONS', 'PUBLIC_COLLECTIONS', or 'SAHARA'
  private base: string
  private headings: string
  private skipAutoSlide: boolean = false
  // To pause and resume slide show
  private intervalId: any

  constructor(
      public _appConfig: AppConfig,
      public _auth: AuthService,
      @Inject(PLATFORM_ID) private platformId: Object
      ) {
    this.conf = this._appConfig.config.featuredCollection // 'HOME.FEATURED' in en.json
  }

  ngOnInit() {
    this.siteId = this._appConfig.config.siteID
    this.user = this._auth.getUser();
    this.headings = this.conf + '.' + 'HEADINGS'

    // Show Public Featured Collections, or Inst Featured Collections
    if (this.siteId === 'SAHARA') {
      this.featuredType = 'SAHARA_COLLECTIONS'
    }
    else {
      this.featuredType = 'COLLECTIONS'
    }

    this.base = this.conf + '.' + this.featuredType + '.'
    this.initCollections()

  }

  /**
   * Initiatialze featured collections into array of FeaturedConf data
   * @param type featuredCollectionConf key name of the featured collection type
   */
  private initCollections(): void {

    for (let i = 0; i < 3; i++) {

      let collection = {
        subheading:  this.base + i + '.SUBHEADING',
        caption:     this.base + i + '.CAPTION',
        description: this.base + i + '.DESCRIPTION',
        img_src:     this.base + i + '.IMG_SOURCE',
        link:        this.base + i + '.LINK',
        link_title:  this.base + i + '.LINK_TITLE',
        alt:         this.base + i + '.ALT_TEXT'
      }

      this.featured.push(<FeaturedCollection>collection)
    }
  }

  // Switch the primary main slideshow image via collection index (0, 1, or 2)
  private switchFeaturedIndex(index: number): void {
    this.primaryFeaturedIndex = index
    this.skipAutoSlide = true
  }

}
