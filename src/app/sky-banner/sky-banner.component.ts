import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'ang-sky-banner',
  templateUrl: 'sky-banner.component.pug',
  styleUrls: ['./sky-banner.component.scss']
})
export class SkyBannerComponent implements OnInit {

  @Output() closeBanner: EventEmitter<any> = new EventEmitter()

  // I just put a bland initial value in, but this should be overwritten by the input
  @Input() textValue: string = "Welcome to Artstor. We're glad you're here."

  constructor() { }

  ngOnInit() { }
}
