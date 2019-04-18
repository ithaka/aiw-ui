import { HttpClientModule } from '@angular/common/http'
import { TestBed, getTestBed, inject, async } from '@angular/core/testing'

import { PactWeb, Matchers } from '@pact-foundation/pact-web'

import { AuthService } from '../shared'
import { CollectionService } from '../_services'

describe('Collections #pact #collections', () => {

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

  const mockCategoryNamesResp = [
    { "categoryid": 1031896055, "categoryname": "Historic American Sheet Music Covers (Minneapolis College of Art and Design)" },
    { "categoryid": 1034136270, "categoryname": "Historic Illustrations of Art & Architecture (Minneapolis College of Art and Design)" },
    { "categoryid": 1034458025, "categoryname": "Historic Campus Architecture Collection (HCAP) (Council of Independent Colleges)" },
    { "categoryid": 1034347075, "categoryname": "Alexander Adducci: Historical Scenic Design" }
  ]

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
        // provides _auth.getUrl used in getCategoryInfo
        { provide: AuthService, useValue:
          {
            getUrl: () => { return '' },
            getHostname: () => { return '' }
          }
        },
        CollectionService
      ],
    })
    const testbed = getTestBed()
    _collectionService = testbed.get(CollectionService)

  })

  /**
  * Mock and test /v1/categorydesc/id collection
  * Test collection id: 10374058879
  */
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

    it('should return a category description response', (done) => {

        _collectionService.getCategoryInfo('10374058879')
          .then(res => {

            let actualResKeys = Object.keys(res)

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
          })

        done()
      })
  })

  /**
  * Mock and test api/v1/collections/103/categorynames
  */

  fdescribe('GET /api/v1/collections/103/categorynames', () => {
    beforeAll((done) => {

      let interactions = []

      interactions.push(
        provider.addInteraction({
          uponReceiving: 'a request for category data for ADL 103 collections',
          withRequest: {
            method: 'GET',
            path: '/api/v1/collections/103/categorynames',
          },
          willRespondWith: {
            status: 200,
            headers: { 'Content-Type': 'application/json;charset=UTF-8' },
            body: mockCategoryNamesResp
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

    it('should return an array of ADL collection category data', (done) => {

      _collectionService.getCategoryNames()
        .then(res => {

          let expectedResKeys = ['categoryid', 'categoryname']

          expect(res.length).toEqual(4)
          //expect(res[0].categoryid).toEqual('1031896055')

        },
          err => {
            done.fail(err)
          })

      done()
    })
  })



})
