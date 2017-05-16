import { Component, Input, OnInit, Output } from '@angular/core';
import { EventEmitter } from '@angular/common/src/facade/async';

@Component({
  selector: 'pagination',
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.scss']
})
export class PaginationComponent implements OnInit {
  @Input() pageObj: any;

  @Output() goToPage: EventEmitter<any> = new EventEmitter();

  constructor() { }

  ngOnInit() {

  }

  /**
   * pageNumberKeyPress
   * on keypress of pagination input field - makes sure the user can't enter page number less than 1 or great than the total pages
   * @param event 
   */

  private pageNumberKeyPress(event): boolean{
    let currentPageNumber = this.pageObj.currentPage ? this.pageObj.currentPage : '';
    let nextPagenumber = parseInt(currentPageNumber.toString() + event.key);

    if((nextPagenumber < 1) || (nextPagenumber > this.pageObj.totalPages)){
      event.stopPropagation();
      return false;
    }
    else{
      return true;
    }
  }

}