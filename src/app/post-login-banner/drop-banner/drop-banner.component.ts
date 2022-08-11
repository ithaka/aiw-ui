import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import {animate, style, transition, trigger} from "@angular/animations";

@Component({
  selector: 'ang-drop-banner',
  templateUrl: 'drop-banner.component.pug',
  styleUrls: ['./drop-banner.component.scss'],
  animations: [
    trigger("trayAnimation", [
      transition(":enter", [
        style({opacity: 0, transform: "translateY(-10%)"}), //apply default styles before animation starts
        animate(
          "750ms ease-in-out",
          style({opacity: 1, transform: "translateY(0%)"})
        )
      ]),
      transition(":leave", [
        style({opacity: 0, transform: "translateY(0%)"}), //apply default styles before animation starts
        animate(
          "750ms ease-in-out",
          style({opacity: 1, transform: "translateY(-10%)"})
        )
      ])
    ])
  ]
})

export class dropBannerComponent implements OnInit {

  constructor() { }

  ngOnInit() { }

  public bannerCopyGroup(): void {
    window.open("https://www.jstor.org/copygroups", '_blank')
    // insert copy group event => event.banner-copy-groups-link
  }
  public readMore(): void {
    window.open("https://www.jstor.org/artstor", '_blank')
    // fire try now event => event.banner-welcome-mat-link
  }

  public searchNow(): void {
    window.open("https://www.jstor.org/images", '_blank')
    // search event here => event.banner-search-btn
  }
}
