import { Injectable } from '@angular/core';

@Injectable()
export class FlagService {

  // /**
  //  * A list of all potential flags
  //  *  can be read/set using public methods from this service
  //  */
  // private _flags: Flags = {
  //   pcUpload: false,
  //   unaffiliated: false
  // }
  pcUpload: false
  unaffiliated: false

  constructor() {
  }

  // // this being the name of the property provides a little bit of awkward syntax while calling later,
  // //  but I couldn't think of anything better
  // getFlag(flagName: string): boolean {
  //   return this._flags[flagName]
  // }

  // /**
  //  * Used to set flag values from other components/services
  //  * @param key the name of the flag being set
  //  * @param value defaults to true, the value which should be set to the flag
  //  */
  // public setFlag(flagName: string, value?: boolean): void {
  //   if (!value) { value = true }
  //   this._flags[flagName] = value
  // }
}

interface Flags {
  pcUpload : boolean
  unaffiliated: boolean
}