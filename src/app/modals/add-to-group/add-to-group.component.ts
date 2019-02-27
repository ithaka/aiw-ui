import { Component, OnInit, AfterViewInit, OnDestroy, Input, Output, EventEmitter, ElementRef, ViewChild } from '@angular/core'
import { NgForm } from '@angular/forms'
import { BehaviorSubject, Observable, Subscription } from 'rxjs'
import { map, take } from 'rxjs/operators'
import { CompleterService, CompleterData } from 'ng2-completer'
import { Angulartics2 } from 'angulartics2'
import { Router } from '@angular/router'

import { AssetService, GroupService, ImageGroup, AuthService, AssetSearchService, DomUtilityService } from './../../shared'

@Component({
  selector: 'ang-add-to-group',
  templateUrl: 'add-to-group.component.pug',
  styleUrls: ["./add-to-group.component.scss"]
})
export class AddToGroupModal implements OnInit, OnDestroy, AfterViewInit {
  @Output() closeModal: EventEmitter<any> = new EventEmitter()
  @Output() createGroup: EventEmitter<any> = new EventEmitter()
  @Output() showToast: EventEmitter<any> = new EventEmitter()
  @Input() public copySelectionStr: string = 'ADD_TO_GROUP_MODAL.FROM_SELECTED'
  @Input() showCreateGroup: boolean = true
  @Input() public selectedAssets: any[] = [] // this is used in the asset page, where a single asset can be injected directly

  public selectedIg: ImageGroup
  public selectedGroupName: string
  public selectedGroupError: string

  public serviceResponse: {
    success?: boolean,
    failure?: boolean,
    tooManyAssets?: boolean
  } = {}

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

  public detailViewBounds: any = {}
  public selectedGroup: any = {}

  private allGroupSearchTS: number = 0

  private groupSelectLastKeyCode: string = ''

  private subscriptions: Subscription[] = []

  private lastSearchTerm: string = ''

  @ViewChild("modal", {read: ElementRef}) modalElement: ElementRef

  constructor(
    private _assets: AssetService,
    private _search: AssetSearchService,
    private _group: GroupService,
    private _dom: DomUtilityService,
    private _angulartics: Angulartics2,
    private completerService: CompleterService,
    private _auth: AuthService,
    private router: Router
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

    if(this.selectedAssets[0]['detailViewBounds'] && this.selectedAssets[0]['detailViewBounds']['width']){
      this.detailViewBounds = this.selectedAssets[0]['detailViewBounds']
      this.detailPreviewURL = this.selectedAssets[0].tileSource.replace('info.json', '') + Math.round( this.detailViewBounds['x'] ) + ',' + Math.round( this.detailViewBounds['y'] ) + ',' + Math.round( this.detailViewBounds['width'] ) + ',' + Math.round( this.detailViewBounds['height'] ) + '/352,/0/native.jpg'
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
    let elementSelector: string = this.detailViewBounds.width ? '.preview-cntnr img' : '.modal-title'
    let modalStartFocus: HTMLElement = <HTMLElement>this._dom.bySelector(elementSelector)
    modalStartFocus.focus()
  }

  // Set focus on the last modal element in tab order
  public focusLastElement(event: any) {
    let lastElement: HTMLElement = <HTMLElement>this._dom.bySelector('.help-link')
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

    if (!this.selectedGroup.id) {
      this.selectedGroupError = 'ADD_TO_GROUP_MODAL.NO_GROUP'
      return
    }

    // Create object for new modified group
    let putGroup: ImageGroup = Object.assign({}, this.selectedGroup)

    // assets come from different places and sometimes have id and sometimes objectId
    this.selectedAssets.forEach((asset: any, index) => {
      let assetId: string
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
        // Add id to group if it's not already in the group
        if (assetId && putGroup.items.indexOf(assetId) < 0) {
          if( index === 0 && this.detailViewBounds['width']){
            putGroup.items.push({
              "artstorid": assetId,
              "zoom": {
                "viewerX":this.detailViewBounds['x'],
                "viewerY": this.detailViewBounds['y'],
                "pointWidth": this.detailViewBounds['width'],
                "pointHeight": this.detailViewBounds['height']
              }
            })
          } else {
            putGroup.items.push(assetId);
          }
        }
      }
    })

    // throw an error if the image group is going to be larger than 1000 images
    //  otherwise the server will do that when we call it
    if (putGroup.items && putGroup.items.length > 1000) {
      return this.serviceResponse.tooManyAssets = true
    }

    // go get the group from the server
    this._group.get(this.selectedGroup.id)
      .toPromise()
      .then((data) => {
        data.items = putGroup.items
        console.log('Update data from new modal:- ', data)
        this._group.update(data).pipe(
          take(1),
          map(
            (res) => {
              this.serviceResponse.success = true
              this._assets.clearSelectMode.next(true)
              this.closeModal.emit()
              this.showToast.emit({
                type: 'success',
                stringHTML: '<p>You have successfully added item to <b>' + data.name + '</b>.</p><a class="toast-content-links" href="/#/group/' + data.id + '">Go to Group</a>'
              })
              // Add to Group GA event
              this._angulartics.eventTrack.next({ action: 'addToGroup', properties: { category: this._auth.getGACategory(), label: this.router.url }})
            },
            (err) => {
              console.error(err); this.serviceResponse.failure = true;
              this.showToast.emit({
                type: 'error',
                stringHTML: '<p>Unable to add item to group. Try again later or if the problem persists contact <a href="http://support.artstor.org/">support</a>.</p>'
              })
            }
        )).subscribe()

      })
      .catch((error) => {
          console.error(error);
          this.showToast.emit({
            type: 'error',
            stringHTML: '<p>Unable to add item to group. Try again later or if the problem persists contact <a href="http://support.artstor.org/">support</a>.</p>'
          })
      });


  }

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

