import { Component, OnInit, Input } from '@angular/core';
import { AppConfig } from '../../app.service';
import { AuthService } from '../../shared';
import { FeaturedCollection } from './featured-collection.ts';

@Component({
  selector: 'ang-featured',
  templateUrl: 'featured.component.pug',
  styleUrls: ['./featured.component.scss']
})
export class FeaturedComponent implements OnInit {

  private siteId: string = ""
  private conf = ""
  private user: any

  // Determines which type of featured collections to display
  private featuredType: string; // 'COLLECTIONS', 'PUBLIC_COLLECTIONS', or 'SAHARA'
  private base: string
  private headings: string

  private featured: FeaturedCollection[] = [] // Array of collection objects

  // Array index for which collection is the 'primary image'
  private primaryFeaturedIndex: number = 0
  private skipAutoSlide: boolean = false

  constructor(public _appConfig: AppConfig, private _auth: AuthService) {
    this.conf = this._appConfig.config.featuredCollection // 'HOME.FEATURED' in en.json
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

  /**
   * runSlideShow - Start the homepage slideshow
   * @param primary_index pass in primaryFeaturedIndex,
   * so it is locally scoped within setInterval.
   */
  private runSlideshow(primary_index: number) { 
    this.primaryFeaturedIndex = primary_index
      
      setInterval(() => {
        if (!this.skipAutoSlide) {
          if (this.primaryFeaturedIndex === 2)
            this.primaryFeaturedIndex = 0
          else
            this.primaryFeaturedIndex += 1
        } else {
          this.skipAutoSlide = false
        }
      }, 9000)
  }

  ngOnInit() {
    this.siteId = this._appConfig.config.siteID
    this.user = this._auth.getUser();
    this.headings = this.conf + '.' + 'HEADINGS'

    // Show Public Featured Collections, or Inst Featured Collections
    if (this.user.isLoggedIn && this.siteId === 'SAHARA') {
      this.featuredType = 'SAHARA_COLLECTIONS'
    }
    else if (this.user.isLoggedIn || this.user.ipAuthed) { // Show ADL featured collections if the user is Logged-in or IP Authed
      this.featuredType = 'COLLECTIONS'
    }
    else {
      this.featuredType = 'PUBLIC_COLLECTIONS'
    }

    this.base = this.conf + '.' + this.featuredType + "."
    this.initCollections()

    // Start slideshow
    this.runSlideshow(this.primaryFeaturedIndex)
  }

}
