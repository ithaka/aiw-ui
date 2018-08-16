/**
 * AppConfig
 * - Global service used to maintain configuration variables
 * - Provides support for WLV options
 */
import { Injectable } from '@angular/core';

// Import all WLV configs
import { WLV_ARTSTOR, WLV_SAHARA } from './white-label-config.ts'

@Injectable()
export class AppConfig {
  // Default values
  // public pageTitle = 'Artstor'
  // public logoUrl = '/assets/img/logo-v1-1.png'
  private _config

  constructor() {
    // let WLVConfig = this.getWLVConfig()
    // if (WLVConfig) {
    //   this.pageTitle = WLVConfig.pageTitle
    //   this.logoUrl = WLVConfig.logoUrl
    // }
    this._config = Object.assign(WLV_ARTSTOR, this.getWLVConfig())
  }

  get config(): any {
    return this._config
  }

  private getWLVConfig() {
    if (document.location.hostname.indexOf('sahara.artstor.org') > -1
        || document.location.hostname.indexOf('sahara.local.artstor.org') > -1
        || document.location.hostname.indexOf('sahara.prod.artstor.org') > -1
        || document.location.hostname.indexOf('sahara.test.artstor.org') > -1
        || document.location.hostname.indexOf('sahara.beta.stage.artstor.org') > -1 ) {
      return WLV_SAHARA
    } else {
      return WLV_ARTSTOR
    }
  }
}
