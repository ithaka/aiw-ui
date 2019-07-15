import { PLATFORM_ID, Injector } from "@angular/core";
import { Router } from "express";
import { ActivatedRoute } from "@angular/router";
import { RouterlessTracking, Angulartics2 } from "angulartics2";
import { Subject } from "rxjs";
import { ArtstorStorageService } from "../../../projects/artstor-storage/src/public_api";
import { AppConfig } from "app/app.service";
import { AuthService } from "_services";
import { Idle, IdleExpiry } from "@ng-idle/core";


export var AuthProviders = [
    { provide: PLATFORM_ID, useValue: 'server' },
    { provide: Router, useValue: {} },
    { provide: ActivatedRoute, useValue: {} },
    { provide: RouterlessTracking, useValue: {} },
    { provide: Angulartics2, useValue: {
      eventTrack: new Subject(),
      setUsername: new Subject(),
      setUserProperties: new Subject()
    } },
    { provide: Location , useValue: {} },
    { provide: 'request', useValue: {
      headers: {},
      ip: '192.168.1.1',
      get: (string) => { return '' }
    }},
    { provide: ArtstorStorageService, useValue: {
      getLocal: (string) => {return {}},
      setLocal: (string, thing) => { return; },
      clearLocalStorage: () => {return {}}
    }},
    Injector,
    AppConfig,
    AuthService,
    Idle, IdleExpiry
]