/*eslint-disable*/
import { HttpClientModule } from '@angular/common/http'
import { TestBed, getTestBed } from '@angular/core/testing'
import { PactWeb, Matchers } from '@pact-foundation/pact-web'

// Project Dependencies
import { GroupService } from '../shared';

/**
* Pact for GroupService.get method - api request for a single image group
*/
describe("Group Id #pact #groupId", () => {

  let provider;
  let _groupService;

  // Image Group with id of 44d14fe7-13ec-4d84-b911-7ee3ffc4b0cb
  const expectedImageGroupObject = {
    "description": "",
    "owner_name": "air01@artstor.org",
    "tags": ["adl", "collection"],
    "owner_id": "706217",
    "sequence_number": 0,
    "update_date": "2018-01-16T18:49:07Z",
    "name": "ADL_Group1_copy",
    "public": false,
    "creation_date": "2018-01-16T18:48:43Z",
    "id": "44d14fe7-13ec-4d84-b911-7ee3ffc4b0cb",
    "access": [
      {
        "entity_type": 100,
        "entity_identifier": "706217",
        "access_type": 300
      }
    ],
    "items": [
      "AWAYNEIG_10311326670",
      "ADAVISIG_10311277805",
      "AWSS35953_35953_38398951",
      "HARTILL_12324316",
      "ASITESPHOTOIG_10312738558",
      "AWSS35953_35953_38398953",
      "HARTILL_12326634",
      "HCAP_10310729952",
      "HCAP_10310728522",
      "ASITESPHOTOIG_10313835802"
    ]
  }

  // We want to use Pact to verify the types of the properties on the response
  let matcherImageGroupObject = {}
  Object.keys(expectedImageGroupObject).forEach((key) => {
    matcherImageGroupObject[key] = Matchers.somethingLike(expectedImageGroupObject[key])
  })

  beforeAll(function (done) {
    provider = new PactWeb({
      consumer: 'aiw-ui',
      provider: 'binder-group',
      port: 1234,
      host: 'localhost'
    })
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
        GroupService
      ],
      imports: [
        HttpClientModule
      ]
    });

    _groupService = getTestBed().get(GroupService)
  });

  /**
   * Mock and test group listing endpoint
   */
  describe("GET /api/v1/group/{id}", () => {
    beforeAll((done) => {

      provider.addInteraction({
        uponReceiving: 'a request for an individual image group',
        withRequest: {
          method: 'GET',
          path: '/api/v1/group/44d14fe7-13ec-4d84-b911-7ee3ffc4b0cb',
        },
        willRespondWith: {
          status: 200,
          headers: { 'Content-Type': 'application/json;charset=UTF-8' },
          body: matcherImageGroupObject
        }
      })
        .then(() => { done() }, (err) => { done.fail(err) })
    })

    afterEach((done) => {
      provider.verify()
        .then(function (a) {
          done()
        }, function (e) {
          done.fail(e)
        })
    })

    it("should return an image group object",
      function (done) {
        //Run the tests
        _groupService.get('44d14fe7-13ec-4d84-b911-7ee3ffc4b0cb')
          .subscribe(res => {

            let actualResKeys = Object.keys(res) // response object keys
            let resAccessKeys = Object.keys(res.access[0]) // response 'access' object keys

            let expectedResKeys = ['description', 'owner_name', 'tags', 'owner_id', 'sequence_number',
              'update_date', 'name', 'public', 'creation_date', 'id', 'access', 'items']

            let expectedAccessKeys = [
              'entity_type',
              'entity_identifier',
              'access_type'
            ]

            // Test res.keys match expected keys
            expect(actualResKeys).toEqual(expectedResKeys)

            // Test res.access.keys
            expect(resAccessKeys).toEqual(expectedAccessKeys)

            // Test res.items length
            expect(res.items.length).toBeGreaterThan(0)
            done()
          },
            err => {
              done.fail(err)
            }
          )
      })
  })
})
