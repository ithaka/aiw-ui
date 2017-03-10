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

}