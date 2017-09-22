import { Injectable } from '@angular/core';

// Import all WLV configs
import { WLV_SAHARA } from './white-label-config.ts'

@Injectable()
export class AppConfig {


  constructor() {
    
  }
  
  getWLVConfig() {
    if (document.location.hostname.indexOf('sahara.artstor.org') > -1 || document.location.hostname.indexOf('sahara.test.artstor.org') > -1) {
      return WLV_SAHARA
    } else {
      return null
    }
  }
}
