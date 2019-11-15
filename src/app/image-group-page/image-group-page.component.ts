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
  ImageGroupService,
  GroupService,
  DomUtilityService,
  ToastService,
  FlagService,
  ScriptService,
  LogService
} from '_services'
import {
  LoadingStateOptions,
  LoadingState,
  SupportedExportTypes
} from './../modals/loading-state/loading-state.component'
import { ImageGroup } from 'datatypes'

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

  private exportStatusInterval: any = null
  private loadingStateInterval: any = null

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
    private _dom: DomUtilityService,
    private _toasts: ToastService,
    private _flags: FlagService,
    private _script: ScriptService,
    private _log: LogService,
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
          // Find feature flags applied on route
          this._flags.readFlags(routeParams)

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
      map(exportType => {
        if (id) {
          this.showDownloadModal(exportType);
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
  private showDownloadModal(exportType: SupportedExportTypes) {
    if (this.user.isLoggedIn) {
      // If we specify an export type, trigger terms and conditions modal if user hasn't agreed
      if (exportType) {
        if (!this._storage.getSession('termAgreed')) {
          // Need to show the terms and conditions modal. Set the exportType so we can remember.
          this.exportType = exportType
          this.showTermsConditions = true;
        } else {
          this.exportGroup(exportType)
        }
      } else {
        console.error("showDownloadModal() Expected a valid export type, received: " + exportType)
      }
    } else if (!this.user.isLoggedIn) {
      // show login required modal if they're not logged in
      this.showLoginModal = true;
    }
  }

  private exportGroup(exportType: SupportedExportTypes): void {
    this.showTermsConditions = false

    this._ig.getImageIdsToDownload(this.ig)
      .then((imageIdsToDownload) => {
        // If user has agreed, we should trigger download directly
        switch (exportType) {
          case SupportedExportTypes.PPTX:
          case SupportedExportTypes.ZIP:
            this.executeBulkExport(imageIdsToDownload, SupportedExportTypes.PPTX)
            break
          case 'GoogleSlides': {
            if(this._storage.getSession('GAuthed')) {
              // Export to GS and show loading state
              console.log('Export to GS and show loading state')
            } else {
              this.showGoogleAuth = true
            }
            break
          }
          default: {
            break
          }
        }
      })
  }

  private trackBulkDownload(exportType: SupportedExportTypes, imageIdsDownloaded): void {
    const eventType = exportType === SupportedExportTypes.ZIP ? "artstor_download_zip" : "artstor_download_pptx"

    this._log.log({
      eventType: eventType,
      additional_fields: {
        igName: this.ig.name,
        igId: this.ig.id,
        item_ids: imageIdsDownloaded
      }
    })
  }

  /**
   * getPPt/getZIP loading time
   */
  private getProgressIntervals(itemCount, intervals): number {
    // Base minimum of 5 seconds
    let totalTime = 5000
    // Approx. additional 500ms per item
    totalTime += itemCount*500
    // Divide by intervals
    return totalTime/intervals
  }

  private pollForExportStatus(): void {
    // Check right away before polling, to see if there is a generic error
    this.checkExportStatus(this.ig.id)
    // When the server timesout or there is an error begin polling on export status every 15s
    this.exportStatusInterval = setInterval( () => {
      this.checkExportStatus(this.ig.id)
    }, 15000)
  }

  private checkExportStatus(groupId: string): void {
    this._ig.checkExportStatus(groupId).subscribe(
      (response) => {
        console.log('The response is: ', response)
        if(response.status && response.status === 'COMPLETED') {
          clearInterval(this.exportStatusInterval)
          clearInterval(this.loadingStateInterval)
          let downloadLink = this._auth.getThumbHostname() + response.path.replace('/nas/', '/thumb/')

          this.exportLoadingStateopts.progress = 100
          this.exportLoadingStateopts.state = LoadingState.completed

          const imageIdsDownloaded = this.exportLoadingStateopts.imageIdsToDownload
          this.trackBulkDownload(this.exportLoadingStateopts.exportType, imageIdsDownloaded)

          // On success fade out the component after 5 sec & begin download
          setTimeout(() => {
            this.closeExportLoadingState()
            this.downLoadFile(this.ig.name, downloadLink)
          }, 5000)
        } else if(response.status && response.status === "FAILED") { // There was a server error while exporting group, allow user to try again
          console.error("Export Status Failed")
          clearInterval(this.exportStatusInterval)
          clearInterval(this.loadingStateInterval)
          this.exportLoadingStateopts.state = LoadingState.error
          this.exportLoadingStateopts.errorType = 'server'
        }
      }, (error) => {
        console.error('Error in check status: ', error)
        clearInterval(this.exportStatusInterval)
        clearInterval(this.loadingStateInterval)
        this.exportLoadingStateopts.state = LoadingState.error
        this.exportLoadingStateopts.errorType = 'server'
      }
    )
  }

  public closeExportLoadingState(event?: any): void {
    this.showExportLoadingState = false
    if(event && event['cancelExport']) {
      clearInterval(this.exportStatusInterval)
      clearInterval(this.loadingStateInterval)
      this._toasts.sendToast({
        id: 'cancelExport',
        type: 'info',
        stringHTML: '<p>Your group export was cancelled.</p>',
        links: []
      })
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

  /**
   * Performs the bulk export. Currently supported formats: zip and pptx.
   * @param imageIdsToDownload - List of image ids to be bulk exported
   * @param exportType - The export type. Supports either 'zip' or 'pptx'
   */
  private executeBulkExport(imageIdsToDownload: string[], exportType: SupportedExportTypes): void{
    this.exportLoadingStateopts = {
      exportType: exportType,
      state: LoadingState.loading,
      progress: 0,
      imageIdsToDownload: imageIdsToDownload
    }
    this.showExportLoadingState = true

    // Mimmic loading behaviour in intervals
    this.loadingStateInterval = setInterval(() => {
      this.exportLoadingStateopts.progress += 5
    }, this.getProgressIntervals(imageIdsToDownload.length, 20))


    this._ig.getDownloadLink(this.ig, imageIdsToDownload, exportType)
      .then( data => {
        // Handle 200 Response with "status": "FAILED"
        if (data.status === 'FAILED') {
          console.error('Export Failed:- ', data)
          clearInterval(this.loadingStateInterval)
          this.pollForExportStatus()
        }

        else if (data.path && this.showExportLoadingState) {
          let downloadLink = this._auth.getThumbHostname() + data.path.replace('/nas/', '/thumb/')
          clearInterval(this.loadingStateInterval)

          this.exportLoadingStateopts.progress = 100
          this.exportLoadingStateopts.state = LoadingState.completed
          this.trackBulkDownload(exportType, imageIdsToDownload)

          // On success fade out the component after 5 sec & begin download
          setTimeout(() => {
            this.closeExportLoadingState()
            this.downLoadFile(this.ig.name, downloadLink)
          }, 5000)
        }
      })
      .catch( error => {
        console.error(error)
        // Do not clear interval unless polling completes or fails
        this.pollForExportStatus()
      })
  }


}
