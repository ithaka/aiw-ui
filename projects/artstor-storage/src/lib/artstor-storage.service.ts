import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isDefined } from '@angular/compiler/src/util';
import { localStorageFactory } from '@ng-toolkit/universal';

@Injectable({
  providedIn: 'root'
})
export class ArtstorStorageService {
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  // Is this code being interpretted by a browser-based client?
  private isBrowser: boolean = this.platformId === 'browser'

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
  public setLocal(key: string, value: string): string | void {
    if (this.hasLocalStorage()) {
      return localStorage.setItem(key, value)
    }
  }

  /**
   * getLocal
   * @param key local storage key to retrieve
   * @returns string value of key
   */
  public getLocal(key: string): string {
    if (this.hasLocalStorage()) {
      return localStorage.getItem(key)
    }
  }

  /**
   * removeLocalItem - remove a local storage item via key
   * @param key local storage key to remove
   */
  public removeLocalItem(key: string): string | void {
    return localStorage.removeItem(key)
  }

  /**
   * clearAll - clears all local storage set by application
   */
  public clearAll() {
    return localStorage.clear()
  }

  /**
   * setSession - set session storage value by key, value
   * @param key
   * @param value
   */
  public setSession(key: string, value: string): string | void {
    if (this.hasSessionStorage()) {
      return sessionStorage.setItem(key, value)
    }
  }

  /**
   * getSession - get a session value by key
   * @param key
   */
  public getSession(key: string): string | void {
    if (this.hasSessionStorage()) {
      return sessionStorage.getItem(key)
    }
  }

}
