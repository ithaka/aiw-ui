import {
  inject,
  TestBed
} from '@angular/core/testing';

import { Observable, Subject } from 'rxjs';

// Load the implementations that should be tested
import { App } from './app.component';
import { AppModule } from './app.module';

import { Component, ViewEncapsulation } from '@angular/core';
import { Angulartics2GoogleAnalytics } from 'angulartics2/ga';
import { Title } from '@angular/platform-browser';
import { Router, NavigationStart } from '@angular/router';


describe('App', () => {
  // provide our implementations or mocks to the dependency injector
  beforeEach(() => TestBed.configureTestingModule({
    providers: [
      { provide: Angulartics2GoogleAnalytics },
      { provide: Router, useValue: { events: new Subject().asObservable() } },
      App
    ]
  }));

  it('should log ngOnInit', inject([ App ], (app: App) => {
    spyOn(console, 'log');
    expect(console.log).not.toHaveBeenCalled();

    app.ngOnInit();
    expect(console.log).toHaveBeenCalled();
  }));

});
