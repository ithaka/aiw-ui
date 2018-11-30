import { InjectionToken, Inject, PLATFORM_ID } from '@angular/core'

import {PollyfillDriver} from './PolyfillDriver'
import {Driver} from './Driver'
import {MemoryStorage} from './MemoryStorage'
import {CookieStorage} from './CookieStorage'
import {IDriverType, IStorage} from './metadata'

export const enum DRIVERS {
  LOCAL = 'local',
  SESSION = 'session',
  MEMORY = 'memory',
  COOKIE = 'cookie'
}

class Platform {
  constructor(@Inject(PLATFORM_ID) private platformId: Object, public localstorage: IStorage) { 
    if (this.platformId !== 'browser') {
      this.localstorage = null
    }
    else {
      this.localstorage = localStorage
    }
  }
}

let platform: Platform

/* tslint:disable variable-name */

export const LocalStorageDriver: IDriverType = {
  storage: new PollyfillDriver(platform.localstorage),
  type: DRIVERS.LOCAL
}

export const SessionStorageDriver: IDriverType = {
  storage: new PollyfillDriver(sessionStorage),
  type: DRIVERS.SESSION
}

export const MemoryStorageDriver: IDriverType = {
  storage: new PollyfillDriver(new MemoryStorage()),
  type: DRIVERS.MEMORY
}

export const CookieStorageDriver: IDriverType = {
  storage: new Driver(new CookieStorage()),
  type: DRIVERS.COOKIE
}

/* tslint:enable variable-name */

export const LOCKER_DRIVER_TYPES = new InjectionToken('LOCKER_DRIVER_TYPES')

export const DRIVER_TYPES_PROVIDERS = [{
  provide: LOCKER_DRIVER_TYPES,
  multi: true,
  useValue: LocalStorageDriver
}, {
  provide: LOCKER_DRIVER_TYPES,
  multi: true,
  useValue: SessionStorageDriver
}, {
  provide: LOCKER_DRIVER_TYPES,
  multi: true,
  useValue: MemoryStorageDriver
}, {
  provide: LOCKER_DRIVER_TYPES,
  multi: true,
  useValue: CookieStorageDriver
}]
