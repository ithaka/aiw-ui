import { Component, OnInit, AfterViewInit, OnDestroy, Input, Output, EventEmitter, ElementRef, ViewChild } from '@angular/core'
import { NgForm } from '@angular/forms'
import { Subscription, from } from 'rxjs'
import { map, take, mergeMap } from 'rxjs/operators'
import { CompleterService } from 'ng2-completer'
import { Angulartics2 } from 'angulartics2'
import { Router } from '@angular/router'

// Project Dependencies
import { AssetService, GroupService, AuthService, DomUtilityService, ThumbnailService, LogService } from '_services'
import { ImageGroup, ImageZoomParams, Asset } from 'datatypes'
import { ToastService } from 'app/_services'
import { GroupList } from "shared";
import { Observable } from "rxjs/Rx";

@Component({
  selector: 'ang-add-to-group',
  templateUrl: 'add-to-group.component.pug',
  styleUrls: ["./add-to-group.component.scss"]
})
export class AddToGroupModal implements OnInit, OnDestroy, AfterViewInit {
  @Output() closeModal: EventEmitter<any> = new EventEmitter()
  @Output() createGroup: EventEmitter<any> = new EventEmitter()
  @Output() doLog: EventEmitter<any> = new EventEmitter()

  @Input() public copySelectionStr: string = 'ADD_TO_GROUP_MODAL.FROM_SELECTED'
  @Input() showCreateGroup: boolean = true
  @Input() public selectedAssets: Asset[] = [] // this is used in the asset page, where a single asset can be injected directly

  public selectedIg: ImageGroup
  public selectedGroupName: string
  public selectedGroupError: string

  public serviceResponse: {
    success?: boolean,
    failure?: boolean,
    tooManyAssets?: boolean
  } = {}
  public errorMsg: string = ''

  public dataService: any

  public groups: ImageGroup[] = []

  public detailPreviewURL: string = ''

  public groupSearchTerm: string = ''
  public recentGroups: any[] = []
  public allGroups: any[] = []

  public groupsCurrentPage: number = 1
  public totalGroups: number = 0

  public loading: any = {
    recentGroups: false,
    allGroups: false
  }
  public error: any = {
    recentGroups: false,
    allGroups: false
  }

  public detailViewBounds: ImageZoomParams = {}
  public selectedGroup: any = {}

  private groupsPageSize: number = 30

  private allGroupSearchTS: number = 0

  private groupSelectLastKeyCode: string = ''

  private subscriptions: Subscription[] = []

  private lastSearchTerm: string = ''

  @ViewChild("modal", {read: ElementRef}) modalElement: ElementRef

  constructor(
    private _assets: AssetService,
    private _thumbnail: ThumbnailService,
    private _group: GroupService,
    private _angulartics: Angulartics2,
    private completerService: CompleterService,
    private _auth: AuthService,
    private router: Router,
    private _toasts: ToastService,
    private _dom: DomUtilityService,
    private _log: LogService
      ) {}

