import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription }   from 'rxjs/Subscription';

// Internal Dependencies
import { AssetService, AuthService } from './../shared';
import { ImageGroup, ImageGroupDescription, IgDownloadInfo, ImageGroupService } from './../shared';

@Component({
  selector: 'ang-image-group',
  styleUrls: [ './image-group-page.component.scss' ],
  templateUrl: './image-group-page.component.html'
})

export class ImageGroupPage implements OnInit, OnDestroy {
  private ig: ImageGroup = <ImageGroup>{};
  private hasDesc: boolean = false;
  private user: any;

  private subscriptions: Subscription[] = [];

  /** controls when PPT agreement modal is or is not shown */
  private showPptModal: boolean = false;
  /** controls the modal that tells a user he/she has met the download limit */
  private showDownloadLimitModal: boolean = false;
  /** controls the modal to tell the user to login */
  private showLoginModal: boolean = false;
  /** controls the modal to tell the user that the IG doesn't exists */
  private showNoIgModal: boolean = false;
  /** set to true when the call to download info has returned. We won't know what modal to show before that */
  private downloadInfoReturned: boolean = false;
  /** Enables / Disables the IG deletion based on user ownership */
  private allowIgUpdate: boolean = false;

  constructor(
    private _ig: ImageGroupService,
    private _router: Router,
    private _assets: AssetService,
    private _auth: AuthService,
    private route: ActivatedRoute
  ) {
  }

  ngOnInit() {
    this.user = this._auth.getUser();

    // Subscribe to ID in params
    this.subscriptions.push(
      this.route.params.subscribe((routeParams) => {
        let id = routeParams["igId"];
        let params = Object.assign({}, routeParams);
        // If a page number isn't set, reset to page 1!
        if (!params['currentPage']){
          params['currentPage'] = 1;
        } 
        if (id) {
          this._assets.queryAll(params);
        }
      })
    );

    this.subscriptions.push(
      this._assets.allResults.subscribe((results: ImageGroup) => {

        if (results.id) {
          // Set ig properties from results
          this.ig = results;

          console.log(this.ig);
          this.checkDesc();

          // if the user has write access, then allow them to update the image group
          this.ig.access.forEach((accessObj) => {
            if (accessObj.entity_identifier == this.user.baseProfileId && accessObj.access_type >= 300) {
              this.allowIgUpdate = true;
            }
          })

          // this._ig.getGroupDescription(results.igId).take(1)
          //   .subscribe((desc: ImageGroupDescription) => { 
          //     this.ig.description = desc;
          //   });

          // this._ig.getGroupDescription(results.igId).take(1)
          //   .subscribe((desc: ImageGroupDescription) => { 
          //     console.log(desc)
          //     this.disableIgDelete = !desc.isFldrOwner;
          //   });


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
      this._ig.igDownloadTrigger.subscribe((event) => { // right now event will be undefined, it is just a dumb trigger
        // make sure we have the info we need
        if (this.ig.name && this.downloadInfoReturned) {
          this.showDownloadModal();
        }
      })
    );
  }

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
    console.log('Refresh IG from IG page!');
    this._assets.queryAll(this.route.snapshot.params, true);
  }

  private checkDesc(): void{
    let descHTML = this.ig.description;

    if(descHTML){
      let parentElement = <HTMLElement> document.createElement('div');
      parentElement.innerHTML = descHTML.toString(); 

      if(parentElement.firstElementChild.innerHTML != '<div>&nbsp;</div>'){
        this.hasDesc = true;
      }
    }
  }
}