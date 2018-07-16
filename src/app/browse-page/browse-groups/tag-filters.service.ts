import { Injectable, EventEmitter } from '@angular/core'
import { Subject } from 'rxjs/Subject'

/** Anything that involves managing/combining many filters should be kept here */
@Injectable()
export class TagFiltersService {

  private _filters: TagFilter[] = []
  private _updateFilters: EventEmitter<any>
  public showRemainTags: boolean = false

  public filterKeys: Subject<string[]> = new Subject()

  constructor(
    // don't put other services in here
    // data should be set from outside, and this service stores and curates it
  ) { 
    this._updateFilters = new EventEmitter()
    // whenever a tag is updated, redistribute the tag filters string which is curated here
    this._updateFilters.subscribe((filter) => {
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

    // return the string array after the tags
    return selectedArr
  }

  public processFilterString(tags: string[]) : string[] {
    if (!Array.isArray(tags)) {
      tags = [tags];
    }
    let tagArr = tags.map(item => decodeURIComponent(item));
    return tagArr
  }

  /**
   * The service responds with items that implement iTagFilter, so this builds them into TagFilter's
   */
  public setFilters(filters: iTagFilter[], appliedTags: string[]): void {
    let newFilters: TagFilter[] = []

    // construct a new TagFilter for each of the items the service returns
    filters.forEach((filter) => {
      let isSelected = appliedTags.indexOf(filter.key) > -1

      newFilters.push(new TagFilter(filter, this._updateFilters, isSelected))
    })
    this._filters = newFilters
  }

  /**
   * Sets the filters back to an empty array
   */
  public clearFilters(): void {
    this._filters.forEach((filter) => {
      filter.selected = false
    })
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