    ngOnInit() {
    if (this.selectedAssets.length < 1) { // if no assets were added when component was initialized, the component gets the current selection list
      // Subscribe to asset selection
      this.subscriptions.push(
        this._assets.selection.pipe(
        map(assets => {
            this.selectedAssets = assets;
          },
          error => {
            console.error(error);
          }
        )).subscribe()
      );
    }

    this.allGroupSearchTS = Date.now()

    this.loadRecentGroups()
    this.loadMyGroups()

    if(this.selectedAssets[0]['zoom'] && this.selectedAssets[0]['zoom']['pointWidth']){
      this.detailViewBounds = this.selectedAssets[0]['zoom']
      this.detailPreviewURL = this.selectedAssets[0].tileSource ? this.selectedAssets[0].tileSource.replace('info.json', '') + this.detailViewBounds['viewerX'] + ',' + this.detailViewBounds['viewerY'] + ',' + this.detailViewBounds['pointWidth'] + ',' + this.detailViewBounds['pointHeight'] + '/352,/0/' + this.selectedAssets[0].iiifFilename() : ''
    }

    // Freeze background body scroll
    document.getElementsByTagName('body')[0].style['overflow'] = 'hidden'
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe(); });

    // Unfreeze background body scroll
    document.getElementsByTagName('body')[0].style['overflow'] = 'initial'
  }

  ngAfterViewInit() {
    this.startModalFocus()
  }

  // Set initial focus on the modal Title h1
  public startModalFocus() {
    let elementSelector: string = this.detailPreviewURL ? '.preview-cntnr img' : '.modal-title'
    let modalStartFocus: HTMLElement = <HTMLElement>this._dom.bySelector(elementSelector)
    modalStartFocus.focus()
  }

  // Set focus on the last modal element in tab order
  public focusLastElement(event: any) {
    let lastElement: HTMLElement = <HTMLElement>this._dom.bySelector('.help-link-icon')
    lastElement.focus()
    event.stopPropagation()
    event.preventDefault()
  }

  /**
   * Sort/filter function for ng2-completer
   * @param event key or click event
   * @param term string being typed by user
   */
  public sortGroup(event, term): void {
     // Do not evaluate if key up event is arrow key
     if ([37, 38, 39, 40].indexOf(event.keyCode) > -1) {
      return
    }
    // sort array by string input
    let termReg = new RegExp(term, 'i')

    let filtered = this.groups.filter( group => {
      return group && group.name.search(termReg) > -1
    })
    filtered = filtered.sort((a, b) => {
        return a.name.search(termReg) - b.name.search(termReg)
    });
    // Update completer with sorted values
    this.dataService = this.completerService.local(filtered, 'name', 'name');
  }

  /**
   * Submits updates to Group
   * @param form Values to update the group with
   */
  public submitGroupUpdate(form: NgForm) {

    // clear any service status
    this.serviceResponse = {}
    this.selectedGroupError = ''
    this.errorMsg = ''

    if (!this.selectedGroup.id) {
      this.selectedGroupError = 'ADD_TO_GROUP_MODAL.NO_GROUP'
      return
    }

    let multipleSelected: boolean = this.selectedAssets.length > 1


    // go get the group from the server
    this._group.get(this.selectedGroup.id)
      .toPromise()
      .then((data) => {

        let putGroup = data
        let zoom: {}

        if (putGroup.items && putGroup.items.length >= 1000) {
          // this.errorMsg = '<p>Sorry, that group would exceed 1000 assets. You will need to remove some before adding more.</p>'
          this._toasts.sendToast({
            id: 'addToGroupItemLimit',
            type: 'error',
            stringHTML: '<p>This group has exceeded the 1000 item limit.</p>',
            links: []
          })

          return this.serviceResponse.tooManyAssets = true
        }

        this.selectedAssets.forEach((asset: any, index) => {
          let assetId
          if (!asset) {
            console.error('Attempted selecting undefined asset')
          } else {
            // Find asset id
            if (asset.artstorid) {
              // Data returned from Solr uses "artstorid"
              assetId = asset.artstorid
            } else if (asset.objectId) {
              // Data returned from Items service
              assetId = asset.objectId
            } else if (asset.id) {
              // Asset has "id" when constructed via the Artstor Viewer (see type: Asset)
              assetId = asset.id
            } else {
              console.error('Asset id not found when adding to group', asset)
            }
          }

          // Update a group with a zoomed details
          if(asset['zoom'] && asset['zoom']['viewerX']){
            zoom = asset['zoom']
            putGroup.items.push({ id: assetId, zoom })
          } else {
            putGroup.items.push({ id: assetId })
          }
        })

        this._group.update(putGroup).pipe(
          take(1),
          map(
            (res) => {
              this.serviceResponse.success = true
              this._assets.clearSelectMode.next(true)
              this.doLog.emit({group_id: this.selectedGroup.id, add_detail_view: !!this.detailPreviewURL })
              this.closeModal.emit()
              this._toasts.sendToast({
                id: 'addToGroup',
                type: 'success',
                stringHTML: '<p>' + (multipleSelected ? 'The items were added' : 'The item was added') + ' to <b>' + data.name + '</b>.</p>',
                links: [{
                  routerLink: ['/group/' + data.id, { 'refresh': true } ],
                  label: 'Go to group',
                }]
              })

              // Add detail to group GA event
              if (this.detailViewBounds && this.detailViewBounds.pointWidth) {
                this._angulartics.eventTrack.next({ properties: { event: 'addDetail', category: 'groups', label: 'existing group' }})
              }

              // Add to Group GA event
              this._angulartics.eventTrack.next({ properties: { event: 'addToGroup', category: 'groups', label: this.router.url }})
            },
            (err) => {
              console.error(err); this.serviceResponse.failure = true;
              this.errorMsg = '<p>Sorry, we weren’t able to add the '+ (multipleSelected ? 'items' : 'item') +' at this time. Try again later or contact <a href="http://support.artstor.org/">support</a>.</p>'
            }
        )).subscribe()

      })
      .catch((error) => {
          console.error(error);
          this.errorMsg = '<p>Sorry, we weren’t able to add the '+ (multipleSelected ? 'items' : 'item') +' at this time. Try again later or contact <a href="http://support.artstor.org/">support</a>.</p>'
      });
  } // submitGroupUpdate

  public loadMoreGroups(): void {
    if (this.allGroups.length < this.totalGroups) {
      this.groupsCurrentPage++
      this.loadMyGroups()
    }
  }

  public searchGroups(force?: boolean): void {
    // Use ">=" instead of ">" so that when we have empty search term (when we type something and delete it), we will reload the groups
	  // Use setTimeout to make a brief pause in keypress events to prevent from overloading the backend
    setTimeout((force?) => {
    if ((this.groupSearchTerm.length >= 0 && this.groupSearchTerm !== this.lastSearchTerm) || force) {
      this.groupsCurrentPage = 1
      this.allGroups = []
      this.clearSelectedGroup()
      this.allGroupSearchTS = Date.now()
      this.loadMyGroups()
    }
    this.lastSearchTerm = this.groupSearchTerm
    }, 200)
  }

  public groupSelectKeyDown(event: any, selected: boolean): void{
    // Focus Add button if the user presses Tab right after Enter, Space, or click to select the group
    if( (this.groupSelectLastKeyCode === 'Enter' || this.groupSelectLastKeyCode === 'Space' || this.groupSelectLastKeyCode === 'click')
        && (event.code === 'Tab') && selected) {

      let primaryBtn: HTMLElement = <HTMLElement>this._dom.bySelector('#addBtn')
      primaryBtn.focus()
      event.stopPropagation()
      event.preventDefault()
    }
    this.groupSelectLastKeyCode = event.type === 'click' ? event.type : event.code
  }

  // Set focus on selected group, for backward tab from 'Add' button
  public focusOnSelectedGroup() {

    setTimeout(() => {
      let focusedGroup = this._dom.byId(this.selectedGroup.id)
      focusedGroup.focus()
    }, 100)
  }

  private injectThumbnails(groups) {
    const itemIds = groups.filter(group => group.items.length > 0).map(group => group.items[0])

      return this._assets.getAllThumbnails({ itemIds })
        .then( thumbnails => {
          return thumbnails.reduce((thumbnailMap, thumbnail) => {
            thumbnailMap[thumbnail.id] = thumbnail
            return thumbnailMap
          }, {})
        })
        .then(thumbnailMap => {
          return groups.map(group => {
            const groupClone: any = {...group}

            if(groupClone.items.length > 0) {
              let firstItemId: string = group.items[0],
                  firstItemThumbnail: any = thumbnailMap[firstItemId]

                if(firstItemThumbnail) {
                  groupClone.thumbnailImgUrl = firstItemThumbnail.thumbnailImgUrl
                  groupClone.compoundmediaCount = firstItemThumbnail.compoundmediaCount
                }
            }

            return groupClone
          })
        })
  }

  private loadRecentGroups(): void {
    this.loading.recentGroups = true
    this.error.recentGroups = false

    this.loadGroups(3, 1, '', 'date', 'desc').subscribe(
      (groups) => {
        this.recentGroups = groups
      },
      (error) => {
        this.error.recentGroups = true
      }
    ).add(() => {
      this.loading.recentGroups = false
    })
  }

  private loadMyGroups() {
    this.loading.allGroups = true
    this.error.allGroups = false

    let timeStamp = this.allGroupSearchTS

    this.loadGroups(this.groupsPageSize, this.groupsCurrentPage, this.groupSearchTerm, 'alpha', 'asc').subscribe(
      (groups) => {
        if (timeStamp === this.allGroupSearchTS) {
          this.allGroups = this.allGroups.concat(groups)
        }
      },
      (error) => {
        this.error.allGroups = true
      }
    ).add(() => {
      this.loading.allGroups = false
    })
  }

  private loadGroups(amount, pageNumber, query, sortBy, order): Observable<any> {
    return this._group.getAll('created', amount, pageNumber, [], query, '', sortBy, order)
      .pipe(
        map((response: GroupList) => {
          this.totalGroups = response.total
          return response.groups
        }),
        mergeMap(groups => from(this.injectThumbnails(groups)))
      )
  }

  private selectGroup(selectedGroup: any, type: string): void{
    if (type === 'recent') { // If selected group is from recent groups
      this.recentGroups = this.recentGroups.map( (recentGroup) => {
        if(recentGroup.id === selectedGroup.id) {
          recentGroup.selected = !recentGroup.selected
          this.selectedGroup = recentGroup.selected ? recentGroup : {}
        } else {
          recentGroup.selected = false
        }
        return recentGroup
      })
      // Clear selection for all groups
      this.allGroups = this.allGroups.map( (group) => {
        group.selected = false
        return group
      })
    } else { // If selected group is from all groups
      this.allGroups = this.allGroups.map( (group) => {
        if(group.id === selectedGroup.id) {
          group.selected = !group.selected
          this.selectedGroup = group.selected ? group : {}
        } else {
          group.selected = false
        }
        return group
      })
      // Clear selection for recent groups
      this.recentGroups = this.recentGroups.map( (recentGroup) => {
        recentGroup.selected = false
        return recentGroup
      })
    }
  }

  private clearGroupSearch(): void{
    this.groupSearchTerm = ''
    this.groupsCurrentPage = 1
    this.allGroups = []
    this.clearSelectedGroup()
    this.allGroupSearchTS = Date.now()
    this.loadMyGroups()
  }

  private extractData(res: any) {
      let body = res.json();
      return body || { };
  }

  private clearSelectedGroup(): void{
    this.selectedGroup = {}
    this.recentGroups = this.recentGroups.map( group => {
      group.selected = false
      return group
    })
  }

  private logAddToGroupEvent(): void {
    // If the request is from the collection/search page, log save selections to existing group into Captain's Log
    if (this.copySelectionStr !== 'ADD_TO_GROUP_MODAL.FROM_ASSET') {
      let item_ids = this.selectedAssets.map(asset => {
        return asset.id
      })
      this._log.log({
        eventType: 'artstor_save_selections_to_existing',
        additional_fields: {
            group_id: this.selectedGroup.id,
            item_ids: item_ids
        }
      })
    }
  }

}
