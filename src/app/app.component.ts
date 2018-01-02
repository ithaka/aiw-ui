/*
 * Angular 2 decorators and services
 */
import { Component, ViewEncapsulation } from '@angular/core';
import { Angulartics2GoogleAnalytics } from 'angulartics2/ga';
import { Title } from '@angular/platform-browser';
import { Router, NavigationStart } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import { AppConfig } from "./app.service";
/*
 * App Component
 * Top Level Component
 */
@Component({
  selector: 'app',
  encapsulation: ViewEncapsulation.None,
  styleUrls: [
    '../sass/app.scss'
  ],
  template: `
    <ang-sky-banner *ngIf="showSkyBanner" [textValue]="'MEDIA_ISSUES_BANNER.MESSAGE' | translate" (closeBanner)="showSkyBanner = false"></ang-sky-banner>
    <a (click)="findMainContent()" (keydown.enter)="findMainContent()" tabindex="1" class="sr-only sr-only-focusable">Skip to main content</a>
    <nav-bar></nav-bar>

    <main tabindex="-1">
      <router-outlet></router-outlet>
    </main>

    <footer>
    </footer>

  `
})
export class App {
  url = 'https://artstor.org/'
  title = 'Artstor'

  private showSkyBanner: boolean = false

  constructor(
    public _app: AppConfig,
    angulartics2GoogleAnalytics: Angulartics2GoogleAnalytics,
    private titleService: Title,
    private router:Router,
    private translate: TranslateService
  ) {
    // I'm hoping this sets these for the entire app
    // this language will be used as a fallback when a translation isn't found in the current language
    translate.setDefaultLang('en');
      // the lang to use, if the lang isn't available, it will use the current loader to get them
    translate.use('en');

    this.title = this._app.config.pageTitle

    // Set metatitle to "Artstor" except for asset page where metatitle is {{ Asset Title }}
    router.events.subscribe(event => {
      if(event instanceof NavigationStart) {
        let event_url_array = event.url.split('/');
        if(event_url_array && (event_url_array.length > 1) && (event_url_array[1] !== 'asset')){
          this.titleService.setTitle(this.title);
        }
      }
    });
  }

  ngOnInit() {
    // Turn on the Search Announcement Banner once the featured flag is removed!
    // if ( document.location.hostname.indexOf('beta.artstor.org') > -1 || document.location.hostname.indexOf('prod.cirrostratus.org') > -1 || document.location.hostname.indexOf('lively.artstor.org') > -1 ) {
    //   this.showSkyBanner = true
    // }

  }

  private findMainContent(): void {
    document.getElementById("mainContent").focus()
  }
}
