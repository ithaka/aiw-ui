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
import { Login } from './login.component';
import { Title } from './title';

describe('Login', () => {
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
      Login
    ]
  }));

  it('should have default data', inject([ Login ], (login: Login) => {
    expect(login.localState).toEqual({ value: '' });
  }));

  // it('should have a title', inject([ Login ], (login: Login) => {
  //   expect(!!login.title).toEqual(true);
  // }));

  it('should log ngOnInit', inject([ Login ], (login: Login) => {
    spyOn(console, 'log');
    expect(console.log).not.toHaveBeenCalled();

    login.ngOnInit();
    expect(console.log).toHaveBeenCalled();
  }));

});
