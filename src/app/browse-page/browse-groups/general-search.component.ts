import { Component, OnInit, Input, Output, EventEmitter, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs'
import { map } from 'rxjs/operators'

// Project Dependencies
import { DomUtilityService } from '_services'

@Component({
  selector: 'ang-general-search',
  templateUrl: 'general-search.component.pug'
})

export class GeneralSearchComponent implements OnInit {
  @Output() executeSearch: EventEmitter<string> = new EventEmitter()
  @Input() updateSearchTerm: EventEmitter<string> = new EventEmitter() // allows an outside component to set the search term
  @Input() init: string = ''

  @Input() loadingGrps: boolean
  @Output() clearGrpSearch: EventEmitter<string> = new EventEmitter() // Invoke clear group search method in parent component

  @ViewChild("empty-search-alert", {read: ElementRef}) emptySearchAlert: ElementRef;

  // the term that will be searched for
  public term: string = ''
  public startSearch: boolean = false

  private subscriptions: Subscription[] = []

  constructor(
    private _router: Router,
    private _dom: DomUtilityService
  ) { }

  ngOnInit() {
    if (this.init)
      this.term = this.init
    if (this.updateSearchTerm) {
      this.subscriptions.push(
        this.updateSearchTerm.pipe(
          map(term => {
          this.term = term
        })).subscribe()
      )
    }

    // Remove error message when route changes
    this.subscriptions.push(
      this._router.events.pipe(
        map(event => {
          this.startSearch = false;
        }
      )).subscribe()
    )
  }

  public setFocus(): void {
    setTimeout(function () {
      if (this.emptySearchAlert && this.emptySearchAlert.nativeElement){
        this.emptySearchAlert.nativeElement.focus()
      }
    }, 110);
  }

  public conductSearch(): void {
    this.startSearch = true;
    // Only add route params when the search term is not empty
    // This is to ensure that the error message doesn't get removed...
    // ...by the above subscription when we update route param for empty search term
    if (this.term) {
      this.executeSearch.emit(this.term);
    }
    this.setFocus();
  }
}
