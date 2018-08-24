/*eslint-disable*/
import {Http, HttpModule, BaseRequestOptions, Response, RequestOptions, XHRBackend, ResponseOptions, RequestMethod} from '@angular/http';
import {TestBed, inject, getTestBed, async} from '@angular/core/testing';
import { AccountService } from './../shared'
import { PactWeb, Matchers} from '@pact-foundation/pact-web'
import { HttpClientModule } from '@angular/common/http'

describe('PUT /api/secure/user/{{profileId}} #pact #updateuser', () => {

  let provider
  const validBaseProfileId = 706217

  beforeAll(function(done) {
    provider = new PactWeb({ consumer: 'aiw-ui', provider: 'artaa_service', port: 1203 })

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
    }
  ]

  describe("update individual user properties", () => {

    beforeAll(function (done) {
      let interactions = []

      // create each interaction to be tested
      updateObjects.forEach((obj) => {
        let body = {
          [obj.field]: Matchers.somethingLike(obj.value)
        }

        interactions.push(
          provider.addInteraction({
            state: 'I am logged in as qapact@artstor.org',
            uponReceiving: "a request to update a user's " + obj.field,
            withRequest: {
              method: 'PUT',
              path: '/api/secure/user/' + validBaseProfileId,
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
        service.update({ [obj.field]: obj.value, baseProfileId: validBaseProfileId })
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

  describe('400 errors', () => {
    beforeAll((done) => {
      let interactions: Promise<any>[] = []

      interactions.push(
        provider.addInteraction({
          state: 'I am logged in as qapact@artstor.org',
          uponReceiving: "a request with an empty body",
          withRequest: {
            method: 'PUT',
            path: '/api/secure/user/' + validBaseProfileId,
            body: {}
          },
          willRespondWith: {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
            body: {
              error: 'EMPTY_REQUEST'
            }
          }
        })
      )

      interactions.push(
        provider.addInteraction({
          state: 'I am logged in as qapact@artstor.org',
          uponReceiving: "a request with a non-updateable field",
          withRequest: {
            method: 'PUT',
            path: '/api/secure/user/' + validBaseProfileId,
            body: {
              cantUpdateThisHa: Matchers.somethingLike('new value'),
              anotherThingYouCantUpdate: Matchers.somethingLike('fizz bop')
            }
          },
          willRespondWith: {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
            body: {
              error: "INVALID_FIELD",
              value: "cantUpdateThisHa, anotherThingYouCantUpdate"
            }
          }
        })
      )

      interactions.push(
        provider.addInteraction({
          state: 'I am logged in as qapact@artstor.org',
          uponReceiving: "a request with an invalid id",
          withRequest: {
            method: 'PUT',
            path: '/api/secure/user/abcdefg',
            body: {
              [updateObjects[0].field]: Matchers.somethingLike(updateObjects[0].value)
            }
          },
          willRespondWith: {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          }
        })
      )

      Promise.all(interactions)
      .then(() => {
        done()
      })
      .catch((err) => {
        done.fail(err)
      })
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

    it('should receive an error for an empty body', (done) => {
      service.update({ baseProfileId: validBaseProfileId })
      .subscribe(res => {
        done.fail('successful response received when failure was expected')
      },
      err => {
        expect(err.status).toEqual(400)
        expect(err.error.error).toEqual('EMPTY_REQUEST')
        done()
      })
    })

    it('should receive an error for an invalid field', (done) => {
      service.update({
        baseProfileId: validBaseProfileId,
        cantUpdateThisHa: 'a string here',
        anotherThingYouCantUpdate: 'another string here'
      })
      .subscribe(res => {
        done.fail('successful response received when failure was expected')
      },
      err => {
        expect(err.status).toEqual(400)
        expect(err.error.error).toEqual('INVALID_FIELD')
        done()
      })
    })

    it('should receive an error when passing an invalid baseProfileId', (done) => {
      service.update({
        baseProfileId: 'abcdefg',
        [updateObjects[0].field]: updateObjects[0].value
      })
      .subscribe(res => {
        done.fail('successful response received when failure was expected')
      },
      err => {
        done()
      })
    })
  })
})
