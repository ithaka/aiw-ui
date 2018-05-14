import { Component, OnInit, Input } from '@angular/core';
import { AppConfig } from '../../app.service';
import { AuthService } from '../../shared';

@Component({
  selector: 'ang-featured',
  templateUrl: 'featured.component.pug',
  styleUrls: [ './featured.component.scss' ]
})
export class FeaturedComponent implements OnInit {

  private showInstFeatured: boolean = false
  private showPublicFeatured: boolean = false
  private primaryFeaturedIndex: number = 0
  private featuredCollectionConf = ""
  private user: any

  constructor(
    public _appConfig: AppConfig,
    private _auth: AuthService
  ) {
    this.featuredCollectionConf = this._appConfig.config.featuredCollection
  }

  ngOnInit() {
    this.user = this._auth.getUser();

    // Show Public Featured Collections, or Inst Featured Collections
    if (this.user.isLoggedIn)
      this.showInstFeatured = true
    else
      this.showPublicFeatured = true
  }

  private switchFeaturedIndex(index: number): void {
    this.primaryFeaturedIndex = index
  }

}
