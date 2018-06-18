import { Injectable } from '@angular/core';

@Injectable()
export class FlagService {

  /**
   * A list of all potential flags
   *  can be read/set using public methods from this service
   */
  private _flags: Flags = {
    pcUpload: false,
    unaffiliated: false
  }

  constructor() {
  }

  get flags(): Flags {
    return this._flags
  }

  /**
   * Used to set flag values from other components/services
   * @param key the name of the flag being set
   * @param value defaults to true, the value which should be set to the flag
   */
  public setFlag(key: string, value?: boolean): void {
    if (!value) { value = true }
    this._flags[key] = value
  }
}

interface Flags {
  pcUpload : boolean
  unaffiliated: boolean
}