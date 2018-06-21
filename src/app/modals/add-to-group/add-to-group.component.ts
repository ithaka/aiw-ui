import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { NgForm } from '@angular/forms';
import { BehaviorSubject, Observable, Subscription } from 'rxjs/Rx';
import { CompleterService, CompleterData } from 'ng2-completer';

import { AssetService, GroupService, ImageGroup } from './../../shared';

@Component({
  selector: 'ang-add-to-group',
  templateUrl: 'add-to-group.component.pug'
})
export class AddToGroupModal implements OnInit, OnDestroy {
  @Output() closeModal: EventEmitter<any> = new EventEmitter();
  @Output() createGroup: EventEmitter<any> = new EventEmitter();
  @Input() showCreateGroup: boolean = false;
  private subscriptions: Subscription[] = [];

  @Input() private selectedAssets: any[] = []; // this is used in the asset page, where a single asset can be injected directly
  private groups: ImageGroup[] = [];
  private selectedIg: ImageGroup;
  private selectedGroupName: string;
  private selectedGroupError: string;

  @Input()
  private copySelectionStr: string = 'ADD_TO_GROUP_MODAL.FROM_SELECTED'

  private serviceResponse: {
    success?: boolean,
    failure?: boolean,
    tooManyAssets?: boolean
  } = {};

  private dataService: any;

  constructor(
    private _assets: AssetService,
    private _group: GroupService,
    private completerService: CompleterService
  ) {}

  /**
   * Observable for autocomplete list of groups
   * - We apply additional sorting
   */
  private groupListSubject: BehaviorSubject<any[]> = new BehaviorSubject([])
  private groupListObs: Observable<any[]> = this.groupListSubject.asObservable()

  ngOnInit() {
    // Set focus to the modal to make the links in the modal first thing to tab for accessibility
    let htmlelement:HTMLElement = document.getElementById("modal");
    htmlelement.focus()

    if (this.selectedAssets.length < 1) { // if no assets were added when component was initialized, the component gets the current selection list
      // Subscribe to asset selection
      this.subscriptions.push(
        this._assets.selection.subscribe(
          assets => {
            this.selectedAssets = assets;
          },
          error => {
            console.error(error);
          }
        )
      );
    }

    // Load list of Groups, and update autocomplete as Groups load
    this._group.getEveryGroup('private')
      .subscribe((groups) => {
        if (groups) {
          this.groups = groups;
          // Data service for the autocomplete component (ng2 completer)
          this.dataService = this.completerService.local(this.groupListObs, 'name', 'name');
        }
      }, (err) => { console.error(err); });


  }

  ngOnDestroy() {
      this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }

  private sortGroup(event) : void {
    // sort array by string input
    let term = this.selectedGroupName
    let termReg = new RegExp(term, 'i')

    let filtered = this.groups.filter( group => {
      return group && group.name.search(termReg) > -1
    })
    filtered = filtered.sort((a, b) => {
        return a.name.search(termReg) - b.name.search(termReg)
    });
    this.groupListSubject.next(filtered)
  }

  /**
   * Submits updates to Group
   * @param form Values to update the group with
   */
  private submitGroupUpdate(form: NgForm) {
    // clear any service status
    this.serviceResponse = {}
    this.selectedGroupError = ''

    // Find full group object based on group name
    this.groups.forEach( (group, index) => {
      if (group.name == this.selectedGroupName) {
        this.selectedIg = group
      }
    })

    if (!this.selectedIg || this.selectedGroupName.length < 1) {
      this.selectedGroupError = "ADD_TO_GROUP_MODAL.NO_GROUP"
      return
    }

    // Create object for new modified group
    let putGroup: ImageGroup = Object.assign({}, this.selectedIg)

    // assets come from different places and sometimes have id and sometimes objectId
    this.selectedAssets.forEach((asset: any) => {
      let assetId: string
      if (!asset) {
        console.error("Attempted selecting undefined asset")
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
          console.error("Asset id not found when adding to group", asset)
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
    this._group.get(this.selectedIg.id)
      .toPromise()
      .then((data) => {
        data.items = putGroup.items

        this._group.update(data)
          .take(1)
          .subscribe(
            (res) => { this.serviceResponse.success = true; this._assets.clearSelectMode.next(true); },
            (err) => { console.error(err); this.serviceResponse.failure = true;
          })

      })
      .catch((error) => {
          console.error(error);
      });


  }

  private extractData(res: any) {
      let body = res.json();
      return body || { };
  }
}
