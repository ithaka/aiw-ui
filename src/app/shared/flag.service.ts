import { Injectable } from '@angular/core';

@Injectable()
export class FlagService {
  /**
   * all public properties here are intended to be feature flags which are read/write accessible from any
   *  component or service which imports the FlagService
   */
  pcUpload: false
  unaffiliated: false

  constructor() {
  }
}