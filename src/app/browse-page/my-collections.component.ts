import { Component, OnInit } from '@angular/core'
import { Router, ActivatedRoute, Params } from '@angular/router'
import { Subscription } from 'rxjs'
import { map } from 'rxjs/operators'
import { HttpClient, HttpHeaders } from '@angular/common/http'


import { TagsService } from './tags.service'
import { Tag } from './tag/tag.class'
import { LockerService } from 'app/_services'
import { TitleService, AssetSearchService, AuthService, AssetService, FlagService } from '../shared'

@Component({
  selector: 'ang-my-collections',
  templateUrl: 'my-collections.component.pug',
  styleUrls: ['./browse-page.component.scss']
})
export class MyCollectionsComponent implements OnInit {
  public unaffiliatedUser: boolean = false

  public isLoggedIn: boolean
  //   private showUploadImgsModal: boolean = false;
  public showEditPCModal: boolean = false

  public pcollections: any
  public myPersonalCollection: Tag = new Tag('37436', 'My Personal Collection', true, null, { label: 'pcollection', folder: true }, true);

  public loading: boolean = false;
  private subscriptions: Subscription[] = [];
  private categories = [];
  private tags: Tag[] = [];
  private expandedCategories: any = {}
  private selectedBrowseId: string = ''

  private editTagId: string = '';

  // Reference activeTag for description on side
  private activeTag: Tag;
  constructor(
    private _auth: AuthService,
    private _flags: FlagService,
    private router: Router,
    private route: ActivatedRoute,
    private _search: AssetSearchService,
    private _assets: AssetService,
    private _title: TitleService,
    private _tags: TagsService,
    private _http: HttpClient,
    private _locker: LockerService
  ) {
    this.unaffiliatedUser = this._auth.isPublicOnly() ? true : false
  }

  ngOnInit() {
    // Add tag for My Personal Collection
    let colTag = new Tag('37436', 'My Personal Collection', true, null, { label: 'pcollection', folder: true }, true);
    this.tags.push(colTag);

    // Set page title
    this._title.setSubtitle('Browse My Collections')

    this.subscriptions.push(
      this.route.params.pipe(
        map((params: Params) => {
          if (params) {
            if (params['viewId']) {
              this.selectedBrowseId = params['viewId'];
              // this.loadCategory();
            }

            if (params['featureFlag']) {
              this._flags[params['featureFlag']] = true;
            }

            if (params['upload']) {
              this.showEditPCModal = params['upload']
            }
          }
        })).subscribe()
    )

    // Subscribe to User object updates
    this.subscriptions.push(
      this._auth.currentUser.pipe(
        map(userObj => {
          this.isLoggedIn = userObj.isLoggedIn
        },
          (err) => { console.error(err) }
        )).subscribe()
    )

    // // If user is logged-in get data for user's Private Collections
    if (this.isLoggedIn) {
      this.getUserPCol('private')
    }
  } // OnInit

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }

  /**
   * Changes menu between ADL, University Collections, Open Collections, etc...
   * @param id Id of desired menu from colMenuArray enum
   */
  selectBrowseOpt(id: string) {
    this.expandedCategories = {};
    this.selectedBrowseId = id;
    this.addRouteParam('viewId', id);
  }

  /**
   * Load Private Collections
   * Used for loading user's Private Collections
   */
  getUserPCol(type: string) {
    this.loading = true
    let options = { withCredentials: true }
    let localPCollections = this._locker.get('pcollections')

    if (localPCollections) {
      this.pcollections = localPCollections
    }
    else {
      this._http.get(this._auth.getHostname() + '/api/v1/collections?type=' + type, options).pipe(
        map(res => {
          this.pcollections = res
          console.log('PRIVATE COLLECTIONS: ', this.pcollections)
        })).subscribe()
    }

    // Set tags
    for (let col of this.pcollections) {
      // My Personal Collection
      if (col.collectionid === '37436') {
        // Add tag for My Personal Collection
        this.tags.push(this.myPersonalCollection);
      }
    }
  }

  toggleInfo(node) {
    if (node.info_expanded) {
      node.info_expanded = false;
    }
    else {
      if (typeof node.info_expanded == 'undefined') {
        this.showNodeDesc(node);
      }
      node.info_expanded = true;
    }
  }

  showNodeDesc(node) {
    let descId = '';
    let nodeId = '';

    if (node.descriptionId) {
      descId = node.descriptionId;
      nodeId = node.widgetId;
    }
    else if (node.parentDescId) {
      descId = node.parentDescId;
      nodeId = node.parentId;
    }

    this._assets.nodeDesc(descId, nodeId)
      .then((res) => {
        if (res['blurbUrl']) {
          node.info_desc = res['blurbUrl'];
          node.info_img = res['imageUrl'];
        }
      })
      .catch(function (err) {
        console.log('Unable to load Description.');
      });
  }

  openAssets(node) {
    if (!node.isFolder) {
      if (node.hasOwnProperty('grpId')) {
        // Navigate to Collection
        this.router.navigate(['image-group', { 'igId': node.grpId }]);
      } else {
        // Navigate to Image Group
        this.router.navigate(['collection', { 'colId': node.widgetId }]);
      }
    }
  }

  showHideNode(node) {
    // A node in the tree will only be hidden if any of its parent nodes, going up the hierarchy, is collapsed.
    let isExpanded = true;
    let parentNode: any = {};
    if (node.parentId) {
      parentNode = this.getNodeByWidgetId(node.parentId);
      if (this.expandedCategories[parentNode.widgetId] == false) {
        isExpanded = false;
      }
      else {
        isExpanded = this.showHideNode(parentNode);
      }
    }
    return isExpanded;
  }

  getNodeByWidgetId(id) {
    let node = {};
    for (let cat of this.categories) {
      if (cat.widgetId == id) {
        node = cat;
      }
    }
    return node;
  }

  private showEditModal(tag): void {
    this.editTagId = tag.tagId;
    this.showEditPCModal = true;
  }

  /**
 * Adds a parameter to the route and navigates to new route
 * @param key Parameter you want added to route (as matrix param)
 * @param value The value of the parameter
 */
  private addRouteParam(key: string, value: any) {
    let currentParamsObj: Params = Object.assign({}, this.route.snapshot.params);
    currentParamsObj[key] = value;

    this.router.navigate([currentParamsObj], { relativeTo: this.route });
  }
}
