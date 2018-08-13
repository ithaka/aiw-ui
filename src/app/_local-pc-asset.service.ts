import { Injectable } from '@angular/core'
import { AuthService, AssetDetailsFormValue } from './shared'

@Injectable()
export class LocalPCService {

  private _pcAssets: LocalPCAsset[] = []

  constructor(private _auth: AuthService) {
    if (!this.pcAssets) {
      this.pcAssets = []
    }
  }

  /**
   * Updates local javascript object _pcAssets, used internally, and updates the json object in localstorage
   */
  set pcAssets(assets: LocalPCAsset[]) {
    this._auth.store('pcAssets', assets) // store the asset array passed in
    this._pcAssets = this.pcAssets // update the local _pcAssets array
  }

  get pcAssets(): LocalPCAsset[] {
    return this._auth.getFromStorage('pcAssets') // this will, handily, return an immutable object :) don't try to change it, use the setter!
  }

  /**
   * Overwrites or adds data to local storage for asset
   * @param asset the asset to overwrite/add data for
   */
  public setAsset(asset: LocalPCAsset) {
    // see if an asset with this ssid exists in local storage
    let localAsset = this._getAsset(asset.ssid)
    if (localAsset) {
      Object.assign(localAsset, asset) // overwrite localAsset with the asset passed in
    } else {
      this._pcAssets.unshift(asset) // add the asset to the beginning of the array
    }

    this.pcAssets = this._pcAssets // we've modified the _pcAssets array and are resetting the value
  }

  /**
   * Returns data for asset in local storage with corresponding ssid
   *  if updated, the data WILL NOT reflect in local storage - use the setter!
   * @param ssid ssid for asset to return
   */
  public getAsset(ssid: number): LocalPCAsset {
    if (this.pcAssets) {
      return this.pcAssets.find((item) => {
        return item.ssid == ssid
      })
    } else {
      return
    }
  }

  /**
   * Returns reference to asset data in private _pcAssets array
   * @param ssid ssid of desired asset
   */
  private _getAsset(ssid: number): LocalPCAsset {
    return this._pcAssets.find((item) => {
      return item.ssid == ssid
    })
  }
}

export interface LocalPCAsset {
  ssid: number
  asset_metadata: AssetDetailsFormValue
}
