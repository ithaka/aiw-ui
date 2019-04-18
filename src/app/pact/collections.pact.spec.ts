import { HttpClientModule } from '@angular/common/http'
import { Location, LocationStrategy } from '@angular/common'
import { TestBed, getTestBed, inject, async } from '@angular/core/testing'
import { Router, RouterModule } from '@angular/router'
import { Idle } from '@ng-idle/core'

import { PactWeb, Matchers } from '@pact-foundation/pact-web'

import { AppConfig } from '../app.service'
import { AuthService } from '../shared'
import { CollectionService } from '../_services'
import { USE_VALUE } from '@angular/core/src/di/injector';

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

  let provider, _collectionService

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
    setTimeout(function () { done() }, 2000)
      provider.removeInteractions()
  })

  afterAll(function (done) {
    provider.finalize()
      .then(function () { done() }, function (err) { done.fail(err) })
  })

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientModule],
      providers: [
        { provide: AuthService, useValue: { getUrl: () => { return '' } } },
        CollectionService
      ],
    })
    const testbed = getTestBed()
    _collectionService = testbed.get(CollectionService)

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

        _collectionService.getCategoryInfo('10374058879', true)
          .then(res => {

            let actualResKeys = Object.keys(res) // response object keys

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
            expect(actualResKeys).toEqual(expectedResKeys)
            expect(res.name.length).toBeGreaterThan(0)
          },
            err => {
              done.fail(err)
            }
          )

        done()
      })
  })

})
