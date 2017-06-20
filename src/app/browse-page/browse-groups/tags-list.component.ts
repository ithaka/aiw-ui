import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core'
import { Router } from '@angular/router'
import { Subscription } from 'rxjs/Subscription'

import { TagFiltersService } from './tag-filters.service'

@Component({
  selector: 'ang-tags-list',
  templateUrl: 'tags-list.component.html'
})

export class TagsListComponent implements OnInit {
  // @Output() clearFilters: EventEmitter<any> = new EventEmitter()
  // @Output() selectTag: EventEmitter<string> = new EventEmitter()

  // @Input() tagFilters: any[] = []
  // @Input() appliedTags: any[] = []

  private subscriptions: Subscription[] = []

  constructor(
    private _tagFilters: TagFiltersService,
    private _router: Router
  ) {
  }

  ngOnInit() {
    this.subscriptions.push(
      this._tagFilters.filterKeys.subscribe((filters) => {
        if (filters && filters.length > 0) {
          this.updateUrl(filters)
        }
      })
    )
  }

  /** Updates the url to contain all of the selected filters */
  private updateUrl(tagList: string[]): void {
    let queryParams: any = {}
    if (tagList && tagList.length > 0) { queryParams.tags = tagList }

    console.log("updating url")

    this._router.navigate(['/browse','groups'], { queryParams: queryParams })
  }
}