import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription }   from 'rxjs/Subscription';

// Internal Dependencies
import { AssetService, AuthService } from './../shared';
import { ImageGroup, ImageGroupDescription, IgDownloadInfo, ImageGroupService, GroupService } from './../shared';
import { TitleService } from '../shared/title.service';

@Component({
  selector: 'ang-image-group',
  styleUrls: [ './image-group-page.component.scss' ],
  templateUrl: './image-group-page.component.pug'
})

export class ImageGroupPage implements OnInit, OnDestroy {
  private ig: ImageGroup = <ImageGroup>{};
  private hasDesc: boolean = false;
  private user: any;
  private descExpanded: boolean = true;

  private subscriptions: Subscription[] = [];

  /** controls when PPT agreement modal is or is not shown */
  private showPptModal: boolean = false;
  /** controls the modal that tells a user he/she has met the download limit */
  private showDownloadLimitModal: boolean = false;
  /** controls the modal to tell the user to login */
  private showLoginModal: boolean = false;
  /** controls the modal to tell the user that the IG doesn't exists */
  private showNoIgModal: boolean = false;
  /** controls the modal to tell that the user does not have the rights to access the IG */
  private showNoAccessIgModal: boolean = false;
  /** set to true when the call to download info has returned. We won't know what modal to show before that */
  private downloadInfoReturned: boolean = false;
  /** Enables / Disables the IG deletion based on user ownership */
  private allowIgUpdate: boolean = false;

  private genImgGrpLink: boolean = false;

  /** Options object passed to the asset-grid component */
  private actionOptions: any = {
    group: true,
    isowner: false
  }
  /** Reorder: Modifies the layout */
  private reorderMode: boolean = false;

  constructor(
    private _ig: ImageGroupService, // this will be confusing for a bit. ImageGroupService deals with all the old image group service stuff, and some state management
    private _group: GroupService, // GroupService is dealing with the new image groups service
    private _router: Router,
    private _assets: AssetService,
    private _auth: AuthService,
    private route: ActivatedRoute,
    private _title: TitleService
  ) {}

  ngOnInit() {
    this.user = this._auth.getUser();
    let id = null;

    this.subscriptions.push(
      this.route.queryParams.subscribe((params) => {
        // if we have a token param, it is a share link and we need to redeem the token
        if ( params['token'] ) {
          // go redeem the token here
          this._group.redeemToken(params['token'])
            .take(1)
            .subscribe(
              (res) => {
                if (res.success && res.group) {
                  this._assets.setResultsFromIg(res.group)
                }
              },
              (err) => {
                if (err && err.status != 401 && err.status != 403) {
                  console.error(err)
                }
              }
            )
        }
      })
    )

    /**
     * Get Route Params
     * - Let Assets service know what group to load
     */
    this.subscriptions.push(
      this.route.params.subscribe((routeParams) => {
        id = routeParams['igId'];
        let params = Object.assign({}, routeParams);
        // If a page number isn't set, reset to page 1!
        if (!params['page']){
          params['page'] = 1;
        }
        if (id) {
          this._assets.queryAll(params);
        }
      })
    );

    /**
     * Get image group assets
     * - Assets service will provide the image group and its assets
     */
    this.subscriptions.push(
      this._assets.allResults.subscribe((results: ImageGroup) => {
        if ('id' in results) {
          // Set ig properties from results
          this.ig = results;

          // Set page title
          this._title.setSubtitle(this.ig.name)

          // if the user has write access, then allow them to update the image group
          this.ig.access.forEach((accessObj) => {
            if (accessObj.entity_identifier == this.user.baseProfileId && accessObj.access_type >= 300) {
              this.allowIgUpdate = true;
              this.actionOptions.isowner = true;
            }

            // If the user has private / instituional access, then allow Generate Image Group Link
            if ( (accessObj.entity_identifier == this.user.baseProfileId && accessObj.entity_type == 100) || (accessObj.entity_identifier == this._auth.getUser().institutionId.toString() && accessObj.entity_type == 200) ){
              this.genImgGrpLink = true;
            }
          });

          // Allow Generate Image Group Link for Artstor curated IGs
          if (this.ig.access.length === 0){
            this.genImgGrpLink = true;
          }

          // THIS IS MOCK CODE FOR THE USER'S DOWNLOAD PERMISSIONS
          // IT HELPS THIS PAGE AND THE IMAGE GROUP DOWNLOAD MODAL FUNCTION IN THE ABSENCE OF DOWNLOAD INFORMATION
          this.ig.igDownloadInfo = {
            alreadyDwnldImgCnt: 0,
            curAllowedDwnldCnt: 2000,
            igImgCount: this.ig.items.length,
            igId: id,
            pptExportAllowed: this.ig.items.length <= 2000
          }

          // // get the user's download count
          // this._ig.getDownloadCount(this.ig.igId)
          //   .take(1)
          //   .subscribe((res: IgDownloadInfo) => {
          //     this.downloadInfoReturned = true;
          //     this.ig.igDownloadInfo = res;
          //   }, (err) => {
          //     console.error(err);
          //   });
        }
      })
    );

    this.subscriptions.push(
      this._assets.noIG.subscribe((res: any) => {
        this.showNoIgModal = res;
      })
    );

    this.subscriptions.push(
      this._assets.noAccessIG.subscribe((res: any) => {
        this.showNoAccessIgModal = res;
      })
    );

    this.subscriptions.push(
      this._ig.igDownloadTrigger.subscribe((event) => { // right now event will be undefined, it is just a dumb trigger
        // make sure we have the info we need
        if (id) {
          this.showDownloadModal();
        }
      })
    );

  } // OnInit

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }

  /**
   * Decides which download modal should be shown
   * - If the user is not logged in -> login required modal
   * - If the user is logged in but has met download limit -> download limit modal
   * - If the user is logged in and is allowed to download the image group -> download modal
   */
  private showDownloadModal() {
    // the template will not show the button if there is not an ig.igName and ig.igDownloadInfo
    // if the user is logged in and the download info is available
    if (this.user.isLoggedIn) {
      // we will need a new way to know whether or not the user is authorized to download - for now, I will always enable them
      if (this.ig.igDownloadInfo.pptExportAllowed) {
        this.showPptModal = true;
      } else {
        this.showDownloadLimitModal = true;
      }
    } else if (!this.user.isLoggedIn) {
      // show login required modal if they're not logged in
      this.showLoginModal = true;
    }
  }

  private refreshIG(): void{
    this._assets.queryAll(this.route.snapshot.params, true);
  }

  /**
   * Show Description, returns true if:
   * - A description exists
   * - View hasn't changed to hide the description
   */
  private showDesc(): boolean {
    if (this.ig && ((this.ig.description && this.ig.description.length > 0) || (this.ig.tags && this.ig.tags.length > 0)) && !this.reorderMode && this.descExpanded) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Toggle Reorder: Handle output from the Asset Grid
   */
  private toggleReorder(isReordering: boolean): void {
    this.reorderMode = isReordering;
  }

  /**
   * Encode Tag: Encode the tag before using it for search
   */
  private encodeTag(tag) {
    return encodeURIComponent(tag);
  }

}
