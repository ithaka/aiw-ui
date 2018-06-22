import { Component, OnInit, EventEmitter } from '@angular/core'
import { Router, ActivatedRoute, Params, NavigationEnd } from '@angular/router'
import { Subscription }   from 'rxjs/Subscription'

import { AssetService, AuthService, GroupService } from './../../shared'
import { AnalyticsService } from './../../analytics.service'
import { Tag } from './../tag'
import { TagFiltersService } from './tag-filters.service'
import { TitleService } from '../../shared/title.service'
import { AppConfig } from '../../app.service';

@Component({
  selector: 'ang-browse-groups',
  templateUrl: 'groups.component.pug',
  styleUrls: [ './../browse-page.component.scss' ]
})
export class BrowseGroupsComponent implements OnInit {
  private showArtstorCurated: boolean = true
  private subscriptions: Subscription[] = []

  private userTypeId: any
  private currentBrowseRes: any = {}
  private tags: Tag[] = []
  private groups: any[] = []
  private loading: boolean = true

  private pagination: {
    totalPages: number,
    size: number,
    page: number
  } = {
    totalPages: 1,
    size: 48,
    page: 1
  }

  private updateSearchTerm: EventEmitter<string> = new EventEmitter()

  private tagFilters = []
  private appliedTags: string[] = []

  private selectedBrowseLevel: string
  private browseMenuArray: { label: string, level: string, selected ?: boolean }[] = []
  private showSearchPrompt: boolean = false
  private errorObj: any = {}
  // Var for setting aside Groups "getAll" requests so they can be unsubscribed
  private groupsGetAllSub: Subscription

  constructor(
    private _router: Router,
    private _assets: AssetService,
    private _groups: GroupService,
    private _tagFilters: TagFiltersService,
    private _auth: AuthService,
    private _analytics: AnalyticsService,
    private _title: TitleService,
    private route: ActivatedRoute,
    private _appConfig: AppConfig
  ) {
    this.showArtstorCurated = _appConfig.config.showArtstorCurated

    if (this.showArtstorCurated) {
      this.selectedBrowseLevel = 'public'
    } else {
      this.selectedBrowseLevel = 'institution'
    }

    this.processUrl();
  }

