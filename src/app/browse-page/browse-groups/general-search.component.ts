import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Subscription } from 'rxjs/Subscription'

@Component({
  selector: 'ang-general-search',
  templateUrl: 'general-search.component.html'
})

export class GeneralSearchComponent implements OnInit {
  @Output() executeSearch: EventEmitter<string> = new EventEmitter()
  @Input() updateSearchTerm: EventEmitter<string> = new EventEmitter() // allows an outside component to set the search term

  private subscriptions: Subscription[] = []

  // the term that will be searched for
  private term: string = ''

  constructor() { }

  ngOnInit() {
    if (this.updateSearchTerm) {
      this.subscriptions.push(
        this.updateSearchTerm.subscribe((term) => {
          this.term = term
        })
      )
    }
  }

}