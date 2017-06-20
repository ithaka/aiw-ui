import { Title } from '@angular/platform-browser'
import { Component, OnInit } from '@angular/core'
import { Router, ActivatedRoute, Params } from '@angular/router'
import { Subscription }   from 'rxjs/Subscription'

import { AssetService, AuthService, GroupService } from './../../shared'
import { AnalyticsService } from './../../analytics.service'
import { Tag } from './../tag'
import { TagFiltersService } from './tag-filters.service'

@Component({
  selector: 'ang-browse-groups',
  templateUrl: 'groups.component.html'
  // styleUrls: [ './browse-page.component.scss' ]
})
export class BrowseGroupsComponent implements OnInit {
  constructor(
    private _router: Router,
    private _assets: AssetService,
    private _groups: GroupService,
    private _tagFilters: TagFiltersService,
    private _auth: AuthService,
    private _analytics: AnalyticsService,
    private _title: Title,
    private route: ActivatedRoute
  ) { }

  private subscriptions: Subscription[] = []

  private userTypeId: any
  private currentBrowseRes: any = {}
  private tags: Tag[] = []
  private loading: boolean = true

  private pagination: any = {
    totalPages: 1,
    pageSize: 48,
    currentPage: 1
  }

  private tagFilters = []
  private appliedTags = []

  private expandedCategories: any = {}
  private selectedBrowseLevel: string = 'public'
  private browseMenuArray: { label: string, level: string }[] = []

  private foldersObj: any = {}
  private tagsObj: any = {}
  private pageObj: any = {}

  private errorObj: any = {}
  
  ngOnInit() {
    // set the title
    this._title.setTitle("Artstor | Browse Groups")

    this.subscriptions.push(
      this.route.queryParams.subscribe((query) => {
        if (query.tags) {
          let appliedTags = this._tagFilters.processFilterString(query.tags)
          this.loadIGs(this.selectedBrowseLevel, appliedTags)
        } else {
          this.loadIGs(this.selectedBrowseLevel, [])
        }
      })
    )
    
    /** Here, we push in all of the options for different browse levels the user has access to */
    if (this._auth.getUser() && this._auth.getUser().isLoggedIn) {
      this.browseMenuArray.push({
        label: 'Private',
        level: 'private'
      })
    }

    this.browseMenuArray.push({
      label: 'Institutional',
      level: 'institution'
    })
    
    this.browseMenuArray.push({
      label: 'Artstor Curated',
      level: 'public'
    })

    if (this._auth.getUser() && this._auth.getUser().isLoggedIn) {
      this.browseMenuArray.push({
        label: 'Shared with Me',
        level: 'shared'
      })
    }
  
    this._analytics.setPageValues('groups', '')
  } // OnInit

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe() })
  }

  /**
   * Changes menu between ADL, University Collections, Open Collections, etc...
   * @param level Level of desired menu from colMenuArray enum
   */
  selectBrowseOpt ( level: string ){
    this.loading = true;
    this.expandedCategories = {}
    this.selectedBrowseLevel = level
    this.appliedTags = []
    this.addRouteParam('view', level, true)
    this.loadIGs(this.selectedBrowseLevel, [])
  }

  /**
   * Turns the groups into a ui-usable Tag, which doesn't make logical sense but it's how it works
   * @param folderArray An array of groups returned by the services
   */
  private createGroupTags(folderArray): Tag[] {
    let childArr: Tag[] = []
    let parentTag = null

    for(let group of folderArray) {
            let groupTag = new Tag(group.id, [group.name, ' (', group.items.length, ')'].join(""), true, null, { label: "group", folder: false }, true)
            childArr.push(groupTag)
          }
    return childArr
  }
  
  /**
   * Loads Image Groups data for the current user in the array
   */
  private loadIGs(browseLevel: string, appliedTags: string[]): void{
    this.loading = true
    this._groups.getAll(browseLevel, this.pagination.pageSize, this.pagination.currentPage, appliedTags)
        .take(1).subscribe(
          (data)  => {
            this._tagFilters.setFilters(data.tags, appliedTags)
            this.tags = this.createGroupTags(data.groups)
            this.loading = false
          },
          (error) => {
            this.errorObj[browseLevel] = "Sorry, we were unable to load these Image Groups"
            this.loading = false
          }
        )
  }

    /**
   * Adds a parameter to the route and navigates to new route
   * @param key Parameter you want added to route (as matrix param)
   * @param value The value of the parameter
   */
  private addRouteParam(key: string, value: any, resetTags?: boolean) {
    let currentParamsObj: Params = Object.assign({}, this.route.snapshot.params)
    if(value){
      currentParamsObj[key] = value;
    }
    else{
      delete currentParamsObj[key];
    }

    if(currentParamsObj['tags'] && resetTags){
      delete currentParamsObj['tags']; 
    }

  }
}