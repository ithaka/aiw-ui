/*eslint-disable*/
import {Http, HttpModule, BaseRequestOptions, Response, RequestOptions, XHRBackend, ResponseOptions, RequestMethod} from '@angular/http';
import {TestBed, inject, getTestBed, async} from '@angular/core/testing';
import { AccountService } from './../shared'
import { PactWeb, Matchers} from '@pact-foundation/pact-web'
import { HttpClientModule } from '@angular/common/http'

describe('PUT /api/secure/user/{{profileId}} #pact #updateuser', () => {

  let provider


  beforeAll(function(done) {
    provider = new PactWeb({ consumer: 'aiw-ui', provider: 'artaa_service' })

    // required for slower Travis CI environment
    setTimeout(function () { done() }, 2000)

    // Required if run with `singleRun: false`
    provider.removeInteractions()
  })

  afterAll(function (done) {
    provider
    .finalize()
    .then(function () { done() }, function (err) { done.fail(err) })
  })

  let service
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientModule],
        providers: [
          AccountService
        ]
    })
    const testbed = getTestBed();
      service = testbed.get(AccountService);
  })

  const updateObjects: { field: string, value: any }[] = [
    {
      field: 'firstName',
      value: 'my updated name'
    },
    {
      field: 'lastName',
      value: 'a new last name!'
    },
    {
      field: 'departmentRole',
      value: 'a new role for the user!'
    },
    {
      field: 'department',
      value: 'a new department!'
    },
    {
      field: 'allowSurvey',
      value: true
    },
    {
      field: 'allowUpdatesSurvey',
      value: true
    }
  ]

  describe("update user's first name", () => {
    const exampleUpdateResponse = {
      firstName: 'my updated name'
    }

    let body = {
      [updateObjects[0].field]:  Matchers.somethingLike(updateObjects[0].value)
    }

    beforeAll(function (done) {
      let interactions = []

      // create each interaction to be tested
      updateObjects.forEach((obj) => {
        let body = {
          [obj.field]: Matchers.somethingLike(obj.value)
        }

        interactions.push(
          provider.addInteraction({
            uponReceiving: "a request to update a user's " + obj.field,
            withRequest: {
              method: 'PUT',
              path: '/api/secure/user/' + 706217,
              body: body
            },
            willRespondWith: {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            }
          })
        )
      })

      Promise.all(interactions)
      .then(() => { done() })
      .catch((err) => { done.fail(err) })
    })

    afterAll((done) => {
      // called in afterAll to make sure it fires after all interactions have been tested
      provider.verify()
      .then(function(a) {
        done()
      }, function(e) {
        done.fail(e)
      })
    })

    for (let obj of updateObjects) {
      it("should update a user's " + obj.field, (done) => {
        // Run the tests
        service.update({ [obj.field]: obj.value, baseProfileId: 706217 })
          .subscribe(res => {
            expect(true).toEqual(true)
            done()
          },
          err => {
            done.fail(err)
          }
        )
      })
    }
  })
})
