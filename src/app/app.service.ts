import { Injectable } from '@angular/core';

// Import all WLV configs
import { WLV_SAHARA } from './white-label-config.ts'

@Injectable()
export class AppConfig {


  constructor() {
    
  }
  
  getWLVConfig() {
    if (document.location.hostname.indexOf('sahara.artstor.org') > -1 || true ) {
      return WLV_SAHARA
    } else {
      // return null
    }
  }
}
