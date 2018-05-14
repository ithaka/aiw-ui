import { Component, OnInit, Input } from '@angular/core';
import { AppConfig } from '../../app.service';
import { AuthService } from '../../shared';

@Component({
  selector: 'ang-featured',
  templateUrl: 'featured.component.pug',
  styleUrls: [ './featured.component.scss' ]
})
export class FeaturedComponent implements OnInit {

  private siteId: string = ""
  private featuredCollectionConf = ""
  private user: any

  // Determines which type of featured collections to display
  private showInstFeatured: boolean = false
  private showPublicFeatured: boolean = false
  private showSaharaFeatured: boolean = false

  // Array index for which collection is the 'primary image'
  private primaryFeaturedIndex: number = 0

  constructor(
    public _appConfig: AppConfig,
    private _auth: AuthService
  ) {
    this.featuredCollectionConf = this._appConfig.config.featuredCollection
  }

  ngOnInit() {
    this.siteId = this._appConfig.config.siteID
    this.user = this._auth.getUser();

    // Show Public Featured Collections, or Inst Featured Collections
    if (this.user.isLoggedIn && this.siteId === 'SAHARA') {
      this.showSaharaFeatured = true
    }
    else if (this.user.isLoggedIn) {
      this.showInstFeatured = true
    }
    else {
      this.showPublicFeatured = true
    }
  }

  private switchFeaturedIndex(index: number): void {
    this.primaryFeaturedIndex = index
  }

}
