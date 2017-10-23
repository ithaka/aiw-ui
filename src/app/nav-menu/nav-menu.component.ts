import { Subscription } from 'rxjs/Rx';
import { Component, OnInit, OnDestroy, Output, EventEmitter, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { Locker } from 'angular2-locker';

// Project Dependencies
import { AssetService, ImageGroupService, ImageGroup, GroupService, AuthService } from '../shared';
import { AnalyticsService } from '../analytics.service';

import { AppConfig } from '../app.service';

@Component({
  selector: 'nav-menu',
  templateUrl: './nav-menu.component.pug',
  styleUrls: [ './nav-menu.component.scss' ],
})
export class NavMenu implements OnInit, OnDestroy {

  /**
   * Action options so far include:
   * {
   *   group: true,
   *   ...
   * }
   */
  @Input()
  private actionOptions: any = {};

  @Input()
  private disableIgDelete: boolean = false;

  @Input()
  private allowIgUpdate: boolean = false;

  @Input()
  private genImgGrpLink: boolean = false;

  @Input()
  private allowSelectAll: boolean = false;

  @Input()
  private ig: any = {};

  @Output() refreshIG: EventEmitter<any> = new EventEmitter();

  private _storage: Locker

  private user: any = {}
  private institutionObj: any = {}

  private mobileCollapsed: boolean = true
  private selectedAssets: any[] = []
  private subscriptions: Subscription[] = []

  private showImageGroupModal: boolean = false
  private showAddToGroupModal: boolean = false
  private showShareIgModal: boolean = false
  private pcEnabled: boolean = false

  private copyIG: boolean = false
  private editIG: boolean = false
  private params: any = {}

  private browseOpts: any = {}

  // Flag for confimation popup for deleting selected asset(s) from the IG
  private showConfirmationModal: boolean = false

  // TypeScript public modifiers
  constructor(
    private locker: Locker,
    private _router: Router,
    private location: Location,
    private _app: AppConfig,
    private _assets: AssetService,
    private _ig: ImageGroupService,
    private _group: GroupService,
    private route: ActivatedRoute,
    private _auth: AuthService,
    private _analytics: AnalyticsService
  ) {
    this.browseOpts = this._app.config.browseOptions
    this._storage = locker.useDriver(Locker.DRIVERS.LOCAL)
    this.pcEnabled = this._storage.get('pcEnabled')
  }

  ngOnInit() {
    this.user = this._auth.getUser()
    this.subscriptions.push(
      this._assets.selection.subscribe(
        selectedAssets => {
          this.selectedAssets = selectedAssets
        },
        error => {
          console.error(error)
        })
    );

    this.subscriptions.push(
      this.route.params.subscribe((params) => {
        this.params = params

        if (params['igId'] && !params['page']){
          this.showImageGroupModal = false
        }
      })
    )

    this.subscriptions.push(
      this._auth.getInstitution().subscribe((institutionObj) => {
        this.institutionObj = institutionObj;
      })
    )
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe() })
  }

  private printImageGroupPage(): void {
    if (this.actionOptions.group) {
      let params = this.route.snapshot.params

      if (params['igId']) {
        this._router.navigate(['/printpreview/' + params['igId']])
      }
    }
  }

  /**
   * Select All for Edit Mode
   * - Takes all current results from Asset Service, and selects them!
   * - The selection then broadcasts out to the Asset Grid by observable
   */
  private selectAllInAssetGrid(): void {

    this._assets.allResults.take(1).subscribe(
      assets => {
        if (assets.thumbnails) {
          // Make a copy of the Results array
          let assetsOnPage = [];
          for(var i=0;i<assets.thumbnails.length;i++){
              assetsOnPage.push(assets.thumbnails[i]);
          }
          // Set all assets on page as selected
          this._assets.setSelectedAssets(assetsOnPage);
        }
      }
    );
  }

  /**
   * Uses a combination of groups service and asset service to delete the assets selected in the asset grid
   */
  private deleteSelectedAssets(): void {
    let igId = this.params['igId']

    // make a new object b/c we don't want to be messing up the real ig object
    let putGroup = Object.assign({}, this.ig)

    let assetFound: boolean
    putGroup.items = putGroup.items.filter((item) => {
      assetFound = false
      this._assets.getSelectedAssets().forEach((asset) => {
        if (asset.objectId == item) {
          assetFound = true
          return
        }
      })
      return !assetFound // if the asset was not found, we want to keep it
    });

    this._group.update(putGroup)
      .take(1)
      .subscribe((res) => {
        this.ig = putGroup
        let removeIds: string[] = []
        this._assets.getSelectedAssets().forEach((asset) => {
          removeIds.push(asset.objectId)
        })
        this._assets.removeFromResults(removeIds) // make the call to asset service which will update the asset grid with modified assets
        this._assets.selectModeToggle.emit()
      })
  }


  /**
   * Closes confirmation modal
   */
  private closeConfirmationModal(command) {
    console.log(this.params);
    // Hide modal
    this.showConfirmationModal = false;

    if (command && command.includes('Yes')) {
      this.deleteSelectedAssets();
    }
  }


  private reloadIG():void{
    this.refreshIG.emit();
  }

  private logout(): void {
    this._auth.logout()
      .then(() => {
        if (this.location.path().indexOf("home") >= 0) {
          location.reload() // this will reload the app and give the user a feeling they actually logged out
        } else {
          this._router.navigate(['/home'])
        }
      })
  }
}
