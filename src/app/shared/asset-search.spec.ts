import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { AssetFiltersService } from '../asset-filters/asset-filters.service'
import { AuthService } from './auth.service'
import { AppConfig } from '../app.service'
import { Observable } from 'rxjs/Observable'
import { AssetSearchService } from './asset-search.service';
import { inject } from '@angular/core/testing';

// class MockedAssetSearch extends AssetSearchService {
//   return
// }

describe('Service: AssetSearchService', () => {

  let service: AssetSearchService
  let http: HttpClient
  let filters: AssetFiltersService
  let app: AppConfig
  let auth: AuthService

  beforeEach(() => {
    service = new AssetSearchService(http, filters, auth, app)
  })

  afterEach(() => {
    service = null
  })

  fit('asset search test', inject([service], (_search: AssetSearchService) => {

  }))

});
