import { Injectable, Inject, PLATFORM_ID } from '@angular/core'
import { isDefined } from '@angular/compiler/src/util'
import { isPlatformBrowser } from '@angular/common'

@Injectable({
  providedIn: 'root'
})
export class ArtstorStorageService {
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  // Is this code being interpretted by a browser-based client?
  private isBrowser: boolean = isPlatformBrowser(this.platformId)

  /**
   * hasSessionStorage
   * @returns boolean - sessionStorage is defined and platform is browser
   */
  public hasSessionStorage(): boolean {
    return this.isBrowser && isDefined(sessionStorage)
  }

  /**
   * hasLocalStorage
   * @returns boolean - localStorage is defined and platform is browser
   */
  public hasLocalStorage(): boolean {
    return this.isBrowser && isDefined(localStorage)
  }

  /**
   * setLocal
   * @param key local stroage key name
   * @param value value to set key to
   * @returns string or void
   */
  public setLocal(key: string, value: any): any | void {
    if (this.hasLocalStorage()) {
      if (typeof(value) === 'object') {
        value = JSON.stringify({data:value})
      }
      return localStorage.setItem(key, value)
    }
  }

  /**
   * getLocal
   * @param key local storage key to retrieve
   * @returns string value of key
   */
  public getLocal(key: string): any | void {
    if (this.hasLocalStorage()) {
      return localStorage.getItem(key)
    }
  }

  /**
   * removeLocalItem - remove a local storage item via key
   * @param key local storage key to remove
   */
  public removeLocalItem(key: string): any | void {
    if (this.hasLocalStorage()) {
      return localStorage.removeItem(key)
    }
  }

  /**
   * clearAll - clears all local storage set by application
   */
  public clearLocalStorage(): void {
    if (this.hasLocalStorage()) {
      return localStorage.clear()
    }
  }

  /**
   * setSession - set session storage value by key, value
   * @param key - storage key to set
   * @param value - value to set key to
   */
  public setSession(key: string, value: any): any | void {
    if (this.hasSessionStorage()) {
      if (typeof(value) === 'object' || key === 'totalAssets') {
        value = JSON.stringify({ data: value })
      }
      return sessionStorage.setItem(key, value)
    }
  }

  /**
   * getSession - get a session value by key
   * @param key - session key to retrieve a value for
   */
  public getSession(key: string): any | void {
    if (this.hasSessionStorage()) {
      return sessionStorage.getItem(key)
    }
  }

  /**
   * removeSessionItem - remove a session value by key
   * @param key - session key to remove
   */
  public removeSessionItem(key: string): any | void {
    if (this.hasSessionStorage) {
      return sessionStorage.removeItem(key)
    }
  }

  /**
   * clearSession - clear session storage
   */
  public clearSessionStorage(): void {
    if (this.hasSessionStorage()) {
      return sessionStorage.clear()
    }
  }

}
