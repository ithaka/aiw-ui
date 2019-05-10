import { Component, OnInit, OnDestroy } from '@angular/core'
import { Router, ActivatedRoute } from '@angular/router'
import { Subscription }   from 'rxjs'
import { map, take } from 'rxjs/operators'

// Internal Dependencies
import { AppConfig } from '../app.service'
import { ArtstorStorageService } from '../../../projects/artstor-storage/src/public_api'
import {
  AssetService,
  AuthService,
  TitleService,
  ImageGroup,
  ImageGroupService,
  GroupService,
  DomUtilityService
} from './../shared'

import { LoadingStateOptions, LoadingState } from './../modals/loading-state/loading-state.component'

@Component({
  selector: 'ang-image-group',
  styleUrls: [ './image-group-page.component.scss' ],
  templateUrl: './image-group-page.component.pug'
})

export class ImageGroupPage implements OnInit, OnDestroy {
  public ig: ImageGroup = <ImageGroup>{};

  /** controls when PPT agreement modal is or is not shown */
  public showPptModal: boolean = false;
  /** controls the terms and condition modal, will replace ppt modal when all features implemented */
  public showTermsConditions: boolean = false;
  /** controls the modal that tells a user he/she has met the download limit */
  public showDownloadLimitModal: boolean = false;
  /** controls the modal to tell the user to login */
  public showLoginModal: boolean = false;
  /** controls the modal to tell the user that the IG doesn't exists */
  public showNoIgModal: boolean = false;
  /** controls the modal to tell that the user does not have the rights to access the IG */
  public showNoAccessIgModal: boolean = false;
  /** controls access denied modal for unaffiliated users landing on /group/id pages */
  public showAccessDeniedModal: boolean = false;
  /** Enables / Disables the IG deletion based on user ownership */
  public allowIgUpdate: boolean = false;

  /** Serve as an input to terms and condition modal, so that we know whether user wants to export ppt or zip or google slides */
  public exportType: string = '';

  public genImgGrpLink: boolean = false;

  // For authentication with Google
  public showGoogleAuth: boolean = false

  /** Options object passed to the asset-grid component */
  public actionOptions: any = {
    group: true,
    isowner: false
  }
  public disableIgDelete: boolean = false
  private hasDesc: boolean = false;
  private user: any;
  private descExpanded: boolean = true;

  private subscriptions: Subscription[] = [];
  /** set to true when the call to download info has returned. We won't know what modal to show before that */
  private downloadInfoReturned: boolean = false;

  private unaffiliatedUser: boolean = false
  /** Reorder: Modifies the layout */
  private reorderMode: boolean = false

  // For export loading states
  public showExportLoadingState: boolean = false
  private exportLoadingStateopts: LoadingStateOptions

  constructor(
    public _appConfig: AppConfig,
    private _ig: ImageGroupService, // this will be confusing for a bit. ImageGroupService deals with all the old image group service stuff, and some state management
    private _group: GroupService, // GroupService is dealing with the new image groups service
    private _router: Router,
    private _assets: AssetService,
    private _auth: AuthService,
    private route: ActivatedRoute,
    private _title: TitleService,
    private _storage: ArtstorStorageService,
    private _dom: DomUtilityService

  ) {
    this.unaffiliatedUser = this._auth.isPublicOnly() ? true : false
  }

