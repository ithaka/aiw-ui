import { DomUtilityService } from 'app/shared';
import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ElementRef, ViewChild } from '@angular/core'
import { NgForm } from '@angular/forms'
import { BehaviorSubject, Observable, Subscription } from 'rxjs'
import { map, take } from 'rxjs/operators'
import { CompleterService, CompleterData } from 'ng2-completer'
import { Angulartics2 } from 'angulartics2'
import { Router } from '@angular/router'

import { AssetService, GroupService, ImageGroup, AuthService, AssetSearchService } from './../../shared'

@Component({
  selector: 'ang-add-to-group',
  templateUrl: 'add-to-group.component.pug',
  styleUrls: ["./add-to-group.component.scss"]
})
export class AddToGroupModal implements OnInit, OnDestroy {
  @Output() closeModal: EventEmitter<any> = new EventEmitter();
  @Output() createGroup: EventEmitter<any> = new EventEmitter();
  @Output() showToast: EventEmitter<any> = new EventEmitter();
  @Input() showCreateGroup: boolean = false;
  public selectedIg: ImageGroup;
  public selectedGroupName: string;
  public selectedGroupError: string;

  @Input()
  public copySelectionStr: string = 'ADD_TO_GROUP_MODAL.FROM_SELECTED'

  public serviceResponse: {
    success?: boolean,
    failure?: boolean,
    tooManyAssets?: boolean
  } = {};

  public dataService: any;
  private subscriptions: Subscription[] = [];

  @Input() private selectedAssets: any[] = []; // this is used in the asset page, where a single asset can be injected directly
  private groups: ImageGroup[] = [];

  private detailedView: boolean = true

  private groupSearchTerm: string = ''
  private recentGroups: any[] = []
  private allGroups: any[] = []

  private groupsCurrentPage: number = 1
  private totalGroups: number = 0

  private loading: any = {
    recentGroups: false,
    allGroups: false
  }

  private selectedGroup: any = {}

  @ViewChild("modal", {read: ElementRef}) modalElement: ElementRef;

  constructor(
    private _assets: AssetService,
    private _search: AssetSearchService,
    private _group: GroupService,
    private _angulartics: Angulartics2,
    private completerService: CompleterService,
    private _auth: AuthService,
    private router: Router
      ) {}

    ngOnInit() {
    // Set focus to the modal to make the links in the modal first thing to tab for accessibility
    if (this.modalElement && this.modalElement.nativeElement){
      this.modalElement.nativeElement.focus()
    }

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

    this.loadRecentGroups()
    this.loadMyGroups()

  }

  ngOnDestroy() {
      this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
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
    this.selectedAssets.forEach((asset: any) => {
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
          putGroup.items.push(assetId);
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
        this.showToast.emit({
          type: 'success',
          stringHTML: '<p>You have successfully added item to <b>' + data.name + '</b>.</p><a class="toast-content-links" href="/#/group/' + data.id + '">Go to Group</a>'
        })
        this._group.update(data).pipe(
          take(1),
          map(
            (res) => { 
              this.serviceResponse.success = true
              this._assets.clearSelectMode.next(true)
              // Add to Group GA event 
              this._angulartics.eventTrack.next({ action: 'addToGroup', properties: { category: this._auth.getGACategory(), label: this.router.url }})
            },
            (err) => { 
              console.error(err); this.serviceResponse.failure = true;
              console.log('error happening');
            }
        )).subscribe()

      })
      .catch((error) => {
          console.error(error);
          console.log('error happening');
      });


  }

  private loadRecentGroups(): void{
    this.loading.recentGroups = true
    this._group.getAll(
      'created', 3, 1, [], '', '', 'date', 'desc'
    ).pipe(
    take(1),
      map(data  => {
        for(let i = 0; i < data.groups.length; i++){
          let group = data.groups[i]
          this._assets.getAllThumbnails(group.items.slice(0, 1))
            .then( allThumbnails => {
              group['thumbnailImgUrl'] = allThumbnails[0]['thumbnailImgUrl']
              group['compoundmediaCount'] = allThumbnails[0]['compoundmediaCount']
              this.recentGroups.push( group )
              if( i === (data.groups.length - 1) ){
                this.loading.recentGroups = false
              }
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
    this._group.getAll(
      'created', 10, this.groupsCurrentPage, [], this.groupSearchTerm, '', 'alpha', 'asc'
    ).pipe(
    take(1),
      map(data  => {
        this.totalGroups = data.total
        for(let i = 0; i < data.groups.length; i++){
          let group = data.groups[i]
          this._assets.getAllThumbnails(group.items.slice(0, 1))
            .then( allThumbnails => {
              group['thumbnailImgUrl'] = allThumbnails[0]['thumbnailImgUrl']
              group['compoundmediaCount'] = allThumbnails[0]['compoundmediaCount']
              this.allGroups.push( group )

              if( i === (data.groups.length - 1) ){
                this.loading.allGroups = false
              }
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

  private loadMoreGroups(): void{
    if(this.allGroups.length < this.totalGroups){
      this.groupsCurrentPage++
      this.loadMyGroups()
    }
  }

  private selectGroup(selectedGroup: any): void{
    this.recentGroups = this.recentGroups.map( (recentGroup) => {
      if(recentGroup.id === selectedGroup.id) {
        recentGroup.selected = !recentGroup.selected
        this.selectedGroup = recentGroup.selected ? recentGroup : {}
      } else {
        recentGroup.selected = false
      }
      return recentGroup
    })

    this.allGroups = this.allGroups.map( (group) => {
      if(group.id === selectedGroup.id) {
        group.selected = !group.selected
        this.selectedGroup = group.selected ? group : {}
      } else {
        group.selected = false
      }
      return group
    })
  }

  private searchGroups(event): void{
    // Execute search after every third character of the search term
    // if( (this.groupSearchTerm.length > 0) && (this.groupSearchTerm.length % 3 === 0) ){
      this.groupsCurrentPage = 1
      this.allGroups = []
      this.loadMyGroups()
    // }
  }

  private clearGroupSearch(): void{
    this.groupSearchTerm = ''
    this.groupsCurrentPage = 1
    this.allGroups = []
    this.loadMyGroups()
  }

  private extractData(res: any) {
      let body = res.json();
      return body || { };
  }
}
