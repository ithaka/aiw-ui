import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Subscription }   from 'rxjs/Subscription';

import { AssetService, AuthService, GroupService } from './../shared';
import { Tag } from './tag/tag.class';
// import { AuthService } from './../shared/auth.service';

@Component({
  selector: 'ang-browse-groups',
  templateUrl: 'groups.component.html',
  styleUrls: [ './browse-page.component.scss' ]
})
export class BrowseGroupsComponent implements OnInit {
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private _assets: AssetService,
    private _groups: GroupService,
    private _auth: AuthService
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

    this.subscriptions.push(
      this.route.params
      .subscribe((params: Params) => { 
        if(params && params['view']){
            this.selectedBrowseLevel = params['view']
            this.loadCategory(this.selectedBrowseLevel)
        }
      })
    )
    
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

    this.browseMenuArray.push({
      label: 'Shared with Me',
      level: 'shared'
    })

    this.loadCategory(this.selectedBrowseLevel)
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe() })
  }

  /**
   * Changes menu between ADL, University Collections, Open Collections, etc...
   * @param level Level of desired menu from colMenuArray enum
   */
  selectBrowseOpt ( level: string ){
    this.expandedCategories = {}
    this.selectedBrowseLevel = level
    this.addRouteParam('view', level)
    this.loadCategory(level)
  }

  private createGroupTags(folderArray) {
    let childArr: Tag[] = []
    let parentTag = null

    for(let group of folderArray) {
            let groupTag = new Tag(group.id, group.name, true, null, { label: "group", folder: false }, true)
            childArr.push(groupTag)
          }
    return childArr
  }
  
  /**
   * Loads Image Groups data for the current user in the array
   */
  private loadIGs(browseLevel: string): void{
    this.loading = true
    if (!this.pageObj[browseLevel]) {
      this.pageObj[browseLevel] = Object.assign({}, this.pagination)
    }
    this._groups.getAll(browseLevel, this.pageObj[browseLevel].pageSize, this.pageObj[browseLevel].currentPage, this.appliedTags)
        .take(1).subscribe(
          (data)  => {
            this.tagFilters = data.tags
            this.tagsObj[browseLevel] = data.tags
            this.foldersObj[browseLevel] = this.createGroupTags(data.groups)
            this.pageObj[browseLevel].totalPages = Math.floor(data.total / this.pagination.pageSize) + 1
            this.loadCategory(browseLevel)
            this.loading = false
          },
          (error) => {
            this.foldersObj[browseLevel] = []
            this.errorObj[browseLevel] = "Sorry, we were unable to load these Image Groups"
            this.pageObj[browseLevel].totalPages = 1
            this.loadCategory(browseLevel)
            this.loading = false
          }
        )
  }

  loadCategory(browseLevel: string){
    if (this.foldersObj[browseLevel]) {
      this.currentBrowseRes = this.foldersObj[browseLevel]
      this.tags = this.foldersObj[browseLevel]
      this.tagFilters = this.tagsObj[browseLevel]
    } else {
      this.loadIGs(browseLevel)
    }
  }

  toggleFilterBy(tag: string) {
    if (this.appliedTags.indexOf(tag) > -1) {
      this.appliedTags.splice(this.appliedTags.indexOf(tag))
    } else {
      this.appliedTags.push(tag)
    }
    this.loadIGs(this.selectedBrowseLevel)
  }

  /**
   * Clear tag filters, and reload groups
   */
  clearFilters() : void {
    this.appliedTags = []
    this.loadIGs(this.selectedBrowseLevel)
  }
  
  goToPage(pageNo: number): void {
    this.pageObj[this.selectedBrowseLevel].currentPage = pageNo
    this.loadIGs(this.selectedBrowseLevel)
  }

    /**
   * Adds a parameter to the route and navigates to new route
   * @param key Parameter you want added to route (as matrix param)
   * @param value The value of the parameter
   */
  private addRouteParam(key: string, value: any) {
    let currentParamsObj: Params = Object.assign({}, this.route.snapshot.params)
    currentParamsObj[key] = value

    this.router.navigate([currentParamsObj], { relativeTo: this.route })
  }
}