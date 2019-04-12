import { HttpClientModule } from '@angular/common/http'
//import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http'
import { TestBed, getTestBed, inject, async } from '@angular/core/testing'
import { Router, ActivatedRoute } from '@angular/router'
// import { NO_ERRORS_SCHEMA } from '@angular/compiler/src/core'

import { PactWeb, Matchers } from '@pact-foundation/pact-web'

import { AppConfig } from '../app.service'
import {  CollectionTypeHandler, PersonalCollectionService, AssetService, AssetSearchService,
AuthService, GroupService, ToolboxService, TitleService, ScriptService } from '../shared'

import { CollectionPage } from '../collection-page'

import { AssetFiltersService } from '../asset-filters/asset-filters.service';

import { MockRequests } from './mock-requests'

/**
 *  Collections PACT
 *  Endpoints in this PACT:
 *
 *  DONT REALLY NEED TO PACTIFY THESE!
 * /v1/collections/institutions?_method=allinstitutions
  /v1/collections/institutions?_method=allssinstitutions
  /v1/collections/institutions?_method=alldonatinginstitutions

  PACTIFY THESE
  // Returns collections according to type for the user's level of access
  /v1/collections?type?=institutional
  /v1/collections?type?=private
  /v1/collections?type?=public

  /v1/collections/103/categorynames

  /v1/collections/COLLECTION_ID
 *
 */


 /**
  * Mock and test v1/categorydesc/id collection
  * Test collection id: 10374058879
  */
fdescribe('Collections #pact #collections', () => {

  let provider, _collection,  _getCategoryInfo, _requests

  const mockCategoryDescResp = {
    blurbUrl: null,
    id: 10374058879,
    imageDesc: null,
    imageUrl: null,
    leadObjectId: null,
    name: "AP Art History",
    shortDescription: null
  }

  // const mockCategeoryNamesResp = [
  //   { categoryid: "", categoryname: "" },
  //   { categoryid: "", categoryname: "" },
  //   { categoryid: "", categoryname: "" },
  //   { categoryid: "", categoryname: "" },
  // ]


  beforeAll(function (done) {
    provider = new PactWeb({ consumer: 'aiw-ui', provider: 'binder-collections', port: 1204 })
    // Required for slower environments
    setTimeout(function () { done() }, 2000)
    // Required if run with `singleRun: false` (see karma config)
    provider.removeInteractions()
  })

  afterAll(function (done) {
    provider.finalize()
      .then(function () { done() }, function (err) { done.fail(err) })
  })

  let _assetService
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientModule],
      providers: [
        { provide: AppConfig, useValue: {} },
        { provide: Router, useValue: {} },
        { provide: ActivatedRoute, useValue: {} },
        { provide: AuthService, useValue: {} },
        { provide: GroupService, useValue: {} },
        { provide: ToolboxService, useValue: {} },
        { provide: TitleService, useValue: {} },
        { provide: ScriptService, useValue: {} },
        { provide: AssetSearchService, useValue: {} },
        { provide: AssetFiltersService, useValue: {} },
        MockRequests,
        CollectionPage,
        AssetService
      ],
    })
    const testbed = getTestBed()
    _assetService = testbed.get(AssetService)

    // _collection = getTestBed().get(CollectionPage)

    // _getCategoryInfo = getTestBed().get(_assetService.getCategoryInfo)

    //_requests = .get(MockRequests)


  });

  // Indidual tests 'describe'
  describe('GET /api/v1/categorydesc', () => {
    beforeAll((done) => {

      let interactions = []

      interactions.push(
        provider.addInteraction({
          uponReceiving: 'a request for ADL category description for a collection',
          withRequest: {
            method: 'GET',
            path: '/api/v1/categorydesc/10374058879',
            //query: '10374058879'
          },
          willRespondWith: {
            status: 200,
            headers: { 'Content-Type': 'application/json;charset=UTF-8' },
            body: mockCategoryDescResp
          }
        })
      )

      Promise.all(interactions)
        .then(() => { done() })
        .catch((err) => { done.fail(err) })
    })

    afterAll((done) => {
      provider.verify()
        .then(function (a) {
          done()
        }, function (e) {
          done.fail(e)
        })
    })

    it('should return a category description response',
      function (done) {

        _assetService.getCategoryInfo('10374058879')
          .subscribe(res => {

            let actualResKeys = Object.keys(res) // response object keys
            let resAccessKeys = Object.keys(res.access[0]) // response 'access' object keys

            console.log('Res Keys: ', actualResKeys)

            let expectedResKeys = [
              'blurbUrl',
              'id',
              'imageDesc',
              'imageUrl',
              'leadObjectId',
              'name',
              'shortDescription'
            ]
            expect(res).toEqual(mockCategoryDescResp)

            // Test res.keys match expected keys
            expect(actualResKeys).toEqual(expectedResKeys)

            // Test res.items length
            expect(res.name.length).toBeGreaterThan(0)
            done()
          },
            err => {
              done.fail(err)
            }
          )
      })
  })

})
