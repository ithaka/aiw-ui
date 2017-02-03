import {
  inject,
  TestBed
} from '@angular/core/testing';

// Load the implementations that should be tested
import { App } from './app.component';
import { AppModule } from './app.module';

import {  Angulartics2GoogleAnalytics } from 'angulartics2';

describe('App', () => {
  // provide our implementations or mocks to the dependency injector
  beforeEach(() => TestBed.configureTestingModule({
    providers: [
      {
        provide: Angulartics2GoogleAnalytics
      },
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
