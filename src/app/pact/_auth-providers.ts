import { PLATFORM_ID, Injector } from "@angular/core"
import { ActivatedRoute, Router } from "@angular/router"
import { Location } from '@angular/common'
import { RouterlessTracking, Angulartics2 } from "angulartics2"
import { Subject } from "rxjs"
import { Idle, IdleExpiry } from "@ng-idle/core"

// Project Dependencies
import { ArtstorStorageService } from "../../../projects/artstor-storage/src/public_api"
import { AppConfig } from "app/app.service"

/**
 * Mock Auth providers for Pacts
 * + Include "AuthService" alongside these providers (for direct testbed access)
 * + Don't forget importing "HttpClientModule" when using these providers!
 * Example:
 *    TestBed.configureTestingModule({
 *      imports: [HttpClientModule],
 *      providers: [
 *        ...AUTH_PROVIDERS,
 *        AuthService
 *      ],
 *    })
 *    const testbed = getTestBed()
 *    _auth = testbed.get(AuthService)
 */
export const AUTH_PROVIDERS = [
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
    Idle, 
    IdleExpiry
]