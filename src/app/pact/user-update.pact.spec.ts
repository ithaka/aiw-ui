/*eslint-disable*/
import { BaseRequestOptions, Response, RequestOptions, XHRBackend, ResponseOptions, RequestMethod } from '@angular/http';
import { TestBed, inject, getTestBed, async } from '@angular/core/testing';
import { PactWeb, Matchers} from '@pact-foundation/pact-web'
import { HttpClientModule, HttpClient } from '@angular/common/http'
import { map } from 'rxjs/operators'

// Project Dependencies
import { AccountService } from './../shared'

describe('PUT /api/secure/user/{{profileId}} #pact #updateuser', () => {

  let provider
  const validBaseProfileId = 500863455
  const fakeUserId = 12345

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
              headers: { 'Content-Type': Matchers.somethingLike('application/json') },
              body: body
            },
            willRespondWith: {
              status: 200
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
      // Empty Body
      interactions.push(
        provider.addInteraction({
          state: 'I am logged in as qapact@artstor.org',
          uponReceiving: "a request with an empty body",
          withRequest: {
            method: 'PUT',
            path: '/api/secure/user/' + validBaseProfileId,
            headers: { 'Content-Type': Matchers.somethingLike('application/json') },
            body: {}
          },
          willRespondWith: {
            status: 400,
            headers: { 'Content-Type': Matchers.somethingLike('application/json') },
            body: {
              message: 'EMPTY_REQUEST'
            }
          }
        })
      )
      // Invalid Field
      interactions.push(
        provider.addInteraction({
          state: 'I am logged in as qapact@artstor.org',
          uponReceiving: "a request with a non-updateable field",
          withRequest: {
            method: 'PUT',
            path: '/api/secure/user/' + validBaseProfileId,
            headers: { 'Content-Type': Matchers.somethingLike('application/json') },
            body: {
              cantUpdateThisHa: Matchers.somethingLike('new value'),
              anotherThingYouCantUpdate: Matchers.somethingLike('fizz bop')
            }
          },
          willRespondWith: {
            status: 400,
            headers: { 'Content-Type': Matchers.somethingLike('application/json') },
            body: {
              message: "INVALID_FIELD: 'cantUpdateThisHa'"
            }
          }
        })
      )
      // Invalid ID
      interactions.push(
        provider.addInteraction({
          state: 'I am logged in as qapact@artstor.org',
          uponReceiving: "a request with an invalid id",
          withRequest: {
            method: 'PUT',
            path: '/api/secure/user/' + fakeUserId,
            headers: { 'Content-Type': Matchers.somethingLike('application/json') },
            body: {
              [updateObjects[0].field]: Matchers.somethingLike(updateObjects[0].value)
            }
          },
          willRespondWith: {
            status: 404,
            headers: { 'Content-Type': Matchers.somethingLike('application/json') }
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
    // Test empty body
    it('should receive an error for an empty body', (done) => {
      service.update({ baseProfileId: validBaseProfileId })
      .subscribe(res => {
        done.fail('successful response received when failure was expected')
      },
      err => {
        expect(err.status).toEqual(400)
        expect(err.error.message).toEqual('EMPTY_REQUEST')
        done()
      })
    })
    // Test invalid field
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
        expect(err.error.message.indexOf('INVALID_FIELD')).toBeGreaterThan(-1)
        expect(err.error.message.indexOf('cantUpdateThisHa')).toBeGreaterThan(-1)
        done()
      })
    })
    // Test invalid profile id
    it('should receive an error when passing an invalid baseProfileId', (done) => {
      service.update({
        baseProfileId: fakeUserId,
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
