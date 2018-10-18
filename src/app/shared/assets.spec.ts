import { TestBed, inject, async } from '@angular/core/testing'
import { AssetService } from './assets.service'

// Library imports
import { Injectable, OnDestroy, OnInit } from '@angular/core'
import { Router, ActivatedRoute, Params } from '@angular/router'
import { Http, Response, Headers, RequestOptions } from '@angular/http'
import { Observable, BehaviorSubject, Subscription } from 'rxjs'
import { Locker, LockerConfig } from 'angular2-locker'
import 'rxjs/add/operator/toPromise' // TODO REMOVE USAGE RXJS toPromise
import { map } from 'rxjs/operators'

// Project dependencies
import { AuthService } from './auth.service'
import { AssetFiltersService } from './../asset-filters/asset-filters.service'
import { ToolboxService } from './toolbox.service'

describe('AssetServiceTest', () => {
   let _assets;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
            AssetService,
            { provide: AssetFiltersService },
            { provide: Http, useValue: {} },
            { provide: Locker, useValue : { useDriver: function() {} } },
            { provide: LockerConfig, useValue: {} },
            { provide: Router, useValue: {} },
            { provide: ActivatedRoute, useValue: {} },
            { provide: AuthService, useValue: {} },
            { provide: ToolboxService, useValue: {} }
        ]
    });

    // _assets = AssetService;

  });


  it('initial AssetService should have default pagination values', inject([AssetService], ( _assets: AssetService) => {
        _assets.pagination.take(1).subscribe(
            data => {
                expect(data.page).toBe(1);
                expect(data.size).toBe(24);
                expect(data.totalPages).toBe(1);
            }
        );
    }));
});
