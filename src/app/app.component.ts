/*
 * Angular 2 decorators and services
 */
import { Component, ViewEncapsulation } from '@angular/core';
import { Angulartics2GoogleAnalytics } from 'angulartics2';
import { Title } from '@angular/platform-browser';
import { Router, NavigationStart } from '@angular/router';
import { TranslateService } from 'ng2-translate';

import { AppState } from './app.service';

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
    <a (click)="findMainContent()" (keydown.enter)="findMainContent()" tabindex="0" class="sr-only sr-only-focusable">Skip to main content</a>
    <ang-sky-banner *ngIf="showSkyBanner" [textValue]="'BETA_SKY_BANNER.MESSAGE' | translate" (closeBanner)="showSkyBanner = false"></ang-sky-banner>
    <nav-bar></nav-bar>

    <main id="mainContent" tabindex="-1">
      <router-outlet></router-outlet>
    </main>

    <footer>
    </footer>
  `
})
export class App {
  angularclassLogo = 'assets/img/angularclass-avatar.png';
  name = 'Artstor';
  url = 'https://artstor.org/';

  private showSkyBanner: boolean = true

  constructor(
    public appState: AppState,
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
    
    // Set metatitle to "Artstor" except for asset page where metatitle is {{ Asset Title }}
    router.events.subscribe(event => {
      if(event instanceof NavigationStart) {
        let event_url_array = event.url.split('/');
        if(event_url_array && (event_url_array.length > 1) && (event_url_array[1] !== 'asset')){
          this.titleService.setTitle('Artstor');
        }
      }
    });
  }

  ngOnInit() {
    // until told differently, I'll just leave this up for always
    // if ( document.location.hostname.indexOf('beta.artstor.org') > -1 || document.location.hostname.indexOf('prod.cirrostratus.org') > -1 || document.location.hostname.indexOf('lively.artstor.org') > -1 ) {
    //   this.showSkyBanner = true
    // }
  }

  private findMainContent(): void {
    document.getElementById("mainContent").focus()
  }

}