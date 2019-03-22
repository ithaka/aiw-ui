/*eslint-disable*/
import { HttpClientModule } from '@angular/common/http'
import { TestBed, getTestBed } from '@angular/core/testing'
import { PactWeb, Matchers } from '@pact-foundation/pact-web'

import {  CollectionTypeHandler, PersonalCollectionService } from '../shared'
import { CollectionPage } from '../collection-page'

/**
 *  Collections PACT
 *  Endpoints in this PACT:
 *
 *  DONT REALLY NEED TO PACTIFY THESE!
 *
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
 *
 */

 /**
  * Mock and test v1/categorydesc/id collection
  * Test collection id: 10374058879
  */

 const mockCategoryDescResp = {
    blurbUrl: null,
    id: 10374058879,
    imageDesc: null,
    imageUrl: null,
    leadObjectId: null,
    name: "AP Art History",
    shortDescription: null
 }

describe('Collections #pact #collections', () => {

  let provider
  let _collection = getTestBed().get(CollectionPage)

  // Set up all tests
  // ---------------------------------------------------------------------------------------------

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

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CollectionPage
      ],
      imports: [
        HttpClientModule
      ]
    });

    _collection = getTestBed().get(CollectionPage)
  });

  // Indidual tests 'describe'
  describe('GET /api/v1/categerydesc/{id}', () => {

    beforeAll((done) => {

      provider.addInteraction({
        uponReceiving: 'a request for ADL category description for a collection',
        withRequest: {
          method: 'GET',
          path: '/api/v1/categerydesc/',
        },
        willRespondWith: {
          status: 200,
          headers: { 'Content-Type': 'application/json;charset=UTF-8' },
          body: mockCategoryDescResp
        }
      }).then(() => { done() }, (err) => { done.fail(err) })
    })

    afterEach((done) => {
      provider.verify()
        .then(function (a) {
          done()
        }, function (e) {
          done.fail(e)
        })
    })

    fit('should return a category description response',
      function (done) {

        _collection.get('10374058879')
          .subscribe(res => {

            let actualResKeys = Object.keys(res) // response object keys
            let resAccessKeys = Object.keys(res.access[0]) // response 'access' object keys

            console.log('!!!!!!!!!!!!!!!', actualResKeys)

            let expectedResKeys = [
              'blurbUrl',
              'id',
              'imageDesc',
              'imageUrl',
              'leadObjectId',
              'name',
              'shortDescription'
            ]

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





// -----------------------------------------------------------------------------------------------------------------------

  //let _groupService; ig: => getTestBed().get(GroupService)

  /**
   * Mock and test a group/id enpoint (a single group)
   */
  // describe('GET /api/v1/collections/{id}', () => {
  //   beforeAll((done) => {

  //     provider.addInteraction({
  //       uponReceiving: 'a request for an individual collection',
  //       withRequest: {
  //         method: 'GET',
  //         path: '/api/v1/collection',
  //       },
  //       willRespondWith: {
  //         status: 200,
  //         headers: { 'Content-Type': 'application/json;charset=UTF-8' },
  //         body: mockTestCollectionResponse
  //       }
  //     })
  //       .then(() => { done() }, (err) => { done.fail(err) })
  //   })

  //   afterEach((done) => {
  //     provider.verify()
  //       .then(function (a) {
  //         done()
  //       }, function (e) {
  //         done.fail(e)
  //       })
  //   })

  //   it('should return single collection data',
  //     function (done) {

  //       _groupService.get('ADD TEST COLLECTION ID')
  //         .subscribe(res => {

  //           let actualResKeys = Object.keys(res) // response object keys
  //           let resAccessKeys = Object.keys(res.access[0]) // response 'access' object keys

  //           let expectedResKeys = [
  //             // 'description',
  //             // 'owner_name',
  //             // 'tags',
  //             // 'owner_id',
  //             // 'sequence_number',
  //             // 'update_date',
  //             // 'name',
  //             // 'public',
  //             // 'creation_date',
  //             // 'id',
  //             // 'access',
  //             // 'items'
  //           ]

  //           let expectedAccessKeys = [
  //             // 'entity_type',
  //             // 'entity_identifier',
  //             // 'access_type'
  //           ]

  //           // Test res.keys match expected keys
  //           expect(actualResKeys).toEqual(expectedResKeys)

  //           // Test res.access.keys
  //           expect(resAccessKeys).toEqual(expectedAccessKeys)

  //           // Test res.items length
  //           expect(res.items.length).toBeGreaterThan(0)
  //           done()
  //         },
  //           err => {
  //             done.fail(err)
  //           }
  //         )
  //     })
  // })

})
