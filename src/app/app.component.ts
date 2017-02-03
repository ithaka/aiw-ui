/*
 * Angular 2 decorators and services
 */
import { Component, ViewEncapsulation } from '@angular/core';
import { Angulartics2GoogleAnalytics } from 'angulartics2';

import { Title } from '@angular/platform-browser';
import { Router, NavigationStart } from '@angular/router';

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
    <nav-bar></nav-bar>

    <main>
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

  // constructor(angulartics2GoogleAnalytics: Angulartics2GoogleAnalytics) {
  constructor(angulartics2GoogleAnalytics: Angulartics2GoogleAnalytics, private titleService: Title, private router:Router) {

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
    console.log('App Component has loaded');
  }

}