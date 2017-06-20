import { Injectable, EventEmitter } from '@angular/core'
import { BehaviorSubject } from 'rxjs/BehaviorSubject'

/** Anything that involves managing/combining many filters should be kept here */
@Injectable()
export class TagFiltersService {

  private _filters: TagFilter[] = []
  private _updateFilters: EventEmitter<any>

  public filterKeys: BehaviorSubject<string[]> = new BehaviorSubject([])

  constructor(
    // don't put other services in here
    // data should be set from outside, and this service stores and curates it
  ) {
    this._updateFilters = new EventEmitter()
    // whenever a tag is updated, redistribute the tag filters string which is curated here
    this._updateFilters.subscribe((filter) => {
      console.log("tag event emitted", filter)
      console.log("updating filters")
      this.filterKeys.next(this.createFilterKeys())
    })
  }

  get filters() {
    return this._filters
  }

  /** 
   * Creates the tag filter string to put in the url
   * @returns string containing tag filters
   */
  private createFilterKeys(): string[] {
    let selectedArr = []
    this._filters.forEach((filter) => {
      if (filter.selected) {
        selectedArr.push(encodeURIComponent(filter.key))
      }
    })

    console.log('creating filters')

    // return the string array after the tags
    return selectedArr
    // return selectedArr.length > 0 ? selectedArr.join('&') : ""
    // return selectedArr.length > 0 ? selectedArr.join('&') : ""
  }

  public processFilterString(tags: string) : string[] {
    let tagArr = tags.split(",")
    tagArr.forEach((item, index) => {
      tagArr[index] = decodeURIComponent(item)
    })
    return tagArr
  }

  /**
   * The service responds with items that implement iTagFilter, so this builds them into TagFilter's
   */
  public setFilters(filters: iTagFilter[], appliedTags: string[]): void {
    this._filters = []

    appliedTags.forEach((tag) => {
      let placeholdFilter: iTagFilter = {
        doc_count: 20,
        key: tag
      }
      this._filters.push(new TagFilter(placeholdFilter, this._updateFilters, true))
    })

    // construct a new TagFilter for each of the items the service returns
    filters.forEach((filter) => {
      this._filters.push(new TagFilter(filter, this._updateFilters))
    })
    console.log(this._filters)
  }

  /**
   * Sets the filters back to an empty array
   */
  public clearFilters(): void {
    this._filters = []
  }
}

/**
 * The filter object as it is returned from the service
 */
interface iTagFilter {
  doc_count: number
  key: string
}

/**
 * Tag filter object constructed to manage tag state and functions
 *  anything that you want filters to DO should be kept here
 */
class TagFilter {
  private _doc_count: number
  private _key: string
  private _selected: boolean = false
  private _triggerUpdate: EventEmitter<TagFilter>

  /**
   * Regular old constructor
   * @param tag The tag object that's returned from the server
   * @param triggerUpdate A single event emitter that can be referenced from any tag to trigger an update of all selected filters
   * @param selected Optional boolean to set the tag as selected. False by default.
   */
  constructor(tag: iTagFilter, triggerUpdate: EventEmitter<any>, selected?: boolean) {
    this._doc_count = tag.doc_count
    this._key = tag.key
    this._triggerUpdate = triggerUpdate
    selected && (this._selected = selected) // here by setting _selected directly we bypass the emit in the setter
  }

  set selected(value: boolean) {
    this._selected = value
    this._triggerUpdate.emit(this)
  }

  get selected() {
    return this._selected
  }

  get key() {
    return this._key
  }

  get doc_count() {
    return this._doc_count
  }
}