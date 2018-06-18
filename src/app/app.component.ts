/*
 * Angular 2 decorators and services
 */
import { Component, ViewEncapsulation } from '@angular/core';
import { Angulartics2GoogleAnalytics } from 'angulartics2/ga';
import { Title } from '@angular/platform-browser';
import { Router, NavigationStart, NavigationEnd } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import { AppConfig } from "./app.service";
import { ScriptService } from './shared';
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
    <ang-sky-banner *ngIf="showSkyBanner" [textValue]="'DOWNTIME_BANNER.MESSAGE' | translate" (closeBanner)="showSkyBanner = false"></ang-sky-banner>
    <div id="skip" tabindex="-1" aria-activedescendant="button">
      <button id="button" (click)="findMainContent()" (keydown.enter)="findMainContent()" tabindex="1" class="sr-only sr-only-focusable"> Skip to main content </button>
    </div>
    <nav-bar tabindex="-1"></nav-bar>

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
    private _script: ScriptService,
    private router:Router,
    private translate: TranslateService
  ) {
    // append query param to dodge caching
    let langStr = 'en.json?no-cache=' + new Date().valueOf()
    // I'm hoping this sets these for the entire app
    // this language will be used as a fallback when a translation isn't found in the current language
    translate.setDefaultLang(langStr);
    // the lang to use, if the lang isn't available, it will use the current loader to get them
    translate.use(langStr);

    this.title = this._app.config.pageTitle

    // Set metatitle to "Artstor" except for asset page where metatitle is {{ Asset Title }}
    router.events.subscribe(event => {
      if(event instanceof NavigationStart) {
        // focus on the wrapper of the "skip to main content link" everytime new page is loaded
        let mainEl = <HTMLElement>(document.getElementById("skip"))
        mainEl.focus()
        // For the filter to work on browse/library page, focus on the input to make user can type in search term continuously
        if (document.getElementById("browsePageFilter"))
          document.getElementById("browsePageFilter").focus()
        
        let event_url_array = event.url.split('/')
        if(event_url_array && (event_url_array.length > 1) && (event_url_array[1] !== 'asset')){
          this.titleService.setTitle(this.title)
        }
      }
      else if(event instanceof NavigationEnd) {
        let event_url_array = event.url.split('/')
        let zendeskElements = document.querySelectorAll('.zopim')

        // On navigation end, load the zendesk chat widget if user lands on login page else hide the widget
        if(this.showChatWidget(window.location.href)) {
          this._script.loadScript('zendesk')
            .then( data => {
              if(data['status'] === 'loaded'){
              } else if(data['status'] === 'already_loaded'){ // if the widget script has already been loaded then just show the widget
                zendeskElements[0]['style']['display'] = 'block'
              }
            })
            .catch( error => console.error(error) )
        } else {
          // If Zendesk chat is loaded, hide it
          if(zendeskElements && zendeskElements.length > 1) {
            zendeskElements[0]['style']['display'] = 'none'
            zendeskElements[1]['style']['display'] = 'none'
          }
        }
      }
    });
  }

  ngOnInit() {
    // Toggle Banner here to show alerts and updates!
    // this.showSkyBanner = true
  }

  // Show the chat widget on: 'login', 'browse/library', or 'browse/groups/public'
  private showChatWidget(eventUrl: string): boolean {
      if (eventUrl.indexOf('browse/library') > -1 ||
          eventUrl.indexOf('browse/groups/public') > -1 ||
          eventUrl.indexOf('login') > -1) {
           return true
        }
      else {
        return false
      }
  }

  private findMainContent(): void {
    let htmlelement:HTMLElement = document.getElementById("mainContent");
    let element:Element;
    // On log in page, go to log in box
    if(htmlelement.querySelector("form div input")){
      element = htmlelement.querySelector("form div input");
    }
    // On any page that has search bar, go to search box
    else if(htmlelement.querySelector("div input")){  
      element = htmlelement.querySelector("div input"); 
    }
    // On asset page, go to the container that contains the item details
    else {
      element = htmlelement;
    }
    (<HTMLElement>element).focus(); 
  }
}
