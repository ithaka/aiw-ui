import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import {animate, style, transition, trigger} from "@angular/animations";
import {Angulartics2} from "angulartics2";

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

  constructor(private _angulartics: Angulartics2) {}

  ngOnInit() { }

  public bannerCopyGroup(): void {
    window.open("https://www.jstor.org/copygroups", '_blank')
    //{ event: 'aji modal banner', category: 'onboarding', label: "post-login-banner-shown"}
    this._angulartics.eventTrack.next({ properties: { event: 'aji modal banner', category: 'onboarding', label: "drop-banner-copy-groups-link"} });
  }
  public readMore(): void {
    window.open("https://www.jstor.org/artstor", '_blank')
    this._angulartics.eventTrack.next({ properties: { event: 'aji modal banner', category: 'onboarding', label: "drop-banner-welcome-mat-link"} });
  }

  public searchNow(): void {
    window.open("https://www.jstor.org/images", '_blank')
    this._angulartics.eventTrack.next({ properties: { event: 'aji modal banner', category: 'onboarding', label: "drop-banner-search-btn"} });

  }
}
