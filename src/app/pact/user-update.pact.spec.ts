/*eslint-disable*/
import {Http, HttpModule, BaseRequestOptions, Response, RequestOptions, XHRBackend, ResponseOptions, RequestMethod} from '@angular/http';
import {TestBed, inject, getTestBed, async} from '@angular/core/testing';
import { AccountService } from './../shared'
import { PactWeb, Matchers} from '@pact-foundation/pact-web'
import { HttpClientModule } from '@angular/common/http'

describe("PUT /api/v1/user pact", () => {

  let provider


  beforeAll(function(done) {
    provider = new PactWeb({ consumer: 'aiw', provider: 'auth-service' })

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

  describe("update user's first name", () => {
    const exampleUpdateResponse = {
      updated: {
        firstName: 'my updated name'
      }
    }

    beforeAll(function (done) {
      provider.addInteraction({
        uponReceiving: 'a request to update a user',
        withRequest: {
          method: 'PUT',
          path: '/api/v1/users'
        },
        willRespondWith: {
          status: 200,
          headers: { "Content-Type": "application/json" },
          body: Matchers.somethingLike(exampleUpdateResponse)
        }
      })
      .then(function () { done() }, function (err) { done.fail(err) })
    })

    it("should update a user", function(done) {
      let testName: string = 'a new first name!'

      //Run the tests
      service.update({ firstName: testName })
        .subscribe(res => {
          expect(res.updated.firstName).toEqual(testName)
          done()
        },
        err => {
        done.fail(err)
      })
    })
  })
})