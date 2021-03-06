import { Component, OnInit, EventEmitter } from '@angular/core'
import { Router, ActivatedRoute, Params, NavigationEnd } from '@angular/router'
import { Subscription } from 'rxjs'
import { map, take, filter } from 'rxjs/operators'
import { Angulartics2 } from 'angulartics2'
import { APP_CONST } from '../../app.constants'

// Project Dependencies
import { AuthService, GroupService, TitleService } from '_services'
import { Tag } from './../tag'
import { TagFiltersService } from './tag-filters.service'
import { AppConfig } from '../../app.service';
import { TourStep } from '../../shared/tour/tour.component'

@Component({
  selector: 'ang-browse-groups',
  templateUrl: 'groups.component.pug',
  styleUrls: ['./../browse-page.component.scss', './groups.component.scss']
})
export class BrowseGroupsComponent implements OnInit {

  // find which of the filters is selected
  public get selectedFilter(): GroupFilter {
    let filter: GroupFilter = this.groupFilterArray.find((filter) => {
      return filter.selected
    })

    if (!filter) {
      filter = this.groupFilterArray.find((filter) => {
        return filter.level == 'institution'
      })
    }
    filter.selected = true
    return filter
  }
  public tags: Tag[] = []
  public searchTerm: string = ''
  public loading: boolean = true
  public showAccessDeniedModal: boolean = false
  public isSearch: boolean = false
  public numResultMsg: string = ''

  public pagination: {
    totalPages: number,
    size: number,
    page: number
  } = {
    totalPages: 1,
    size: APP_CONST.IMAGE_GROUP_PAGE_SIZE,
    page: 1
  }

  public updateSearchTerm: EventEmitter<string> = new EventEmitter()

  public groupFilterArray: GroupFilter[] = []
  public errorObj: any = {}

  public activeSort = {
    label : 'date',
    name : 'Recently Modified'
  }

  public steps: TourStep[] = [
    {
      step: 1,
      element: ['.driver-find-cardview'],
      popover: {
        position: 'bottom',
        title: '<p>1 OF 3</p><b>Preview groups</b>',
        description: 'See more information about groups at a glance, including the creator, date, and description.',
      }
    },
    {
      step: 2,
      element: ['.driver-find-group'],
      popover: {
        position: 'right',
        title: '<p>2 OF 3</p><b>Find groups easily</b>',
        description: 'Filter the groups you want to view by type, tag, or owner. Make sure to log in to see all of the groups you\'ve created, all in one place.',
      },
      onNext: () => {
        this._ga.eventTrack.next({ properties: { event: 'endTour', category: 'groups', label: 'imageGroupTour' } })
      }
    },
    {
      step: 3,
        element: ['.driver-find-inputbox'],
        popover: {
          position: 'bottom',
          title: '<p>3 OF 3</p><b>Search by title</b>',
          description: 'Enter a term or phrase to find what group you’re looking for. Select “All” to search across all groups.',
        }
    }
  ]
  private showArtstorCurated: boolean = true
  private subscriptions: Subscription[] = []

  private userTypeId: any
  private currentBrowseRes: any = {}
  private groups: any[] = []

  private tagFilters = []
  private appliedTags: string[] = []

  constructor(
    private _appConfig: AppConfig,
    private _router: Router,
    private _groups: GroupService,
    public _tagFilters: TagFiltersService,
    private _auth: AuthService,
    private _title: TitleService,
    private _ga: Angulartics2,
    private route: ActivatedRoute
  ) {
    let isLoggedIn = this._auth.getUser() && this._auth.getUser().isLoggedIn
    this.showArtstorCurated = _appConfig.config.showArtstorCurated

    this.groupFilterArray.push({
      label: 'All',
      level: 'all',
      ariaLabel: 'Filter by All image groups'
    })

    // If Logged In, default to My Groups
    if (isLoggedIn) {
      this.groupFilterArray.push({
        label: 'My Groups',
        level: 'created',
        selected: true,
        ariaLabel: 'Filter image groups by My Groups'
      })

      this.groupFilterArray.push({
        label: 'Private',
        level: 'private',
        selected: false,
        ariaLabel: 'Filter by Private image groups'
      })

      this.groupFilterArray.push({
        label: 'Shared by Me',
        level: 'shared_by_me',
        selected: false,
        ariaLabel: 'Filter image groups by Shared by Me'
      })
    }

    // If NOT Logged In, default to Institutional
    this.groupFilterArray.push({
      label: 'Institutional',
      level: 'institution',
      selected: !isLoggedIn,
      ariaLabel: 'Filter by Institutional image groups'
    })

    if (isLoggedIn) {
      this.groupFilterArray.push({
        label: 'Shared with Me',
        level: 'shared',
        ariaLabel: 'Filter image groups by Shared with Me'
      })
    }

    if (this.showArtstorCurated) {
      this.groupFilterArray.push({
        label: 'Artstor Curated',
        level: 'public',
        ariaLabel: 'Filter by Artstor Curated image groups'
      })
    }

    // this.processUrl()
    // subscribes to url navigation and causes image group list to update based on new urls
    this.subscriptions.push(this.createNavigationSubscription())
  }

