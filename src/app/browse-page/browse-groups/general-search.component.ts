import { Component, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'ang-general-search',
  templateUrl: 'general-search.component.html'
})

export class GeneralSearchComponent implements OnInit {
  @Output() executeSearch: EventEmitter<string> = new EventEmitter()

  // the term that will be searched for
  private term: string = ''

  constructor() { }

  ngOnInit() { }

}