import { Injectable } from '@angular/core';
import { Locker, DRIVERS } from 'angular-safeguard';

/**
 * Localstorage wrapper
 * - Uses Angular Safeguard
 * - Provides the cleanest interface possible and consolidates storage configuration (eg. using LOCAL)
 */
@Injectable({
  providedIn: 'root'
})
export class LockerService {

  private dataStore: any = {}

  constructor(
    // private _safeguard: Locker
    ) { }

  public get(key: string): any {
    return this.dataStore[key]
    // return this._safeguard.get(DRIVERS.LOCAL, key)
  }

  public set(key: string, value: any): void {
    this.dataStore[key] = value
    // return this._safeguard.set(DRIVERS.LOCAL, key, value)
  }

  public sessionGet(key: string): any {
    // return this._safeguard.get(DRIVERS.SESSION, key)
  }

  public sessionSet(key: string, value: any): void {
    // return this._safeguard.set(DRIVERS.SESSION, key, value)
  }

  public has(key: string): boolean {
    return true
    // return this._safeguard.has(DRIVERS.LOCAL, key)
  }

  public clear(): void {
    // return this._safeguard.clear(DRIVERS.LOCAL)
  }

  public remove(key: string): void {
    // return this._safeguard.remove(DRIVERS.LOCAL, key)
  }
}
