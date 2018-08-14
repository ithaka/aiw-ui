import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core'
import { Router, ActivatedRoute } from '@angular/router'
import { Subscription } from 'rxjs/Subscription'

import { TagFiltersService } from './tag-filters.service'

@Component({
  selector: 'ang-tags-list',
  templateUrl: 'tags-list.component.pug'
})

export class TagsListComponent implements OnInit {
  private subscriptions: Subscription[] = []

  constructor(
    private _tagFilters: TagFiltersService,
    private _router: Router,
    private route: ActivatedRoute
  ) {
  }

  ngOnInit() {
    this.subscriptions.push(
      this._tagFilters.filterKeys.subscribe((filters) => {
        this.updateUrl(filters)
      })
    )
  }

  /** Updates the url to contain all of the selected filters */
  private updateUrl(tagList: string[]): void {
    let queryParams: any = Object.assign({}, this.route.snapshot.queryParams)

    // Set page number to 1 to make sure applying and clearing tags from pages >= 2 should land the user on page 1 to show results
    queryParams.page = '1'

    if (tagList && tagList.length > 0) {
      queryParams.tags = tagList
    } else if (queryParams.tags) {
      delete queryParams['tags']
    }

    this._router.navigate(['/browse', 'groups'], { queryParams: queryParams })
  }
}
