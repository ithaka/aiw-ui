import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'ang-ppt-modal',
  templateUrl: 'ppt-modal.component.html',
  styles: [`
    .modal {
      display: block;
    }
  `]
})
export class PptModalComponent implements OnInit {
  /** Meant only to trigger display of modal */
  @Output()
  private closeModal: EventEmitter<any> = new EventEmitter();
  @Input()
  private downloadLink: string;
  @Input()
  private title: string;

  constructor() { }

  ngOnInit() { }

  /** Executes when the user agrees to the statement */
  private agree() {

  }
}