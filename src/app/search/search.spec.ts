import {
  inject,
  TestBed
} from '@angular/core/testing';
import { Component } from '@angular/core';
import {
  BaseRequestOptions,
  ConnectionBackend,
  Http
} from '@angular/http';
import { MockBackend } from '@angular/http/testing';

// Load the implementations that should be tested
import { AppState } from '../app.service';
import { Search } from './search.component';
import { Title } from './title';

describe('Search', () => {
  // provide our implementations or mocks to the dependency injector
  beforeEach(() => TestBed.configureTestingModule({
    providers: [
      BaseRequestOptions,
      MockBackend,
      {
        provide: Http,
        useFactory: function(backend: ConnectionBackend, defaultOptions: BaseRequestOptions) {
          return new Http(backend, defaultOptions);
        },
        deps: [MockBackend, BaseRequestOptions]
      },
      AppState,
      Title,
      Search
    ]
  }));

  it('should have default data', inject([ Search ], (search: Search) => {
    expect(Search.localState).toEqual({ value: '' });
  }));

  it('should have a title', inject([ Search ], (search: Search) => {
    expect(!!Search.title).toEqual(true);
  }));

  it('should log ngOnInit', inject([ Search ], (search: Search) => {
    spyOn(console, 'log');
    expect(console.log).not.toHaveBeenCalled();

    Search.ngOnInit();
    expect(console.log).toHaveBeenCalled();
  }));

});
