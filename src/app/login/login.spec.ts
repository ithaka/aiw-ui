// test imports
import { ComponentFixture, TestBed, async } from '@angular/core/testing';
import { By }              from '@angular/platform-browser';
import { DebugElement }    from '@angular/core';

// angular imports
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Http } from '@angular/http';
import { Locker } from 'angular2-locker';
import { Location } from '@angular/common';
import { Angulartics2 } from 'angulartics2';

// our file imports
import { AppState } from '../app.service';
import { Login } from './login.component';
import { AuthService } from './../shared/auth.service';
import { LoginService, User } from './login.service';

describe("testy test", () => {
  it("it should test", () => {
    expect(true).toBe(true);
  });
});

describe("Login component inline template", () => {
  let login: Login;
  let fixture: ComponentFixture<Login>;
  let de: DebugElement;
  let el: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ FormsModule ],
      declarations: [ Login ],
      providers: [
        { provide: Router, useValue: {} },
        { provide: AuthService, useValue: {} },
        { provide: LoginService, useValue: {} },
        { provide: Http, useValue: {} },
        { provide: Locker, useValue: {} },
        { provide: AppState, useValue: {} },
        { provide: Location, useValue: {} },
        { provide: Angulartics2, useValue: {} }
      ]
    });

    fixture = TestBed.createComponent(Login);

    login = fixture.componentInstance;

    // query for the h1 title with css element selector
    de = fixture.debugElement.query(By.css('h1'));
    el = de.nativeElement;
  });

  it("should have a heading", () => {
    // initial test to verify that heading exists
    let heading = fixture.debugElement.queryAll(By.css('#loginHeading'));
    expect(heading.length).toEqual(1);

    // negative test for good measure
    let negative = fixture.debugElement.queryAll(By.css('#nothingshouldhavethisid'));
    expect(negative.length).toEqual(0);
  });
});