  ngOnInit() {

    if (this.unaffiliatedUser) {
      this.showAccessDeniedModal = true
      return
    }

    this.user = this._auth.getUser();
    let id = null;

    this.subscriptions.push(
      this.route.queryParams.pipe(
        map(params => {
          // if we have a token param, it is a share link and we need to redeem the token
          if ( params['token'] ) {
            // go redeem the token here
            this._group.redeemToken(params['token']).pipe(
              take(1),
              map(res => {
                if (res.success && res.group) {
                  this._assets.setResultsFromIg(res.group)
                }
              },
              (err) => {
                if (err && err.status != 401 && err.status != 403) {
                  console.error(err)
                }
              }
            )).subscribe()
          }
      })).subscribe()
     ) // end push

    /**
     * Get Route Params
     * - Let Assets service know what group to load
     */
    this.subscriptions.push(
      this.route.params.pipe(
        map(routeParams => {
          id = routeParams['igId']
          let params = Object.assign({}, routeParams)
          // If a page number isn't set, reset to page 1!
          if (!params['page']) {
            params['page'] = 1
          }
          let refreshGroup = params['refresh'] ? true : false
          if (id) {
            this._assets.queryAll(params, refreshGroup)
          }
      })).subscribe()
    );

    /**
     * Get image group assets
     * - Assets service will provide the image group and its assets
     */
    this.subscriptions.push(
      this._assets.allResults.pipe(
      map((results: ImageGroup) => {
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
            if ( (accessObj.entity_identifier == this.user.baseProfileId && accessObj.entity_type == 100) ||
              (this.user.institutionId && accessObj.entity_identifier == this.user.institutionId.toString() && accessObj.entity_type == 200)) {
              this.genImgGrpLink = true;
            }
          });

          // Allow Generate Image Group Link for Artstor curated IGs
          if (this.ig.access.length === 0) {
            this.genImgGrpLink = true;
          }
        }
      })).subscribe()
    );

    this.subscriptions.push(
      this._assets.noIG.pipe(
      map((res: any) => {
        this.showNoIgModal = res;
      })).subscribe()
    )

    this.subscriptions.push(
      this._assets.noAccessIG.pipe(
      map((res: any) => {
        this.showNoAccessIgModal = res;
      })).subscribe()
    )

    this.subscriptions.push(
      this._ig.igDownloadTrigger.pipe(
      map(event => { // right now event will be undefined, it is just a dumb trigger
        // make sure we have the info we need
        if (id) {
          this.showDownloadModal(event);
        }
      })).subscribe()
    )

  } // OnInit

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }

  public refreshIG(): void{
    this._assets.queryAll(this.route.snapshot.params, true);
  }

  /**
   * Show Description, returns true if:
   * - A description exists
   * - View hasn't changed to hide the description
   */
  public showDesc(): boolean {
    if (this.ig && ((this.ig.description && this.ig.description.length > 0) || (this.ig.tags && this.ig.tags.length > 0)) && !this.reorderMode && this.descExpanded) {
      return true;
    } else {
      return false;
    }
  }

  private expandDetails(): void{
    this.descExpanded = true
    setTimeout( () => {
      let expandedDescHeader: HTMLElement = document.getElementById('exp-desc-hdr')
      if(expandedDescHeader) {
        expandedDescHeader.focus()
      }
    }, 250)
  }

  private collapseDetails(): void{
    this.descExpanded = false
    setTimeout( () => {
      let collapsedDescHeader: HTMLElement = document.getElementById('colpsd-desc-hdr')
      if(collapsedDescHeader) {
        collapsedDescHeader.focus()
      }
    }, 250)
  }

  /**
   * Toggle Reorder: Handle output from the Asset Grid
   */
  public toggleReorder(isReordering: boolean): void {
    this.reorderMode = isReordering;
  }

  /**
   * Handler for Google Auth modal closing
   * - Maybe this is where we need to call the loading state after successful google authentication
   */
  public closeGoogleAuth(event: any): void {
    this.showGoogleAuth = false
  }

  /**
   * Decides which download modal should be shown
   * - If the user is not logged in -> login required modal
   * - If the user is logged in but has met download limit -> download limit modal
   * - If the user is logged in and is allowed to download the image group -> download modal
   */
  private showDownloadModal(exportType: string) {
    // the template will not show the button if there is not an ig.igName and ig.igDownloadInfo
    // if the user is logged in and the download info is available
    if (this.user.isLoggedIn) {
      // If we specify an export type, trigger terms and conditions modal if user hasn't agreed
      if (exportType && exportType.length) {
        this.exportType = exportType;
        if (!this._storage.getSession('termAgreed')) {
          this.showTermsConditions = true;
        }
        else {
          let downloadLink, zipDownloadLink = ''
          // If user has agreed, we should trigger download directly
          switch (exportType) {
            case 'ppt': {
              // Perform PPT download action
              this.getPPT()
              break
            }
            case 'GoogleSlides': {
              if(this._storage.getSession('GAuthed')) {
                // Export to GS and show loading state
                console.log('Export to GS and show loading state')
              } else {
                this.showGoogleAuth = true
              }
              break
            }
            case 'zip': {
              // Perform ZIP download action
              this.getZIP()
              break
            }
            default: {
                break
            }
          }
        }
      } else {
        console.error("showDownloadModal() Expected a valid export type, received: " + exportType)
      }
    } else if (!this.user.isLoggedIn) {
      // show login required modal if they're not logged in
      this.showLoginModal = true;
    }
  }

  private exportGroup(event: any): void {
    this.showTermsConditions = false

    switch (event) {
      case 'ppt': {
        // Perform PPT download action
        this.getPPT()
        break
      }
      case 'GoogleSlides': {
        if(this._storage.getSession('GAuthed')) {
          // Export to GS and show loading state
          console.log('Export to GS and show loading state')
        } else {
          this.showGoogleAuth = true
        }
        break
      }
      case 'zip': {
        // Perform ZIP download action
        this.getZIP()
        break
      }
      default: {
          break
      }
    }
  }

  private getPPT(): void{
    this.exportLoadingStateopts = {
      exportType: 'ppt',
      state: LoadingState.loading,
      progress: 0
    }
    this.showExportLoadingState = true

    // Mimmic loading behaviour in intervals
    let interval = setInterval(() => {
      this.exportLoadingStateopts.progress += 10
    }, 1000)


    let downloadLink: string = ''
    this._ig.getDownloadLink(this.ig)
      .then( data => {
        if (data.path && this.showExportLoadingState) {
          downloadLink = this._auth.getThumbHostname() + data.path.replace('/nas/', '/thumb/')
          clearInterval(interval)

          this.exportLoadingStateopts.progress = 100
          this.exportLoadingStateopts.state = LoadingState.completed
          // On success fade out the component after 5 sec & begin download
          setTimeout(() => {
            this.closeExportLoadingState()
            this.downLoadFile(this.ig.name, downloadLink)
          }, 5000)
        }
      })
      .catch( error => {
        console.error(error)
        this.exportLoadingStateopts.state = LoadingState.error
        this.exportLoadingStateopts.errorType = 'server'
      })
  }

  private getZIP(): void{
    this.exportLoadingStateopts = {
      exportType: 'zip',
      state: LoadingState.loading,
      progress: 0
    }
    this.showExportLoadingState = true

    // Mimmic loading behaviour in intervals
    let interval = setInterval(() => {
      this.exportLoadingStateopts.progress += 10
    }, 1000)


    let zipDownloadLink: string = ''
    this._ig.getDownloadLink(this.ig, true)
      .then( data => {
        if (data.path && this.showExportLoadingState) {
          zipDownloadLink = this._auth.getThumbHostname() + data.path.replace('/nas/', '/thumb/')
          clearInterval(interval)

          this.exportLoadingStateopts.progress = 100
          this.exportLoadingStateopts.state = LoadingState.completed
          // On success fade out the component after 5 sec & begin download
          setTimeout(() => {
            this.closeExportLoadingState()
            this.downLoadFile(this.ig.name, zipDownloadLink)
          }, 5000)
        }
      })
      .catch( error => {
        console.error(error)
        this.exportLoadingStateopts.state = LoadingState.error
        this.exportLoadingStateopts.errorType = 'server'
      })
  }

  public closeExportLoadingState(event?: any): void {
    this.showExportLoadingState = false
    if(event && event['cancelExport']) {
      console.log('Show cancel export toast!')
    }
  }

  /**
   * Encode Tag: Encode the tag before using it for search
   */
  private encodeTag(tag) {
    return encodeURIComponent(tag);
  }

  /**
   * Dynamically trigger file download having file name & file download URL
   * @requires browser
   */
  private downLoadFile(filename: string, fileURL: string): void{
    let downloadLinkElement = this._dom.create('a')
    downloadLinkElement.text = 'Download File'
    downloadLinkElement.download = filename
    downloadLinkElement.href = fileURL
    // Firefox: Needs link to exist in document
    document.body.appendChild(downloadLinkElement);
    downloadLinkElement.click()
    downloadLinkElement.remove()
  }

}
