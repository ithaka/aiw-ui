/**
 * AppConfig
 * - Global service used to maintain configuration variables
 * - Provides support for WLV options
 */
import { Injectable, Inject, PLATFORM_ID, Injector } from '@angular/core';

// Import all WLV configs
import { WLV_ARTSTOR, WLV_SAHARA } from './white-label-config.ts'
import { isPlatformBrowser } from '@angular/common';

@Injectable()
export class AppConfig {
  // Default values
  public pageTitle: string = 'Artstor'
  public logoUrl: string = '/assets/img/logo-v1-1.png'
  public clientHostname: string = ''
  private _config
  private isBrowser

  private PORTS_TO_EXCLUDE = ["80", "4000", "8080"];

  constructor(@Inject(PLATFORM_ID) private platformId, private injector: Injector) {
    this.isBrowser = isPlatformBrowser(platformId);

    // Identify hostname from request or client side
    this.isBrowser = false;
    if (this.isBrowser) {
      const portNum = window.location.port;
      const hostName = window.location.hostname;

      this.clientHostname = this.getHostName(hostName, portNum);
    } else {
      let req = this.injector.get('request');

      const requestHost = req ? req.get('host').split(":") : [""];
      if(requestHost.length == 1) {
        this.clientHostname = requestHost[0];
      } else {
        this.clientHostname = this.getHostName(requestHost[0], requestHost[1]);
      }
      console.log("Requested from", this.clientHostname)
    }

    // Generic debugging between server/client rendering
    console.log("Detected hostname: " + this.clientHostname)

    let WLVConfig = this.getWLVConfig()
    if (WLVConfig) {
      this.pageTitle = WLVConfig.pageTitle
      this.logoUrl = WLVConfig.logoUrl
    }
    this._config = Object.assign(WLV_ARTSTOR, this.getWLVConfig())
  }

  get config(): any {
    return this._config
  }

  private getHostName(hostName, portNum) {
    return (this.PORTS_TO_EXCLUDE.includes(portNum)) ?
      hostName :
      `${hostName}:${portNum}`;
  }

  private getWLVConfig() {
    if (this.clientHostname.indexOf('sahara.artstor.org') > -1
      || this.clientHostname.indexOf('sahara.local.artstor.org') > -1
      || this.clientHostname.indexOf('sahara.prod.artstor.org') > -1
      || this.clientHostname.indexOf('sahara.test.artstor.org') > -1
      || this.clientHostname.indexOf('sahara.beta.stage.artstor.org') > -1 ) {
      return WLV_SAHARA
    } else {
      return WLV_ARTSTOR
    }
  }
}