  private loadRecentGroups(): void{
    this.loading.recentGroups = true
    this._group.getAll(
      'created', 3, 1, [], '', '', 'date', 'desc'
    ).pipe(
    take(1),
      map(data => {
        let itemIds: string[] = []
        for(let group of data.groups) {
          if(group.items.length > 0) {
            itemIds.push(group.items[0])
          }
        }

        // Check the length of itemIds to remove invalid call with object_id=null
        if(itemIds.length !== 0) {
          this._assets.getAllThumbnails(itemIds)
          .then( allThumbnails => {
            allThumbnails = allThumbnails.map( thmbObj => {
              for (let group of data.groups) {
                if(group.items[0] && group.items[0] === thmbObj.objectId){
                  group['thumbnailImgUrl'] = thmbObj['thumbnailImgUrl']
                  group['compoundmediaCount'] = thmbObj['compoundmediaCount']
                }
              }
              return thmbObj
            })
            
            this.recentGroups = data.groups
            this.loading.recentGroups = false
          })
          .catch( error => {
            console.error(error)
          })
        }  
      },
      (error) => {
        console.error(error)
      }
    )).subscribe()
  }

  private loadMyGroups(): void{
    this.loading.allGroups = true
    let timeStamp = this.allGroupSearchTS

    this._group.getAll(
      'created', 10, this.groupsCurrentPage, [], this.groupSearchTerm, '', 'alpha', 'asc'
    ).pipe(
      take(1),
      map(data  => {
        this.totalGroups = data.total

        let itemIds: string[] = []
        for(let group of data.groups) {
          if(group.items.length > 0){
            itemIds.push(group.items[0])
          }
        }

        // Check the length of itemIds to remove invalid call with object_id=null
        if(itemIds.length !== 0) {
          this._assets.getAllThumbnails(itemIds)
          .then( allThumbnails => {
            allThumbnails = allThumbnails.map( thmbObj => {
              for (let group of data.groups) {
                if(group.items[0] && group.items[0] === thmbObj.objectId){
                  group['thumbnailImgUrl'] = thmbObj['thumbnailImgUrl']
                  group['compoundmediaCount'] = thmbObj['compoundmediaCount']
                }
              }
              return thmbObj
            })
            
            if(timeStamp === this.allGroupSearchTS) {
              this.allGroups = this.allGroups.concat(data.groups)
            }
            this.loading.allGroups = false
          })
          .catch( error => {
            console.error(error)
          })
        }
      },
      (error) => {
        console.error(error)
      }
    )).subscribe()
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
}
