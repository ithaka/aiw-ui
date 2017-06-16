import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core'

import { TagFiltersService } from './tag-filters.service'

@Component({
  selector: 'ang-tags-list',
  templateUrl: 'tags-list.component.html'
})

export class TagsListComponent implements OnInit {
  @Output() clearFilters: EventEmitter<any> = new EventEmitter()
  @Output() selectTag: EventEmitter<string> = new EventEmitter()

  @Input() tagFilters: any[] = []
  @Input() appliedTags: any[] = []

  constructor(
    private _tagFilters: TagFiltersService
  ) {
  }

  ngOnInit() {
    this._tagFilters.setFilters(this.tagFilters)
  }
}