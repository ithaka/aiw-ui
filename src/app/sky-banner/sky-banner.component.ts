import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'ang-sky-banner',
  templateUrl: 'sky-banner.component.pug',
  styleUrls: ['./sky-banner.component.scss']
})
export class SkyBannerComponent implements OnInit {

  @Output() dropBanner: EventEmitter<any> = new EventEmitter()

  constructor() { }

  ngOnInit() { }
}
