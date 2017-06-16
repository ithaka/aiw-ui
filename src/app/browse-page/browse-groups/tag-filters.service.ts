import { Injectable } from '@angular/core'

import { GroupService } from './../../shared'

/** Anything that involves managing/combining many filters should be kept here */
@Injectable()
export class TagFiltersService {

  private _filters: TagFilter[] = []

  constructor(
    private _groups: GroupService
  ) { }

  get filters() {
    return this._filters
  }

  /**
   * The service responds with items that implement iTagFilter, so this builds them into TagFilter's
   */
  public setFilters(filters: iTagFilter[]): void {
    this._filters = []

    // construct a new TagFilter for each of the items the service returns
    filters.forEach((filter) => {
      this._filters.push(new TagFilter(filter))
    })
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

  constructor(tag: iTagFilter, selected?: boolean) {
    this._doc_count = tag.doc_count
    this._key = tag.key
    selected && (this.selected = selected)
  }

  set selected(value: boolean) {
    this._selected = value
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