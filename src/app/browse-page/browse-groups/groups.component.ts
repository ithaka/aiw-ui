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

    // this.subscriptions.push(
    //   this.route.params
    //   .subscribe((params: Params) => { 
    //     if(params && params['tags']){
    //       // this.appliedTags = params['tags'].split('|');
          
    //       this.appliedTags = JSON.parse(params['tags'].replace(/%28/g, '(').replace(/%29/g, ')'));
    //     }
    //     if(params && params['view']){
    //         this.selectedBrowseLevel = params['view'];
    //     }
    //     this.loadCategory(this.selectedBrowseLevel);
    //   })
    // )

    this._tagFilters.filterString.subscribe((tagListString) => {
      this.updateUrl(tagListString)
    })

    this.subscriptions.push(
      this.route.queryParams.subscribe((query) => {
        console.log(query)
        // MAKE ANOTHER CALL WHEN THIS HAPPENS, WITH THE REQUISITE FILTERS
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

    if (this._auth.getUser() && this._auth.getUser().isLoggedIn) {
      this.browseMenuArray.push({
        label: 'Shared with Me',
        level: 'shared'
      })
    }

    this.loadIGs('public')
  
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
    // this.loadCategory(level)
    this.loadIGs(this.selectedBrowseLevel)
  }

  private createGroupTags(folderArray) {
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
  private loadIGs(browseLevel: string): void{
    this.loading = true
    // if (!this.pageObj[browseLevel]) {
    //   this.pageObj[browseLevel] = Object.assign({}, this.pagination)
    // }
    this._groups.getAll(browseLevel, 48, 1, this.appliedTags)
        .take(1).subscribe(
          (data)  => {
            console.log(data)
            this._tagFilters.setFilters(data.tags)
            // this.tagFilters = data.tags
            // this.tagsObj[browseLevel] = data.tags
            this.foldersObj[browseLevel] = this.createGroupTags(data.groups)
            // this.pageObj[browseLevel].totalPages = Math.floor(data.total / this.pagination.pageSize) + 1
            // this.loadCategory(browseLevel)
            this.loading = false
          },
          (error) => {
            // this.foldersObj[browseLevel] = []
            this.errorObj[browseLevel] = "Sorry, we were unable to load these Image Groups"
            // this.pageObj[browseLevel].totalPages = 1
            // this.loadCategory(browseLevel)
            this.loading = false
          }
        )
  }

  // loadCategory(browseLevel: string){
  //   if (this.foldersObj[browseLevel]) {
  //     this.currentBrowseRes = this.foldersObj[browseLevel]
  //     this.tags = this.foldersObj[browseLevel]
  //     this.tagFilters = this.tagsObj[browseLevel]
  //     this.loading = false;
  //   } else {
  //     this.loadIGs(browseLevel)
  //   }
  // }

  // toggleFilterBy(tag: string) {
  //   if (this.appliedTags.indexOf(tag) > -1) {
  //     this.appliedTags.splice(this.appliedTags.indexOf(tag), 1)
  //   } else {
  //     this.appliedTags.push(tag)
  //   }

  //   // let tagsParam = '';
  //   // for(let tag of this.appliedTags){
  //   //   if(tagsParam){
  //   //     tagsParam += '|';
  //   //   }
  //   //   tagsParam += tag;
  //   // }
  //   // this.addRouteParam('tags', tagsParam);

  //   if(this.appliedTags.length > 0) {
  //     this.addRouteParam('tags', JSON.stringify(this.appliedTags).replace(/\(/g, '%28').replace(/\)/g, '%29') );
  //   }
  //   else {
  //     this.addRouteParam('tags', '');
  //   }

  //   // After applying or removing a tag/filter, show the first page results
  //   this.pageObj[this.selectedBrowseLevel].currentPage = 1;
    
  //   this.loadIGs(this.selectedBrowseLevel)
  // }

  // /**
  //  * Clear tag filters, and reload groups
  //  */
  // clearFilters() : void {
  //   this.appliedTags = [];
  //   this.addRouteParam('tags', '');
  //   this.loadIGs(this.selectedBrowseLevel);
  // }
  
  // goToPage(pageNo: number): void {
  //   this.pageObj[this.selectedBrowseLevel].currentPage = pageNo
  //   this.loadIGs(this.selectedBrowseLevel)
  // }

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

    // this._router.navigate([currentParamsObj], { relativeTo: this.route })
  }

  /** Updates the url to contain all of the selected filters */
  private updateUrl(tagList: string): void {
    let queryParams: any = {}
    if (tagList) { queryParams.tags = tagList }

    this._router.navigate(['/browse','groups'], { queryParams: queryParams })
  }
}