  ngOnInit() {
    // set the title
    this._title.setSubtitle("Browse Groups")

    // this is only for the search page and won't show in the top-level menu
    this.browseMenuArray.push({
      label: 'All',
      level: 'all'
    })

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

    if (this.showArtstorCurated) {
      this.browseMenuArray.push({
        label: 'Artstor Curated',
        level: 'public'
      })
      this.browseMenuArray.push({
        label: 'Search',
        level: 'search'
      })
    }

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

  /** Every time the url updates, we process the new tags and reload image groups if the tags query param changes */
  private processUrl() {
    this.subscriptions.push(
      this._router.events.filter(event=>event instanceof NavigationEnd)
      .subscribe(event => {
        let query = this.route.snapshot.queryParams;
        let params = this.route.snapshot.params;

        if (!this.showArtstorCurated && params.view == 'public') {
          this._router.navigate(['browse','groups','institution'])
          return
        }

        if (params.view !== (this.selectedBrowseLevel)) {
          this.appliedTags = []
          this.selectedBrowseLevel = params.view
        }

        let tagAdded: boolean = false
        // this is only expected to run when searching
        if (query.tags) {
          let newTags: string[] = this._tagFilters.processFilterString(query.tags)
          tagAdded = this.appliedTags.join('') != newTags.join('') // if the two strings aren't equal, a tag must have changed
          this.appliedTags = newTags
        } else {
          this.appliedTags = []
        }

        let requestedPage = Number(query.page) || 1
        if (requestedPage < 1 || tagAdded) {
          this.addQueryParams({page: 1}, false, query)
        } // STOP THEM if they're trying to enter a negative number
        // if (tagAdded) { requestedPage = 1 } // if they're adding a tag, we want to nav them back to page 1
        let requestedLevel = this.selectedBrowseLevel !== 'search' ? this.selectedBrowseLevel : query.level;
        this.setSearchLevel(requestedLevel, false) // makes sure that the correct level filter is selected even if the user just navigated here from the url

        let requestedTerm = this.selectedBrowseLevel !== 'search' ? '' : query.term;
        // if there is not a term, make sure the search term is cleared
        if (!query.term) {
          this.updateSearchTerm.emit('')
        } else {
          this.updateSearchTerm.emit(query.term)
        }

        this.loadIGs(this.appliedTags, requestedPage, requestedLevel, requestedTerm)
      })
    )
  }

  /**
   * Makes sure that only one search filter can be selected (may change later if we can add multiple levels to search)
   * @param level The level param you want to search groups with
   */
  private setSearchLevel(level: string, navigate?: boolean): void {
    this.browseMenuArray.forEach((filter) => {
      if (filter.level !== level) {
        filter.selected = false
      } else {
        filter.selected = true
      }
    })

    /**
     * Sometimes setSearchLevel is just used to control which one of the filters is active, such as when the user
     *  first loads a page. If it's ?level=public, then we need to make that filter active, but do not need to navigate.
     *  Sometimes we want to navigate though, like if they click a new filter. And finally, level=none is used by the
     *  'Clear' button in order to reset your search.
     */
    if (level && navigate) {
      this.addQueryParams(level === 'none' ? {} : { level: level }, true)
    }
  }

  /**
   * Getter for the selected search level
   * @returns The currently selected search level, defaulted to 'all
   */
  private getSearchLevel(): string {
    // return undefined if search isn't even selected
    if (this.route.snapshot.params.view !== 'search') {
      return
    }

    let selectedLevel: string
    this.browseMenuArray.forEach((filter) => {
      if (filter.selected) {
        selectedLevel = filter.level
      }
    })
    return selectedLevel || 'all' // default to 'all'
  }

  /**
   * Turns the groups into a ui-usable Tag, which doesn't make logical sense but it's how it works
   * @param folderArray An array of groups returned by the services
   */
  private createGroupTags(folderArray): Tag[] {
    let childArr: Tag[] = []
    let parentTag = null
    this.groups = folderArray

    for(let group of folderArray) {
            let groupTag = new Tag(group.id, group.name, true, null, { label: "group", folder: false }, true)
            childArr.push(groupTag)
          }
    return childArr
  }

  /**
   * Loads Image Groups data for the current user in the array
   * @param appliedTags The array of tags which the user has selected to filter by
   * @param page The desired page number to navigate to
   * @param level The query param for the groups call that indicates what share permissions the user has
   */
  private loadIGs(appliedTags: string[], page: number, level?: string, searchTerm ?: string): void {
    // short out the function if the user has just navigated to the search page without query params
    if (!this.shouldSearch(appliedTags, level, searchTerm) && this.route.snapshot.params.view == 'search') {
      this.loading = false
      return
    }

    this.errorObj[this.selectedBrowseLevel] = ''
    this.loading = true
    let browseLevel: string

    // if level is not provided explicitly, here is some logic for determining what it should be - search takes priority, then browse level, default to 'public'
    if (level === 'search') {
      browseLevel = this.getSearchLevel()
    } else if (!level) {
      browseLevel = this.getSearchLevel() || this.selectedBrowseLevel || 'public'
    } else {
      browseLevel = level
    }

    // Some Groups calls take a while, please stop listening to an old request if a new one is made
    this.groupsGetAllSub && this.groupsGetAllSub.unsubscribe()

    this.groupsGetAllSub = this._groups.getAll(browseLevel, this.pagination.size, page, appliedTags, searchTerm)
        .take(1).subscribe(
          (data)  => {
            this.pagination.page = page
            this.pagination.totalPages = Math.ceil(data.total/this.pagination.size) // update pagination, which is injected into pagination component
            if (this.pagination.page > this.pagination.totalPages && data.total > 0) {
              return this.goToPage(this.pagination.totalPages) // go to the last results page if they try to navigate to a page that is more than results
            }
            this._tagFilters.setFilters(data.tags, appliedTags) // give the tag service the new data
            this.tags = this.createGroupTags(data.groups) // save the image groups for display
            this.loading = false

            // show them the search error
            if (data.total === 0 && this.route.snapshot.params.view === 'search') {
              this.errorObj['search'] = 'No search results found'
            }
          },
          (error) => {
            this._tagFilters.setFilters([], appliedTags)
            this.tags = []
            this.errorObj[browseLevel] = "Sorry, we were unable to load these Image Groups"
            this.loading = false
          }
        )
  }

  /**
   * Gets the image groups for a new page - applies all currently applied filters, just updates the page number
   * @param newPageNum The page number you wish to navigate to
   */
  private goToPage(newPageNum: number) {
    this.addQueryParams({ page: newPageNum })
  }

  /**
   * shouldSearch is where any logic is packaged that determines whether or not to search image groups. Right now,
   *  the only reason not to search is if the user is on the 'vanilla' search route (they have no tags or levels specified).
   *  If they get straight to the search page, we don't want to fill it with groups before they've searched anything.
   * @returns boolean indicating whether or not the search for image groups should continue
   */
  private shouldSearch(appliedTags: string[], level: string, term: string): boolean {
    // this first part determines whether or not the search should execute
    let search = false
    if (appliedTags && appliedTags.length > 0) {
      search = true
    }
    if (level && level !== 'search') {
      search = true
    }
    if (term) {
      search = true
    }

    // this second part resets the tags and groups if no search is taking place
    if (!search) {
      this._tagFilters.setFilters([], [])
      this.tags = []
      this.pagination.page = 1
      this.pagination.totalPages = 1
      this.showSearchPrompt = true
    } else {
      this.showSearchPrompt = false
    }

    return search
  }

  /**
   * Allows direct modification of the url's query parameters and creates a navigation event
   * @param params the parameters to add to the url (if duplicate parameters already in url, this will overwrite them)
   * @param reset allows resetting of queryParams to empty object plus whatever params you pass, instead of keeping old params
   */
  private addQueryParams(params: { [key: string]: any }, reset?: boolean, currentParams?: any) {
    let baseParams
    if (reset) {
      baseParams = {}
    } else if (currentParams) {
      baseParams = Object.assign({}, currentParams)
    } else {
      baseParams = Object.assign({}, this.route.snapshot.queryParams)
    }
    let queryParams = Object.assign(baseParams, params)

    this._router.navigate(['/browse','groups', this.selectedBrowseLevel], { queryParams: queryParams })
  }
}