  ngOnInit() {

    if (this._auth.isPublicOnly()) {
      this.showAccessDeniedModal = true
    }

    // set the title
    this._title.setSubtitle('Browse Groups')

  } // OnInit

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe() })
  }

  public clearGrpSearch(): void {
    let queryParams = Object.assign({}, this.route.snapshot.queryParams)
    if (queryParams['term']){
      delete queryParams['term']
    }
    this.addQueryParams(queryParams, true) // Load group search results without (after clearing) search term
  }

  public changeSortOpt(label) {
    if ( this.activeSort.label != label){
      this._ga.eventTrack.next({ properties: { event: 'sortGroup', category: 'groups', label: 'cardviewSort' }});
      this.activeSort.label = label;
      this.activeSort.name = name;

      this.goToPage(1);
      this.addQueryParams({ sort: label, page: 1 })
    }
  }

  /**
   * Gets the image groups for a new page - applies all currently applied filters, just updates the page number
   * @param newPageNum The page number you wish to navigate to
   */
  public goToPage(newPageNum: number) {
    this.addQueryParams({ page: newPageNum })
  }

  /**
   * Allows direct modification of the url's query parameters and creates a navigation event
   * @param params the parameters to add to the url (if duplicate parameters already in url, this will overwrite them)
   * @param reset allows resetting of queryParams to empty object plus whatever params you pass, instead of keeping old params
   */
  public addQueryParams(params: { [key: string]: any }, reset?: boolean, searchWithTerm?: boolean, currentParams?: any) {
    let baseParams
    if (reset) {
      baseParams = {}
    } else if (currentParams) {
      baseParams = Object.assign({}, currentParams)
    } else {
      baseParams = Object.assign({}, this.route.snapshot.queryParams)
    }
    if (searchWithTerm && baseParams['id']) {
      delete baseParams['tags']
      delete baseParams['id']
    }
    let queryParams = Object.assign(baseParams, params)

    this._router.navigate(['/browse', 'groups'], { queryParams: queryParams })
  }

  /**
   * For skip to main groups (card view) section
   */
  public skipToGrpSec(): void {
    window.setTimeout(() => {
      let htmlelement: HTMLElement = document.getElementById('skip-to-filters-link');
      (<HTMLElement>htmlelement).focus()
    }, 100)
  }

  public skipToFilterSec(): void {
    window.setTimeout(() => {
      let htmlelement: HTMLElement = document.getElementById('skip-to-groups-link');
      (<HTMLElement>htmlelement).focus()
    }, 100)
  }

  public closeSortDropdown(): void {
    let dropdownElement: HTMLElement = document.querySelector('.dropdown.sortlist')
    dropdownElement.classList.remove('show')
    dropdownElement.children[0].setAttribute('aria-expanded', 'false')
    dropdownElement.children[1].classList.remove('show')
  }

  // Adding keyboard arrow keys navigation between sort button options
  public sortDropdownOptsArrowDown(element: any): void {
    let focusElementSelector = element.id === 'recentSortOpt' ? '#alphaSortOpt' : '#relSortOpt'
    let focusElement = <HTMLElement>(document.querySelector(focusElementSelector))
    if (focusElement) {
      focusElement.focus()
    }
  }

  public sortDropdownOptsArrowUp(element: any): void {
    let focusElementSelector = element.id === 'relSortOpt' ? '#alphaSortOpt' : '#recentSortOpt'
    let focusElement = <HTMLElement>(document.querySelector(focusElementSelector))
    if (focusElement) {
      focusElement.focus()
    }
  }

  /** Every time the url updates, we process the new tags and reload image groups if the tags query param changes */
  private createNavigationSubscription(): Subscription {
    return this._router.events.pipe(
    filter(event => event instanceof NavigationEnd),
    map(event => {
      let query = this.route.snapshot.queryParams
      if (!query) { console.error('no query!') }
      // let params = this.route.snapshot.params
      let groupQuery: GroupQuery = {}


      // set the term every time there is one in the url
      if (query.term) {
        this.isSearch = true
        this.searchTerm = query.term
        groupQuery.term = query.term
        this.updateSearchTerm.emit(query.term) // sets the term in the search box
      } else {
        this.isSearch = false
        this.updateSearchTerm.emit('')
      }

      // set the sort method
      if (query['sort']){
        this.activeSort.label = query['sort'];

        if (this.activeSort.label === 'date'){
          this.activeSort.name = 'Recently Modified';
        }
        else if (this.activeSort.label === 'alpha'){
          this.activeSort.name = 'Alphabetical'
        }
        else if (this.activeSort.label === 'relevance'){
          // Handle the edge case when we type nothing in the search box.
          // The sort label will still be relevance but actually we are not searching, this time we should sort from A-Z
          if (!query.term) {
            this.activeSort.label = 'alpha'
            this.activeSort.name = 'Alphabetical'
          }
          else {
            this.activeSort.name = 'Relevance'
          }
        }

        groupQuery.sort = this.activeSort.label
      }
      else{ // If no sort params - Sort from A-Z
        this.activeSort.label = 'alpha';
        this.activeSort.name = 'Alphabetical';
      }

      // set query for tags, if it exists, and reset appliedTags if it doesn't
      let urlTags: string[] = []
      if (query.tags) {
        urlTags = this._tagFilters.processFilterString(query.tags)
      }
      this.appliedTags = urlTags
      groupQuery.tags = urlTags

      if (query.page) {
        let requestedPage: number = Number(query.page)
        // if invalid page, end execution here and navigate to new url with valid page query
        if (requestedPage < 1) {
          return this.addQueryParams({ page: 1 }, false, false, query)
        }
        groupQuery.page = requestedPage
      } else {
        groupQuery.page = 1
      }

      if (query.level) {
        groupQuery.level = query.level
        if (query.level !== this.selectedFilter.level) {
          this.appliedTags = []
          this.setSearchLevel(query.level)
        }
      }

      if (!this.selectedFilter || query.level != this.selectedFilter.level) {
        this.appliedTags = [] // if they're switching levels, reset the tags
        this.setSearchLevel(query.level, false)
      }

      if (query.id) {
        groupQuery.id = query.id
      }

      this.loadIGs(groupQuery)
    })).subscribe()
  }

  /**
   * Makes sure that only one search filter can be selected (may change later if we can add multiple levels to search)
   * @param level The level param you want to search groups with
   */
  private setSearchLevel(level: string, navigate?: boolean): void {
    if (!level) { level = 'created' }
    this.groupFilterArray.forEach((filter) => {
      if (filter.level !== level) {
        filter.selected = false
      } else {
        filter.selected = true
      }
    })

    // reset appliedTags to empty array because a new level likely wont have the same tags
    this.appliedTags = []

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
    let selectedFilter = this.groupFilterArray.find((filter) => {
      return filter.selected
    })

    if (selectedFilter) {
      return selectedFilter.level
    } else {
      return 'all'
    }
  }

  /**
   * Turns the groups into a ui-usable Tag, which doesn't make logical sense but it's how it works
   * @param folderArray An array of groups returned by the services
   */
  private createGroupTags(folderArray): Tag[] {
    let childArr: Tag[] = []
    let parentTag = null
    this.groups = folderArray

    for (let group of folderArray) {
      let groupTag = new Tag(group.id, group.name, true, null, { label: 'group', folder: false }, true)
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
  // private loadIGs(appliedTags: string[], page: number, level?: string, searchTerm ?: string, searchid ?: string): void {
  private loadIGs(groupQuery: GroupQuery): void {
    // short out the function if the user has just navigated to the search page without query params
    if (!this.shouldSearch(groupQuery.tags, groupQuery.level, this.cleanGroupSearchTerm(groupQuery.term), groupQuery.id) && this.route.snapshot.params.view == 'search') {
      this.loading = false
      return
    }

    this.errorObj[this.selectedFilter.level] = ''
    this.loading = true
    let browseLevel: string

    // if level is not provided explicitly, here is some logic for determining what it should be - search takes priority, then browse level, default to 'public'
    if (groupQuery.level === 'search') {
      browseLevel = this.getSearchLevel()
    } else if (!groupQuery.level) {
      browseLevel = this.getSearchLevel() || this.selectedFilter.level || 'public'
    } else {
      browseLevel = groupQuery.level
    }

    this._groups.getAll(
      browseLevel,
      this.pagination.size,
      groupQuery.page,
      groupQuery.tags,

      this.cleanGroupSearchTerm(groupQuery.term),
      groupQuery.id,
      groupQuery.sort
    ).pipe(
    take(1),
      map(data  => {
        // Set the group level to show in the number of result message
        let groupLabel: string = ''
        switch (browseLevel) {
          case 'all': {
            groupLabel = 'All Groups'
            break
          }
          case 'created': {
            groupLabel = 'My Groups'
            break
          }
          case 'private': {
            groupLabel = 'Private Groups'
            break
          }
          case 'shared_by_me': {
            groupLabel = 'Shared by Me Groups'
            break
          }
          case 'institution': {
            groupLabel = 'Institutional Groups'
            break
          }
          case 'shared': {
            groupLabel = 'Shared with Me Groups'
            break
          }
          case 'public': {
            groupLabel = 'Artstor Curated Groups'
            break
          }
          default: {
              break
          }
        }

        // Set the number of result message
        if (data.total !== 0){
            this.numResultMsg = data.total + ' results for \"' + this.searchTerm + '\"' + ' from <i>' + groupLabel + '</i>.'
        } else {
          this.numResultMsg = '0 results for \"' + this.searchTerm + '\"' + ' from <i>' + groupLabel + '</i>. Try checking your spelling, or browse our <a href=\'/#/browse/groups?level=public\' class=\'link\'><b>curated groups</b></a>.'
          this.goToPage(1)
        }

        this.pagination.page = groupQuery.page

        this.pagination.totalPages = Math.ceil(data.total / this.pagination.size) // update pagination, which is injected into pagination component
        if (this.pagination.totalPages === 0) // The pagination should at least have one page even if there is no results, so that we don't show '1 of 0' on the pagination
          this.pagination.totalPages = 1

        if (this.pagination.page > this.pagination.totalPages && data.total > 0) {
          return this.goToPage(this.pagination.totalPages) // go to the last results page if they try to navigate to a page that is more than results
        }
        this._tagFilters.setFilters(data.tags, groupQuery.tags) // give the tag service the new data
        this.tags = this.createGroupTags(data.groups) // save the image groups for display
        this.loading = false

          // show them the search error
          if (data.total === 0 && this.route.snapshot.params.view === 'search') {
            this.errorObj['search'] = 'No search results found'
          }
        },
        (error) => {
          console.error(error)
          this._tagFilters.setFilters([], groupQuery.tags)
          this.tags = []
          this.errorObj[browseLevel] = 'Sorry, we were unable to load these Image Groups'
          this.loading = false
        }
      )).subscribe()
  }

  /**
   * shouldSearch is where any logic is packaged that determines whether or not to search image groups. Right now,
   *  the only reason not to search is if the user is on the 'vanilla' search route (they have no tags or levels specified).
   *  If they get straight to the search page, we don't want to fill it with groups before they've searched anything.
   * @returns boolean indicating whether or not the search for image groups should continue
   */
  private shouldSearch(appliedTags: string[], level: string, term: string, id: string): boolean {
    // this first part determines whether or not the search should execute
    let search = false
    if (appliedTags && appliedTags.length > 0) {
      search = true
    }
    if (level && level !== 'search') {
      search = true
    }
    if (term || id) {
      search = true
    }

    // this second part resets the tags and groups if no search is taking place
    if (!search) {
      this._tagFilters.setFilters([], [])
      this.tags = []
    }

    return search
  }

  /**
   * @param term string
   * For group search, 'term' is url encoded, and backslash '\' is a valid char,
   * but we need to replace '/' %2F chars, as they're not handled by the group service,
   * and will return a 500 error.
   * @returns cleaned and URI encoded string value for the search term
   */

  private cleanGroupSearchTerm(term: string): string {
    if (term) {
      term = term.replace(/\//g, '\\');
      return encodeURIComponent(term)
    } else {
      return ''
    }
  }


}

interface GroupFilter {
  label: string
  level: string
  selected?: boolean
  ariaLabel?: string
}

export interface GroupQuery {
  page?: number
  level?: string
  sort?: string
  tags?: string[]
  term?: string
  id?: string // rn i'm not sure what id this is, so I'm leaving the name, but would like to change to more specific like groupId or something
}
