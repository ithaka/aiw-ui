/*eslint-disable*/
import {Http, HttpModule, BaseRequestOptions, Response, RequestOptions, XHRBackend, ResponseOptions, RequestMethod} from '@angular/http';
import {TestBed, inject, getTestBed, async} from '@angular/core/testing';
import { AccountService } from './../shared'
import { PactWeb, Matchers} from '@pact-foundation/pact-web'
import { HttpClientModule } from '@angular/common/http'

describe("PUT /api/v1/user #pact #updateuser", () => {

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

    let body ={
      [updateObjects[0].field]:  Matchers.somethingLike(updateObjects[0].value)
    }

    beforeAll(function (done) {
      provider.addInteraction({
        uponReceiving: 'a request to update a user',
        withRequest: {
          method: 'PUT',
          path: '/api/v1/users',
          body: body
        },
        willRespondWith: {
          status: 200,
          headers: { "Content-Type": "application/json" },
          // body: Matchers.somethingLike(exampleUpdateResponse)
        }
      })
      .then(() => {
        return provider.addInteraction({
          uponReceiving: 'a request to update a user',
          withRequest: {
            method: 'PUT',
            path: '/api/v1/users',
            body: {
              [updateObjects[1].field]: Matchers.somethingLike(updateObjects[1].value)
            }
          },
          willRespondWith: {
            status: 200,
            headers: { "Content-Type": "application/json" }
          }
        })
      })
      .then(() => { done() })
      .catch((err) => { done.fail(err) })
    })

    for(let obj of updateObjects) {
      it("should update a user's " + obj.field, (done) => {
        //Run the tests
        service.update({ [obj.field]: obj.value })
          .subscribe(res => {
            expect(true).toEqual(true)
            done()
          },
          err => {
          done.fail(err)
        })
      })
    }

    // it("should update all of a users updateable properties", (done) => {
    //   let updateObj = {}
    //   // get one value for every object
    //   for(let obj of updateObjects) {
    //     updateObj[obj.field] = obj.value
    //   }

    //   service.update(updateObj)
    //   .subscribe(res => {
    //     for(let key in updateObj) {
    //       expect(res.updated[key]).toEqual(updateObj[key])
    //     }
    //     done()
    //   },
    //     err => {
    //     done.fail(err)
    //   })
    // })
  })
})