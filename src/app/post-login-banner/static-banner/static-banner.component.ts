import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'ang-static-banner',
  templateUrl: 'static-banner.component.pug',
  styleUrls: ['./static-banner.component.scss']
})
export class staticBannerComponent implements OnInit {

  @Output() dropBanner: EventEmitter<any> = new EventEmitter()

  @Input() bannerButtonText: string = ""

  constructor() { }

  ngOnInit() { }
}
