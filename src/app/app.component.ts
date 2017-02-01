/*
 * Angular 2 decorators and services
 */
import { Component, ViewEncapsulation } from '@angular/core';
import { Angulartics2GoogleAnalytics } from 'angulartics2';

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

  constructor(angulartics2GoogleAnalytics: Angulartics2GoogleAnalytics) {
      
  }

  ngOnInit() {
    console.log('App Component has loaded');
  }

}