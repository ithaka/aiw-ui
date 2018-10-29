import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'pagination',
  templateUrl: './pagination.component.pug',
  styleUrls: ['./pagination.component.scss']
})
export class PaginationComponent implements OnInit {
  private pageValueOnKeyPress: number;
  @Input() pageObj: any;
  @Input() solrFlag: boolean;
  @Input() right: boolean;

  @Output() goToPage: EventEmitter<any> = new EventEmitter();

  constructor() { }

  ngOnInit() {
    // Initialize 'pageValueOnKeyPress' with the pageObj.page
    this.pageValueOnKeyPress = this.pageObj.page;
  }

  /**
   * pageNumberKeyPress
   * on keypress of pagination input field - save page value on keypress
   * @param event
   */

  public pageNumberKeyPress(event): boolean{
    this.pageValueOnKeyPress = this.pageObj.page;
    return true;
  }

  /**
   * pageNumberKeyPress
   * on keyup of pagination input field - Make sure that the current page is greater than 0 and is not greater than total pages
   * @param event
   */
  public pageNumberKeyUp(event): boolean{
    if (this.pageObj.page){
      if ( (this.pageObj.page < 1) || (this.pageObj.page > this.pageObj.totalPages) ){
        this.pageObj.page = this.pageValueOnKeyPress;
        event.stopPropagation();
        return false;
      }
      else{
        return true;
      }
    }
  }

}
