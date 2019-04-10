import { Component, Input, Output, OnInit, EventEmitter } from '@angular/core'

@Component({
  selector: 'ang-promo-tooltip',
  templateUrl: 'promo-tooltip.component.pug',
  styleUrls: ['./promo-tooltip.component.scss']
})
export class PromoTooltipComponent implements OnInit {
    
  @Input() options: any
  @Output() close: EventEmitter<any> = new EventEmitter();

  constructor(
  ){ }

  ngOnInit() {  
  }

}