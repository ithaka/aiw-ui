import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core'

@Component({
  selector: 'ang-toast',
  templateUrl: 'toast.component.pug',
  styleUrls: [ './toast.component.scss' ]
})
export class ToastComponent implements OnInit, OnDestroy {
  
  @Input() public type: string = ''
  @Input() public stringHTML: string = ''
  @Output() public closeToast: EventEmitter<any> = new EventEmitter()

  constructor() {}

  ngOnInit() {
    
  }

  ngOnDestroy() {
  }
}
