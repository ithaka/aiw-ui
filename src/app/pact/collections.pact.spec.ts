import { HttpClientModule } from '@angular/common/http'
import { TestBed, getTestBed, inject, async } from '@angular/core/testing'
import { PactWeb, Matchers } from '@pact-foundation/pact-web'
import { map, take } from 'rxjs/operators'
import { Subscription } from 'rxjs'

import { AuthService } from '../shared'
import { CollectionService, InstitutionService } from '../_services'

describe('Collections #pact #collections', () => {

  let provider, _collectionService, _institutionService

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
        // provides _auth.getUrl and _auth.getHostname used in getCategoryDescription
        { provide: AuthService, useValue:
          {
            getUrl: () => { return '/api' },
            getHostname: () => { return '' }
          }
        },
        CollectionService,
        InstitutionService
      ],
    })
    const testbed = getTestBed()
    _collectionService = testbed.get(CollectionService)
    _institutionService = testbed.get(InstitutionService)

  })

  /**
  * Describes /v1/categorydesc/id
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

        _collectionService.getCategoryDescription('10374058879')
          .then(res => {
            expect(res).toEqual(mockCategoryDescResp)
            expect(res.name.length).toBeGreaterThan(0)
          },
          err => {
            done.fail(err)
          })

        done()
      })
  })

  /**
  * Describes api/v1/collections/103/categorynames
  */

  describe('GET /api/v1/collections/103/categorynames', () => {
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

          let actualResKeys = Object.keys(res)
          let expectedResKeys = mockCategoryNamesRespKeys

          expect(res).toBeTruthy()

        },
          err => {
            done.fail(err)
          })

      done()
    })
  })


  /**
   * Describes /v1/collections/{id}
   */

  describe('GET /api/v1/collections', () => {
    beforeAll((done) => {

      let interactions = []

      interactions.push(
        provider.addInteraction({
          uponReceiving: 'a request for a collection',
          withRequest: {
            method: 'GET',
            path: '/api/v1/collections/87730176',
          },
          willRespondWith: {
            status: 200,
            headers: { 'Content-Type': 'application/json;charset=UTF-8' },
            body: mockCollectionResp
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

    it('should return a valid collection response', (done) => {

      _collectionService.getCollectionInfo('87730176')
        .then(res => {

          let actualResKeys = Object.keys(res)
          let expectedResKeys = mockCollectionRespKeys

          expect(res).toBeTruthy()
          expect(actualResKeys).toEqual(expectedResKeys)
          expect(res.bigimageurl.length).toBeGreaterThan(0)
        },
        err => {
          done.fail(err)
        })

      done()
    })
  })

  /**
   * Describes /v1/collections/institutions?_method=allinstitutions
   */
  describe('GET /api/v1/collections/institutions', () => {
    beforeAll((done) => {

      let interactions = []

      interactions.push(
        provider.addInteraction({
          uponReceiving: 'a request for list of all, donating, or shared shelf institutions',
          withRequest: {
            method: 'GET',
            path: '/api/v1/collections/institutions',
            query: '_method=allinstitutions',
          },
          willRespondWith: {
            status: 200,
            headers: { 'Content-Type': 'application/json;charset=UTF-8' },
            body: mockInstitutionsResp
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

    it('should return a valid institutions array', (done) => {

      _institutionService.getAllInstitutions().subscribe(res => {
        let actualResKeys = Object.keys(res)
        let expectedResKeys = mockInstitutionsRespKeys

        expect(res).toBeTruthy()
        expect(actualResKeys).toEqual(expectedResKeys)
        expect(res).toEqual(mockInstitutionsResp)
        },
        err => {
          done.fail(err)
        })

      done()
    })
  })

})


// Category Description - /v1/categorydesc/id
const mockCategoryDescResp = {
  blurbUrl: null,
  id: 10374058879,
  imageDesc: null,
  imageUrl: null,
  leadObjectId: null,
  name: "AP Art History",
  shortDescription: null
}

// Category Names - api/v1/collections/103/categorynames
const mockCategoryNamesResp = [
  { "categoryid": 1031896055, "categoryname": "Historic American Sheet Music Covers (Minneapolis College of Art and Design)" },
  { "categoryid": 1034136270, "categoryname": "Historic Illustrations of Art & Architecture (Minneapolis College of Art and Design)" },
  { "categoryid": 1034458025, "categoryname": "Historic Campus Architecture Collection (HCAP) (Council of Independent Colleges)" },
  { "categoryid": 1034347075, "categoryname": "Alexander Adducci: Historical Scenic Design" }
]

const mockCategoryNamesRespKeys = ['categoryid', 'categoryname']

// Collection - /v1/collections/id
const mockCollectionResp = {
  bigimageurl: "http://mdxstage.artstor.org//thumb/imgstor/size10/CSshared-shelf-2.gif",
  blurburl: "<p><a target=_blank  href=http://www.sscommons.org/openlibrary/welcome.html style=display:inline>Shared Shelf Commons</a> is a free, open-access library of images. Search and browse collections with tools to zoom, print, export, and share images. Public Collections are delivered via <a target=_blank href=http://www.artstor.org/jstorforum style=display:inline>JSTOR Forum</a>, a web-based software solution for creating, sharing, and preserving digital collections.</p> Images and media from Shared Shelf Commons can be viewed, downloaded, and shared with anyone on the open web. New open-access collections are added frequently, so check back often to see the latest.</p>",
  catCount: 0,
  collectionImageDesc: null,
  collectionType: 5,
  collectionid: "87730176",
  collectionname: "Bowdoin College Museum of Art Historical Images",
  fullDescription: null,
  imageServer: "/thumb/",
  imageurl: "shared-shelf-2.gif",
  institutionId: 1000,
  leadImageURL: null,
  objCount: 9088,
  seq: 7730176,
  shortDescription: null,
  spaceQuota: 0,
  spaceUsed: 0,
  thumbnails: []
}

const mockCollectionRespKeys = [
  'bigimageurl',
  'blurburl',
  'catCount',
  'collectionImageDesc',
  'collectionType',
  'collectionid',
  'collectionname',
  'fullDescription',
  'imageServer',
  'imageurl',
  'institutionId',
  'leadImageURL',
  'objCount',
  'seq',
  'shortDescription',
  'spaceQuota',
  'spaceUsed',
  'thumbnails'
]

// Institutions - v1/collections/institutions?method=all

const mockInstitutionsResp = {
  allInstitutions: [
    { institutionId: "416915705", institutionName: "A. Cemal Ekin" }
  ],
  donatingInstitutions: [
    { institutionId: "416915705", institutionName: "A. Cemal Ekin" }
  ],
  ssInstitutions: [
    { institutionId: "416915705", institutionName: "A. Cemal Ekin" }
  ]

}

const mockInstitutionsRespKeys = ['allInstitutions', 'donatingInstitutions', 'ssInstitutions']
