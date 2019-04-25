import { Subscription } from 'rxjs'
import { map, take } from 'rxjs/operators'
import { Component, OnInit, OnDestroy, Output, EventEmitter, Input } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { Location } from '@angular/common'

// Project Dependencies
import { AssetService, ImageGroupService, ImageGroup, GroupService, AuthService, FlagService } from '../shared'
import { AppConfig } from '../app.service'
import { Toast, ToastService } from 'app/_services';

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
  public actionOptions: any = {};

  @Input()
  public genImgGrpLink: boolean = false;

  @Output() refreshIG: EventEmitter<any> = new EventEmitter();
  public institutionObj: any = {}

  public mobileCollapsed: boolean = true
  public selectedAssets: any[] = []

  public showShareLinkModal: boolean = false
  public showDeleteIgModal: boolean = false
  public showImageGroupModal: boolean = false
  public showAddToGroupModal: boolean = false
  public showShareIgModal: boolean = false
  public params: any = {}

  public browseOpts: any = {}

  // Flag for confimation popup for deleting selected asset(s) from the IG
  public showConfirmationModal: boolean = false

  public exportReframeFlag: boolean = false

  @Input()
  private disableIgDelete: boolean = false;

  @Input()
  private allowIgUpdate: boolean = false;

  @Input()
  private allowSelectAll: boolean = false;

  @Input()
  private ig: any = {};

  private user: any = {}
  private siteID: string = ''
  private subscriptions: Subscription[] = []
  private copyIG: boolean = false
  private editIG: boolean = false

  // Toast Variables
  public toasts: Toast[] = []

  public showToast: boolean = false
  public toastType: string = ''
  public toastHTML: string = ''

  // TypeScript public modifiers
  constructor(
    public _appConfig: AppConfig,
    private _router: Router,
    private location: Location,
    private _app: AppConfig,
    private _assets: AssetService,
    private _ig: ImageGroupService,
    private _group: GroupService,
    private route: ActivatedRoute,
    public _auth: AuthService,
    public _flags: FlagService
  ) {
    this.browseOpts = this._app.config.browseOptions
    this.siteID = this._appConfig.config.siteID
  }

  ngOnInit() {
    // Subscribe to User object updates
    this.subscriptions.push(
      // User data subscription
      this._auth.currentUser.pipe(
        map(userObj => {
          this.user = userObj
        },
        (err) => { console.error(err) }
      )).subscribe(),
      // Asset selection subscription
      this._assets.selection.pipe(
        map(selectedAssets => {
          this.selectedAssets = selectedAssets
        },
        error => {
          console.error(error)
        }
      )).subscribe(),
      // Feature flag subscription
      this._flags.flagUpdates.subscribe((flags) => {
        this.exportReframeFlag = flags.exportReframe ? true : false
      }),
      // Route params subscription
      this.route.params.subscribe((routeParams) => {
        this.params = routeParams
        if (routeParams['igId'] && !routeParams['page']){
          this.showImageGroupModal = false
        }
        // Find feature flags applied on route
        this._flags.readFlags(routeParams)
      }),
      // Institution Object subscription
      this._auth.getInstitution().pipe(
        map(institutionObj => {
          this.institutionObj = institutionObj;
      })).subscribe(),

      // Subscribe to edit group subject observable and show edit group modal once a `true` value is pushed to it.
      this._ig.editGroupObservable.pipe(
        map((editGroupFlag: boolean) => {
          if(editGroupFlag) {
            this.editIG = true
            this.copyIG = false
            this.showImageGroupModal = true
            this._ig.editGroupObservableSource.next(false)
          }
        })).subscribe()
    )

  } // onInit

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe() })
  }

  public printImageGroupPage(): void {
    if (this.actionOptions.group) {
      let params = this.route.snapshot.params

      if (params['igId']) {
        this._router.navigate(['/printpreview/' + params['igId']])
      }
    }
  }

  /**
   * Opens dropdown
   */
  public openDrop(event, dropdown): void {
    event.stopPropagation();
    dropdown.open();
  }

  /**
   * Closes dropdown
   */
  public closeDrop(event, dropdown): void {
    event.stopPropagation();
    dropdown.close();
  }

  public closeNavMenuDropdowns(): void{
    // TO-DO: Only reference document client-side
    // let dropdownElements: Array<HTMLElement> = Array.from( document.querySelectorAll('.nav-item.dropdown') )
    // for (let dropdownElement of dropdownElements){
    //   dropdownElement.classList.remove('show')
    //   dropdownElement.children[0].setAttribute('aria-expanded', 'false')
    //   dropdownElement.children[1].classList.remove('show')
    // }
  }

  /**
   * Select All for Edit Mode
   * - Takes all current results from Asset Service, and selects them!
   * - The selection then broadcasts out to the Asset Grid by observable
   */
  private selectAllInAssetGrid(): void {

    this._assets.allResults.pipe(
      take(1),
      map(assets => {
        if (assets.thumbnails) {
          // Make a copy of the Results array
          let assetsOnPage = [];
          for (let i = 0; i < assets.thumbnails.length; i++){
              assetsOnPage.push(assets.thumbnails[i]);
          }
          // Set all assets on page as selected
          this._assets.setSelectedAssets(assetsOnPage);
        }
      }
    )).subscribe()
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
        // Support both legacy and new Group items format
        if (asset.objectId === item || asset.objectId === item.id) {
          let zoomMatched: boolean = true
          if(asset.zoom && asset.zoom.viewerX){
            let itemZoomObj = item.zoom ? item.zoom : {}
            if(JSON.stringify(asset.zoom) !== JSON.stringify(itemZoomObj)){
              zoomMatched = false
            }
          } else if (item.zoom && item.zoom.viewerX) {
            zoomMatched = false
          }
          if(zoomMatched) {
            assetFound = true
            return
          }
        }
      })
      return !assetFound // if the asset was not found, we want to keep it
    });

    this._group.update(putGroup).pipe(
      take(1),
      map(res => {
        this.ig = putGroup
        this._assets.selectModeToggle.emit()
        this.reloadIG() // Reload IG assets after deleting selected assets
      }
    )).subscribe()

  }

  /**
   * Closes confirmation modal
   */
  private closeConfirmationModal(confirmed: number) {
    console.log(this.params);
    // Hide modal
    this.showConfirmationModal = false;

    if (confirmed === 1) {
      // Confirmed
      this.deleteSelectedAssets();
    } else if (confirmed === 0) {
      // Cancelled
    }
  }

  // Will update the asset grid with modified assets and also
  // pass the total # of items for pagination values
  private reloadIG(): void{
    this.refreshIG.emit();
  }

  private logout(): void {
    this._auth.logout()
      .then(() => {
        if (this.location.path().indexOf('home') >= 0) {
          location.reload() // this will reload the app and give the user a feeling they actually logged out
        } else {
          this._router.navigate(['/home'])
        }
      })
  }
}
